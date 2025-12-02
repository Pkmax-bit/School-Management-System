# Tính năng gán bài trắc nghiệm cho lớp học

## Tổng quan
Tính năng này cho phép giáo viên gán bài trắc nghiệm cho một hoặc nhiều lớp học cụ thể, giúp quản lý bài tập theo lớp một cách hiệu quả.

## Các thay đổi chính

### 1. Cập nhật cấu trúc dữ liệu Quiz
- Thêm trường `assignedClasses: string[]` vào type `Quiz`
- Lưu trữ danh sách ID của các lớp được gán bài

### 2. Component QuizBuilder
**File:** `frontend/src/components/assignments/QuizBuilder.tsx`

**Tính năng mới:**
- Giao diện chọn lớp học với checkbox
- Hiển thị thông tin lớp: tên, môn học, số học sinh
- Cho phép chọn nhiều lớp cùng lúc
- Hiển thị số lượng lớp đã chọn

**Giao diện:**
```typescript
// Phần chọn lớp học
<div className="space-y-2">
  <Label className="text-sm font-medium text-slate-700">Gán cho lớp học</Label>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {availableClasses.map((classItem) => (
      <div
        key={classItem.id}
        onClick={() => toggleClassAssignment(classItem.id)}
        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
          isAssigned
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {/* Nội dung lớp học */}
      </div>
    ))}
  </div>
</div>
```

### 3. Component QuizList
**File:** `frontend/src/components/assignments/QuizList.tsx`

**Tính năng mới:**
- Hiển thị danh sách lớp được gán cho mỗi bài trắc nghiệm
- Hiển thị badge cho từng lớp
- Icon Users để nhận biết phần gán lớp

**Giao diện:**
```typescript
{q.assignedClasses && q.assignedClasses.length > 0 && (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Users className="w-4 h-4" />
      <span>Gán cho lớp:</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {q.assignedClasses.map((classId) => (
        <Badge key={classId} variant="outline" className="text-xs">
          {getClassName(classId)}
        </Badge>
      ))}
    </div>
  </div>
)}
```

### 4. Component QuizPreviewModal
**File:** `frontend/src/components/assignments/QuizPreviewModal.tsx`

**Tính năng mới:**
- Hiển thị thông tin chi tiết về lớp được gán
- Card riêng cho phần "Lớp được gán bài"
- Thống kê thời gian, số lần làm, số câu hỏi

### 5. Trang Teacher Assignments
**File:** `frontend/src/app/teacher/assignments/page.tsx`

**Tính năng mới:**
- Mock data cho danh sách lớp học
- Truyền `availableClasses` cho các component con
- Cập nhật logic tạo và nhân bản quiz

**Mock data lớp học:**
```typescript
const mockClasses = [
  { id: 'class-1', name: '10A1', subject: 'Toán học', studentCount: 35 },
  { id: 'class-2', name: '10A2', subject: 'Vật lý', studentCount: 32 },
  { id: 'class-3', name: '11B1', subject: 'Hóa học', studentCount: 28 },
  { id: 'class-4', name: '11B2', subject: 'Sinh học', studentCount: 30 },
  { id: 'class-5', name: '12C1', subject: 'Toán học', studentCount: 25 },
];
```

## Cách sử dụng

### 1. Tạo bài trắc nghiệm mới
1. Vào trang "Bài tập" trong Teacher Dashboard
2. Nhấn "Tạo bài mới"
3. Điền thông tin cơ bản (tiêu đề, mô tả, thời gian...)
4. **Chọn lớp học:** Click vào các lớp muốn gán bài
5. Thêm câu hỏi và đáp án
6. Lưu bài trắc nghiệm

### 2. Chỉnh sửa bài trắc nghiệm
1. Tìm bài trắc nghiệm trong danh sách
2. Nhấn "Sửa"
3. Thay đổi lớp được gán (thêm/bớt lớp)
4. Cập nhật các thông tin khác
5. Lưu thay đổi

### 3. Xem trước bài trắc nghiệm
1. Nhấn "Xem" trên bài trắc nghiệm
2. Xem thông tin chi tiết bao gồm:
   - Thời gian làm bài
   - Số lần được phép làm
   - Số câu hỏi
   - **Danh sách lớp được gán**

## Lợi ích

### 1. Quản lý tập trung
- Một bài trắc nghiệm có thể gán cho nhiều lớp
- Dễ dàng theo dõi bài tập theo từng lớp
- Tránh tạo trùng lặp bài tập

### 2. Linh hoạt
- Có thể gán/bỏ gán lớp bất kỳ lúc nào
- Nhân bản bài trắc nghiệm giữ nguyên danh sách lớp
- Hiển thị rõ ràng lớp nào đã được gán

### 3. Thông tin chi tiết
- Hiển thị môn học và số học sinh của mỗi lớp
- Thống kê tổng quan về bài trắc nghiệm
- Giao diện trực quan, dễ sử dụng

## Cấu trúc dữ liệu

### Quiz Type
```typescript
export type Quiz = {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  attemptsAllowed?: number;
  assignedClasses: string[]; // Mới: Danh sách ID lớp
  questions: Question[];
};
```

### Class Type
```typescript
interface Class {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
}
```

## Tương lai

### Tính năng có thể mở rộng:
1. **Lọc bài tập theo lớp:** Hiển thị chỉ bài tập của lớp được chọn
2. **Thời gian gán:** Gán bài với thời gian bắt đầu/kết thúc cụ thể
3. **Phân quyền:** Chỉ giáo viên dạy lớp mới có thể gán bài cho lớp đó
4. **Thông báo:** Tự động thông báo cho học sinh khi có bài tập mới
5. **Báo cáo:** Thống kê kết quả làm bài theo từng lớp

## Kết luận
Tính năng gán bài trắc nghiệm cho lớp học đã được tích hợp hoàn chỉnh vào hệ thống, giúp giáo viên quản lý bài tập một cách hiệu quả và có tổ chức hơn.





