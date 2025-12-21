/**
 * Script test tự động tạo template với 2 bài học và 2 bài tập
 * Chạy script này trong browser console sau khi đăng nhập
 */

(async function testCreateTemplate() {
    console.log('🧪 Bắt đầu test tạo template với 2 bài học và 2 bài tập...\n');
    
    const API_BASE_URL = 'http://localhost:8000';
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    
    if (!token) {
        console.error('❌ Không tìm thấy token. Vui lòng đăng nhập trước.');
        return;
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Bước 1: Lấy danh sách subjects và teachers
        console.log('📋 Bước 1: Lấy danh sách môn học và giáo viên...');
        const [subjectsRes, teachersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/subjects/`, { headers }),
            fetch(`${API_BASE_URL}/api/teachers/`, { headers })
        ]);
        
        const subjects = await subjectsRes.json();
        const teachers = await teachersRes.json();
        
        const subjectId = subjects && subjects.length > 0 ? subjects[0].id : null;
        const teacherId = teachers && teachers.length > 0 ? teachers[0].id : null;
        
        console.log(`✅ Tìm thấy ${subjects.length} môn học, ${teachers.length} giáo viên`);
        
        // Bước 2: Tạo template
        console.log('\n📝 Bước 2: Tạo template...');
        const templateData = {
            name: 'Template Test - Toán lớp 10',
            description: 'Template test với 2 bài học và 2 bài tập',
            capacity: 30,
            subject_id: subjectId
        };
        
        const templateRes = await fetch(`${API_BASE_URL}/api/template-classrooms/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(templateData)
        });
        
        if (!templateRes.ok) {
            const error = await templateRes.text();
            throw new Error(`Lỗi tạo template: ${templateRes.status} - ${error}`);
        }
        
        const template = await templateRes.json();
        const templateId = template.id;
        console.log(`✅ Template đã được tạo: ${template.name} (ID: ${templateId})`);
        
        // Bước 3: Tạo 2 bài học
        console.log('\n📚 Bước 3: Tạo 2 bài học...');
        
        const lessons = [
            {
                title: 'Bài học 1: Giới thiệu về Toán học',
                description: 'Bài học giới thiệu các khái niệm cơ bản về toán học',
                sort_order: 1
            },
            {
                title: 'Bài học 2: Phép tính cơ bản',
                description: 'Học về các phép tính cộng, trừ, nhân, chia',
                sort_order: 2
            }
        ];
        
        // Tạo file giả để upload
        const createFakeFile = (name) => {
            const content = 'Fake PDF content for testing';
            return new Blob([content], { type: 'application/pdf' });
        };
        
        for (const lesson of lessons) {
            const formData = new FormData();
            formData.append('classroom_id', templateId);
            formData.append('title', lesson.title);
            formData.append('description', lesson.description);
            formData.append('sort_order', lesson.sort_order.toString());
            
            // Tạo file giả
            const fakeFile = createFakeFile(`${lesson.title}.pdf`);
            formData.append('files', fakeFile, `${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
            
            const lessonRes = await fetch(`${API_BASE_URL}/api/lessons/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!lessonRes.ok) {
                const error = await lessonRes.text();
                console.warn(`⚠️ Lỗi tạo bài học "${lesson.title}": ${lessonRes.status} - ${error}`);
            } else {
                const lessonData = await lessonRes.json();
                console.log(`✅ Đã tạo bài học: ${lesson.title}`);
            }
        }
        
        // Bước 4: Tạo 2 bài tập
        console.log('\n📝 Bước 4: Tạo 2 bài tập...');
        
        const assignments = [
            {
                title: 'Bài tập 1: Trắc nghiệm Toán cơ bản',
                description: 'Bài tập trắc nghiệm về các phép tính cơ bản',
                assignment_type: 'multiple_choice',
                total_points: 100.0,
                time_limit_minutes: 60
            },
            {
                title: 'Bài tập 2: Tự luận - Giải bài toán',
                description: 'Bài tập tự luận yêu cầu giải các bài toán',
                assignment_type: 'essay',
                total_points: 100.0,
                time_limit_minutes: 0
            }
        ];
        
        const assignmentIds = [];
        
        for (const assignment of assignments) {
            const assignmentData = {
                ...assignment,
                subject_id: subjectId,
                teacher_id: teacherId
            };
            
            const assignmentRes = await fetch(`${API_BASE_URL}/api/assignments/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(assignmentData)
            });
            
            if (!assignmentRes.ok) {
                const error = await assignmentRes.text();
                console.warn(`⚠️ Lỗi tạo bài tập "${assignment.title}": ${assignmentRes.status} - ${error}`);
            } else {
                const assignmentData = await assignmentRes.json();
                assignmentIds.push(assignmentData.id);
                console.log(`✅ Đã tạo bài tập: ${assignment.title} (ID: ${assignmentData.id})`);
                
                // Gán bài tập cho template
                const assignRes = await fetch(`${API_BASE_URL}/api/assignments/${assignmentData.id}/classrooms`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify([templateId])
                });
                
                if (assignRes.ok) {
                    console.log(`  ✅ Đã gán bài tập cho template`);
                } else {
                    console.warn(`  ⚠️ Không thể gán bài tập cho template`);
                }
            }
        }
        
        // Bước 5: Kiểm tra kết quả
        console.log('\n🔍 Bước 5: Kiểm tra kết quả...');
        
        const [lessonsRes, assignmentsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/template-classrooms/${templateId}/lessons`, { headers }),
            fetch(`${API_BASE_URL}/api/template-classrooms/${templateId}/assignments`, { headers })
        ]);
        
        const templateLessons = await lessonsRes.json();
        const templateAssignments = await assignmentsRes.json();
        
        console.log(`\n📊 KẾT QUẢ:`);
        console.log(`✅ Template ID: ${templateId}`);
        console.log(`✅ Số bài học: ${templateLessons.length}/2`);
        console.log(`✅ Số bài tập: ${templateAssignments.length}/2`);
        
        if (templateLessons.length > 0) {
            console.log(`\n📚 Danh sách bài học:`);
            templateLessons.forEach((lesson, index) => {
                console.log(`  ${index + 1}. ${lesson.title}`);
            });
        }
        
        if (templateAssignments.length > 0) {
            console.log(`\n📝 Danh sách bài tập:`);
            templateAssignments.forEach((assignment, index) => {
                console.log(`  ${index + 1}. ${assignment.title} (${assignment.assignment_type})`);
            });
        }
        
        if (templateLessons.length === 2 && templateAssignments.length === 2) {
            console.log(`\n🎉 TEST THÀNH CÔNG! Template đã có đủ 2 bài học và 2 bài tập.`);
        } else {
            console.log(`\n⚠️ TEST CHƯA HOÀN TẤT. Cần kiểm tra lại.`);
        }
        
        console.log(`\n🔗 Xem template tại: http://localhost:3000/documents`);
        console.log(`🔗 Xem chi tiết template tại: http://localhost:3000/classrooms/${templateId}`);
        
        return {
            templateId,
            lessonsCount: templateLessons.length,
            assignmentsCount: templateAssignments.length,
            success: templateLessons.length === 2 && templateAssignments.length === 2
        };
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error);
        return { error: error.message };
    }
})();

