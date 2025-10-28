// Test script to check schedule data
// Chạy script này trong browser console khi đang ở trang schedule

console.log('=== CHECKING SCHEDULE DATA ===');

// 1. Check campuses
async function checkCampuses() {
    try {
        const response = await fetch('/api/campuses', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        console.log('CAMPUSES:', data);
        return data;
    } catch (error) {
        console.error('Error fetching campuses:', error);
        return [];
    }
}

// 2. Check classrooms
async function checkClassrooms() {
    try {
        const response = await fetch('/api/classrooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        console.log('ALL CLASSROOMS:', data);
        return data;
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        return [];
    }
}

// 3. Check classrooms by campus
async function checkClassroomsByCampus(campusId) {
    try {
        const response = await fetch(`/api/classrooms?campus_id=${campusId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        console.log(`CLASSROOMS FOR CAMPUS ${campusId}:`, data);
        return data;
    } catch (error) {
        console.error(`Error fetching classrooms for campus ${campusId}:`, error);
        return [];
    }
}

// 4. Check subjects
async function checkSubjects() {
    try {
        const response = await fetch('/api/subjects', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        console.log('SUBJECTS:', data);
        return data;
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
    }
}

// 5. Check teachers
async function checkTeachers() {
    try {
        const response = await fetch('/api/teachers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });
        const data = await response.json();
        console.log('TEACHERS:', data);
        return data;
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
    }
}

// Main function
async function main() {
    console.log('Starting data check...');
    
    // Check all data
    const campuses = await checkCampuses();
    const classrooms = await checkClassrooms();
    const subjects = await checkSubjects();
    const teachers = await checkTeachers();
    
    // Check classrooms by campus
    for (const campus of campuses) {
        await checkClassroomsByCampus(campus.id);
    }
    
    // Summary
    console.log('=== SUMMARY ===');
    console.log(`Campuses: ${campuses.length}`);
    console.log(`Classrooms: ${classrooms.length}`);
    console.log(`Subjects: ${subjects.length}`);
    console.log(`Teachers: ${teachers.length}`);
    
    // Check classroom-campus relationships
    console.log('=== CLASSROOM-CAMPUS RELATIONSHIPS ===');
    const campusCounts = {};
    for (const classroom of classrooms) {
        const campusId = classroom.campus_id;
        if (campusId) {
            campusCounts[campusId] = (campusCounts[campusId] || 0) + 1;
        } else {
            campusCounts['NULL'] = (campusCounts['NULL'] || 0) + 1;
        }
    }
    
    for (const [campusId, count] of Object.entries(campusCounts)) {
        if (campusId === 'NULL') {
            console.log(`Not assigned to any campus: ${count}`);
        } else {
            const campus = campuses.find(c => c.id === campusId);
            const campusName = campus ? campus.name : 'Unknown';
            console.log(`${campusName} (${campusId}): ${count}`);
        }
    }
}

// Run the check
main();
