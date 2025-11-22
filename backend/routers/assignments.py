"""
Assignments Router
Router cho quản lý bài tập (Supabase)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from supabase import Client

from database import get_db
from models.user import User, UserRole
from routers.auth import get_current_user

router = APIRouter()

def get_teacher_id_from_user(supabase: Client, user_id: str) -> Optional[str]:
    """Lấy teacher_id từ user_id"""
    try:
        result = supabase.table("teachers").select("id").eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        return None
    except Exception as e:
        print(f"Error getting teacher_id: {e}")
        return None

def validate_classrooms_belong_to_teacher(
    supabase: Client, 
    classroom_ids: List[str], 
    teacher_id: str
) -> bool:
    """Kiểm tra tất cả các lớp có thuộc về giáo viên không"""
    if not classroom_ids:
        return True
    
    try:
        # Lấy tất cả classrooms
        result = supabase.table("classrooms").select("id, teacher_id").in_("id", classroom_ids).execute()
        classrooms = result.data or []
        
        # Kiểm tra tất cả đều thuộc về giáo viên này
        for classroom in classrooms:
            if classroom.get("teacher_id") != teacher_id:
                return False
        
        # Kiểm tra số lượng (đảm bảo tất cả classroom_ids đều tồn tại)
        if len(classrooms) != len(classroom_ids):
            return False
        
        return True
    except Exception as e:
        print(f"Error validating classrooms: {e}")
        return False

# ========== Request/Response Models ==========

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: str
    teacher_id: str
    assignment_type: str  # multiple_choice, essay
    total_points: float = 100.0
    start_date: Optional[str] = None  # ISO format string - ngày giờ mở bài tập
    due_date: Optional[str] = None  # ISO format string
    time_limit_minutes: int = 0
    attempts_allowed: int = 1
    shuffle_questions: bool = False
    classroom_ids: List[str] = []  # Danh sách lớp học được gán

class AssignmentQuestionCreate(BaseModel):
    question_text: str
    question_type: str  # multiple_choice, essay
    points: float = 1.0
    options: Optional[List[Dict[str, Any]]] = None  # For multiple choice: [{"id": "A", "text": "..."}]
    correct_answer: Optional[str] = None  # For multiple choice: "A", "B", "C", "D"
    order_index: int = 0
    image_url: Optional[str] = None  # URL hình ảnh đã upload
    attachment_link: Optional[str] = None  # Link đính kèm

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    total_points: Optional[float] = None
    start_date: Optional[str] = None  # ISO format string - ngày giờ mở bài tập
    due_date: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    attempts_allowed: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    is_active: Optional[bool] = None

class AssignmentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    subject_id: str
    teacher_id: str
    assignment_type: str
    total_points: float
    start_date: Optional[str] = None  # ISO format string - ngày giờ mở bài tập
    due_date: Optional[str]
    time_limit_minutes: int
    attempts_allowed: int
    shuffle_questions: bool
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None
    classroom_ids: Optional[List[str]] = []  # Danh sách lớp được gán

class AssignmentQuestionResponse(BaseModel):
    id: str
    assignment_id: str
    question_text: str
    question_type: str
    points: float
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    order_index: int
    image_url: Optional[str] = None
    attachment_link: Optional[str] = None
    created_at: str

class AssignmentSubmissionCreate(BaseModel):
    assignment_id: str
    student_id: str
    answers: Dict[str, Any]  # {"question_id": "answer"}
    files: Optional[List[Dict[str, Any]]] = []  # [{"name": "...", "url": "...", "type": "word|zip|other", "size": 12345}]
    links: Optional[List[str]] = []  # ["https://...", "https://..."]

class AssignmentSubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    answers: Dict[str, Any]
    score: Optional[float] = None
    is_graded: bool
    submitted_at: str
    graded_at: Optional[str] = None
    feedback: Optional[str] = None  # Teacher feedback

    
# ========== Assignment CRUD ==========

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Tạo bài tập mới (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Lấy teacher_id từ current_user
        teacher_id = None
        if current_user.role == UserRole.TEACHER:
            teacher_id = get_teacher_id_from_user(supabase, current_user.id)
            if not teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Teacher profile not found"
                )
        elif current_user.role == UserRole.ADMIN:
            # Admin có thể dùng teacher_id từ request
            teacher_id = assignment_data.teacher_id
        else:
            teacher_id = assignment_data.teacher_id
        
        # Validate các lớp học phải thuộc về giáo viên này
        if assignment_data.classroom_ids and teacher_id:
            if not validate_classrooms_belong_to_teacher(supabase, assignment_data.classroom_ids, teacher_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn chỉ có thể gán bài tập cho các lớp mà bạn đang dạy"
                )
        
        # Validate start_date < due_date nếu cả hai đều có giá trị
        if assignment_data.start_date and assignment_data.due_date:
            from datetime import datetime
            try:
                start_dt = datetime.fromisoformat(assignment_data.start_date.replace('Z', '+00:00'))
                due_dt = datetime.fromisoformat(assignment_data.due_date.replace('Z', '+00:00'))
                if start_dt >= due_dt:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ngày giờ mở bài tập phải trước ngày giờ hạn nộp"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Định dạng ngày giờ không hợp lệ"
                )
        
        # Tạo assignment
        assignment_dict = {
            "title": assignment_data.title,
            "description": assignment_data.description,
            "subject_id": assignment_data.subject_id,
            "teacher_id": teacher_id,
            "assignment_type": assignment_data.assignment_type,
            "total_points": assignment_data.total_points,
            "start_date": assignment_data.start_date,
            "due_date": assignment_data.due_date,
            "time_limit_minutes": assignment_data.time_limit_minutes,
            "attempts_allowed": assignment_data.attempts_allowed,
            "shuffle_questions": assignment_data.shuffle_questions,
            "is_active": True
        }
        
        result = supabase.table("assignments").insert(assignment_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create assignment"
            )
        
        assignment = result.data[0]
        assignment_id = assignment["id"]
        
        # Gán cho các lớp học
        if assignment_data.classroom_ids:
            classroom_assignments = [
                {"assignment_id": assignment_id, "classroom_id": class_id}
                for class_id in assignment_data.classroom_ids
            ]
            supabase.table("assignment_classrooms").insert(classroom_assignments).execute()
        
        # Lấy danh sách lớp được gán
        class_result = supabase.table("assignment_classrooms").select("classroom_id").eq("assignment_id", assignment_id).execute()
        classroom_ids = [item["classroom_id"] for item in (class_result.data or [])]
        
        assignment["classroom_ids"] = classroom_ids
        return AssignmentResponse(**assignment)
        
    except Exception as e:
        print(f"Error creating assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create assignment: {str(e)}"
        )

@router.get("/", response_model=List[AssignmentResponse])
async def get_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    classroom_id: Optional[str] = Query(None),
    teacher_id: Optional[str] = Query(None),
    assignment_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách bài tập"""
    try:
        # Nếu filter theo classroom_id, cần join với assignment_classrooms
        if classroom_id:
            # Lấy danh sách assignment_id từ assignment_classrooms
            class_result = supabase.table("assignment_classrooms").select("assignment_id").eq("classroom_id", classroom_id).execute()
            assignment_ids = [item["assignment_id"] for item in (class_result.data or [])]
            
            if not assignment_ids:
                return []
            
            # Query assignments với filter
            query = supabase.table("assignments").select("*").in_("id", assignment_ids)
        else:
            query = supabase.table("assignments").select("*")
        
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)
        
        if assignment_type:
            query = query.eq("assignment_type", assignment_type)
        
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        assignments = result.data or []
        
        # Lấy danh sách lớp cho mỗi assignment
        for assignment in assignments:
            class_result = supabase.table("assignment_classrooms").select("classroom_id").eq("assignment_id", assignment["id"]).execute()
            assignment["classroom_ids"] = [item["classroom_id"] for item in (class_result.data or [])]
        
        return [AssignmentResponse(**a) for a in assignments]
        
    except Exception as e:
        print(f"Error fetching assignments: {e}")
        return []

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thông tin một bài tập"""
    try:
        result = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = result.data[0]
        
        # Lấy danh sách lớp được gán
        class_result = supabase.table("assignment_classrooms").select("classroom_id").eq("assignment_id", assignment_id).execute()
        assignment["classroom_ids"] = [item["classroom_id"] for item in (class_result.data or [])]
        
        return AssignmentResponse(**assignment)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assignment: {str(e)}"
        )

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    assignment_data: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật bài tập (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra assignment có tồn tại không và lấy teacher_id
        check_result = supabase.table("assignments").select("id, teacher_id").eq("id", assignment_id).execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment_teacher_id = check_result.data[0]["teacher_id"]
        
        # Kiểm tra quyền: giáo viên chỉ có thể sửa bài tập của mình
        if current_user.role == UserRole.TEACHER:
            teacher_id = get_teacher_id_from_user(supabase, current_user.id)
            if not teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Teacher profile not found"
                )
            if assignment_teacher_id != teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn chỉ có thể chỉnh sửa bài tập của chính mình"
                )
        
        # Validate start_date < due_date nếu cả hai đều có giá trị
        if assignment_data.start_date is not None or assignment_data.due_date is not None:
            # Lấy giá trị hiện tại từ database nếu không được cung cấp
            current_assignment = supabase.table("assignments").select("start_date, due_date").eq("id", assignment_id).execute()
            if current_assignment.data:
                current_start = current_assignment.data[0].get("start_date")
                current_due = current_assignment.data[0].get("due_date")
                
                start_date = assignment_data.start_date if assignment_data.start_date is not None else current_start
                due_date = assignment_data.due_date if assignment_data.due_date is not None else current_due
                
                if start_date and due_date:
                    from datetime import datetime
                    try:
                        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                        due_dt = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                        if start_dt >= due_dt:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Ngày giờ mở bài tập phải trước ngày giờ hạn nộp"
                            )
                    except ValueError:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Định dạng ngày giờ không hợp lệ"
                        )
        
        # Cập nhật
        update_dict = assignment_data.dict(exclude_unset=True)
        result = supabase.table("assignments").update(update_dict).eq("id", assignment_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update assignment"
            )
        
        assignment = result.data[0]
        
        # Lấy danh sách lớp được gán
        class_result = supabase.table("assignment_classrooms").select("classroom_id").eq("assignment_id", assignment_id).execute()
        assignment["classroom_ids"] = [item["classroom_id"] for item in (class_result.data or [])]
        
        return AssignmentResponse(**assignment)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update assignment: {str(e)}"
        )

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa bài tập (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Xóa assignment (cascade sẽ xóa assignment_classrooms và assignment_questions)
        result = supabase.table("assignments").delete().eq("id", assignment_id).execute()
        
        return {"message": "Assignment deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete assignment: {str(e)}"
        )

# ========== Assignment Classrooms ==========

@router.post("/{assignment_id}/classrooms")
async def assign_classrooms(
    assignment_id: str,
    classroom_ids: List[str],
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Gán bài tập cho các lớp học"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra assignment có tồn tại và thuộc về giáo viên này không
        assignment_result = supabase.table("assignments").select("teacher_id").eq("id", assignment_id).execute()
        if not assignment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment_teacher_id = assignment_result.data[0]["teacher_id"]
        
        # Lấy teacher_id từ current_user
        teacher_id = None
        if current_user.role == UserRole.TEACHER:
            teacher_id = get_teacher_id_from_user(supabase, current_user.id)
            if not teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Teacher profile not found"
                )
            # Kiểm tra assignment có thuộc về giáo viên này không
            if assignment_teacher_id != teacher_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn chỉ có thể chỉnh sửa bài tập của chính mình"
                )
        else:
            teacher_id = assignment_teacher_id
        
        # Validate các lớp học phải thuộc về giáo viên này
        if classroom_ids:
            if not validate_classrooms_belong_to_teacher(supabase, classroom_ids, teacher_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn chỉ có thể gán bài tập cho các lớp mà bạn đang dạy"
                )
        
        # Xóa các gán cũ
        supabase.table("assignment_classrooms").delete().eq("assignment_id", assignment_id).execute()
        
        # Thêm các gán mới
        if classroom_ids:
            classroom_assignments = [
                {"assignment_id": assignment_id, "classroom_id": class_id}
                for class_id in classroom_ids
            ]
            supabase.table("assignment_classrooms").insert(classroom_assignments).execute()
        
        return {"message": "Classrooms assigned successfully"}
        
    except Exception as e:
        print(f"Error assigning classrooms: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign classrooms: {str(e)}"
        )

@router.get("/{assignment_id}/classrooms")
async def get_assignment_classrooms(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách lớp học được gán cho bài tập"""
    try:
        result = supabase.table("assignment_classrooms").select("classroom_id").eq("assignment_id", assignment_id).execute()
        classroom_ids = [item["classroom_id"] for item in (result.data or [])]
        return {"classroom_ids": classroom_ids}
        
    except Exception as e:
        print(f"Error fetching assignment classrooms: {e}")
        return {"classroom_ids": []}

# ========== Assignment Questions ==========

@router.post("/{assignment_id}/questions", response_model=AssignmentQuestionResponse)
async def add_question(
    assignment_id: str,
    question_data: AssignmentQuestionCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Thêm câu hỏi vào bài tập"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra assignment có tồn tại không
        check_result = supabase.table("assignments").select("id").eq("id", assignment_id).execute()
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
    
        question_dict = {
            "assignment_id": assignment_id,
            "question_text": question_data.question_text,
            "question_type": question_data.question_type,
            "points": question_data.points,
            "options": question_data.options,
            "correct_answer": question_data.correct_answer,
            "order_index": question_data.order_index,
            "image_url": question_data.image_url,
            "attachment_link": question_data.attachment_link
        }
        
        result = supabase.table("assignment_questions").insert(question_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create question"
            )
        
        return AssignmentQuestionResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create question: {str(e)}"
        )

@router.get("/{assignment_id}/questions", response_model=List[AssignmentQuestionResponse])
async def get_questions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách câu hỏi của bài tập"""
    try:
        result = supabase.table("assignment_questions").select("*").eq("assignment_id", assignment_id).order("order_index").execute()
        questions = result.data or []
        return [AssignmentQuestionResponse(**q) for q in questions]
        
    except Exception as e:
        print(f"Error fetching questions: {e}")
        return []

@router.put("/{assignment_id}/questions/{question_id}", response_model=AssignmentQuestionResponse)
async def update_question(
    assignment_id: str,
    question_id: str,
    question_data: AssignmentQuestionCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Cập nhật câu hỏi"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        update_dict = {
            "question_text": question_data.question_text,
            "question_type": question_data.question_type,
            "points": question_data.points,
            "options": question_data.options,
            "correct_answer": question_data.correct_answer,
            "order_index": question_data.order_index,
            "image_url": question_data.image_url,
            "attachment_link": question_data.attachment_link
        }
        
        result = supabase.table("assignment_questions").update(update_dict).eq("id", question_id).eq("assignment_id", assignment_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        return AssignmentQuestionResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update question: {str(e)}"
        )

@router.delete("/{assignment_id}/questions/{question_id}")
async def delete_question(
    assignment_id: str,
    question_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Xóa câu hỏi"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        supabase.table("assignment_questions").delete().eq("id", question_id).eq("assignment_id", assignment_id).execute()
        return {"message": "Question deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete question: {str(e)}"
        )

# ========== Assignment Submissions ==========

@router.post("/{assignment_id}/submit", response_model=AssignmentSubmissionResponse)
async def submit_assignment(
    assignment_id: str,
    submission_data: AssignmentSubmissionCreate,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Nộp bài tập (chỉ học sinh) - với auto-grading cho multiple choice"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Kiểm tra assignment có tồn tại không và lấy thông tin
        assignment_result = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        if not assignment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = assignment_result.data[0]
        
        # Kiểm tra hạn nộp
        if assignment.get("due_date"):
            from datetime import datetime
            due_date = datetime.fromisoformat(assignment["due_date"].replace("Z", "+00:00"))
            now = datetime.now(due_date.tzinfo) if due_date.tzinfo else datetime.now()
            if now > due_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Đã quá hạn nộp bài"
                )
        
        # Kiểm tra số lần nộp
        existing_submissions = supabase.table("assignment_submissions").select("id").eq("assignment_id", assignment_id).eq("student_id", submission_data.student_id).execute()
        attempts_allowed = assignment.get("attempts_allowed", 1)
        
        if existing_submissions.data and len(existing_submissions.data) >= attempts_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bạn đã hết lượt làm bài (tối đa {attempts_allowed} lần)"
            )
        
        # Auto-grading cho multiple choice
        score = None
        is_graded = False
        
        if assignment["assignment_type"] == "multiple_choice":
            # Lấy danh sách câu hỏi và đáp án đúng
            questions_result = supabase.table("assignment_questions").select("*").eq("assignment_id", assignment_id).execute()
            questions = questions_result.data or []
            
            if questions:
                total_points = 0
                earned_points = 0
                
                for question in questions:
                    question_id = question["id"]
                    correct_answer = question.get("correct_answer")
                    points = question.get("points", 0)
                    
                    total_points += points
                    
                    # Kiểm tra câu trả lời của học sinh
                    student_answer = submission_data.answers.get(question_id)
                    
                    if student_answer and correct_answer:
                        # So sánh đáp án (case-insensitive)
                        if str(student_answer).strip().upper() == str(correct_answer).strip().upper():
                            earned_points += points
                
                # Tính điểm phần trăm
                if total_points > 0:
                    score = (earned_points / total_points) * assignment.get("total_points", 100)
                else:
                    score = 0
                
                is_graded = True
        
        submission_dict = {
            "assignment_id": assignment_id,
            "student_id": submission_data.student_id,
            "answers": submission_data.answers,
            "files": submission_data.files or [],
            "links": submission_data.links or [],
            "score": score,
            "is_graded": is_graded
        }
        
        result = supabase.table("assignment_submissions").insert(submission_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit assignment"
            )
        
        return AssignmentSubmissionResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit assignment: {str(e)}"
        )

@router.get("/{assignment_id}/submissions", response_model=List[AssignmentSubmissionResponse])
async def get_submissions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy danh sách bài nộp (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        result = supabase.table("assignment_submissions").select("*").eq("assignment_id", assignment_id).order("submitted_at", desc=True).execute()
        submissions = result.data or []
        return [AssignmentSubmissionResponse(**s) for s in submissions]
        
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return []

# ========== Manual Grading ==========

class GradeSubmissionRequest(BaseModel):
    score: float
    feedback: Optional[str] = None

@router.put("/{assignment_id}/submissions/{submission_id}/grade")
async def grade_submission(
    assignment_id: str,
    submission_id: str,
    grade_data: GradeSubmissionRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Chấm điểm thủ công cho bài tập (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        from datetime import datetime
        
        # Kiểm tra submission có tồn tại không
        submission_result = supabase.table("assignment_submissions").select("*").eq("id", submission_id).eq("assignment_id", assignment_id).execute()
        if not submission_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        
        # Cập nhật điểm và feedback
        update_data = {
            "score": grade_data.score,
            "feedback": grade_data.feedback,
            "is_graded": True,
            "graded_at": datetime.now().isoformat()
        }
        
        result = supabase.table("assignment_submissions").update(update_data).eq("id", submission_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to grade submission"
            )
        
        return {"message": "Submission graded successfully", "submission": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error grading submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to grade submission: {str(e)}"
        )

# ========== Assignment Statistics ==========

@router.get("/{assignment_id}/statistics")
async def get_assignment_statistics(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_db)
):
    """Lấy thống kê bài tập (chỉ giáo viên)"""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    try:
        # Lấy thông tin assignment
        assignment_result = supabase.table("assignments").select("*").eq("id", assignment_id).execute()
        if not assignment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        assignment = assignment_result.data[0]
        
        # Lấy danh sách lớp được gán
        classroom_ids = assignment.get("classroom_ids", [])
        
        # Đếm tổng số học sinh trong các lớp
        total_students = 0
        if classroom_ids:
            students_result = supabase.table("students").select("id").in_("classroom_id", classroom_ids).execute()
            total_students = len(students_result.data or [])
        
        # Lấy danh sách submissions
        submissions_result = supabase.table("assignment_submissions").select("*").eq("assignment_id", assignment_id).execute()
        submissions = submissions_result.data or []
        
        # Tính toán thống kê
        total_submissions = len(submissions)
        graded_submissions = [s for s in submissions if s.get("is_graded")]
        total_graded = len(graded_submissions)
        
        # Tính điểm trung bình
        average_score = None
        if graded_submissions:
            scores = [s.get("score", 0) for s in graded_submissions if s.get("score") is not None]
            if scores:
                average_score = sum(scores) / len(scores)
        
        # Tính tỷ lệ hoàn thành
        completion_rate = (total_submissions / total_students * 100) if total_students > 0 else 0
        
        # Phân phối điểm
        score_distribution = {
            "excellent": 0,  # >= 90
            "good": 0,       # 80-89
            "average": 0,    # 70-79
            "below_average": 0,  # 60-69
            "poor": 0        # < 60
        }
        
        for submission in graded_submissions:
            score = submission.get("score")
            if score is not None:
                percentage = (score / assignment.get("total_points", 100)) * 100
                if percentage >= 90:
                    score_distribution["excellent"] += 1
                elif percentage >= 80:
                    score_distribution["good"] += 1
                elif percentage >= 70:
                    score_distribution["average"] += 1
                elif percentage >= 60:
                    score_distribution["below_average"] += 1
                else:
                    score_distribution["poor"] += 1
        
        return {
            "assignment_id": assignment_id,
            "assignment_title": assignment.get("title"),
            "total_students": total_students,
            "total_submissions": total_submissions,
            "total_graded": total_graded,
            "completion_rate": round(completion_rate, 2),
            "average_score": round(average_score, 2) if average_score is not None else None,
            "score_distribution": score_distribution,
            "pending_grading": total_submissions - total_graded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )
