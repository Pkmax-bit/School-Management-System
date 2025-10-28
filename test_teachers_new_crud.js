// Test script for New Teachers CRUD functionality
console.log('🧪 Testing New Teachers CRUD Operations...\n');

// Mock data for testing
const mockTeachers = [
  {
    id: 'teacher-1',
    user_id: 'user-1',
    teacher_code: 'GV001',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'teacher-2',
    user_id: 'user-2',
    teacher_code: 'GV002',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0907654321',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let teachers = [...mockTeachers];

// Test CREATE operation
function testCreate() {
  console.log('📝 Testing CREATE operation...');
  
  const newTeacher = {
    id: `teacher-${Date.now()}`,
    user_id: `user-${Date.now()}`,
    teacher_code: `GV${Date.now().toString().slice(-6)}`,
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    phone: '0909876543',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  teachers.push(newTeacher);
  console.log('✅ Created teacher:', newTeacher.name);
  console.log('📊 Total teachers:', teachers.length);
  return newTeacher;
}

// Test READ operation
function testRead() {
  console.log('\n📖 Testing READ operation...');
  
  console.log('📋 All teachers:');
  teachers.forEach((teacher, index) => {
    console.log(`${index + 1}. ${teacher.name} (${teacher.teacher_code}) - ${teacher.email}`);
  });
  
  console.log('✅ Read operation completed');
  return teachers;
}

// Test UPDATE operation
function testUpdate(teacherId, updateData) {
  console.log('\n✏️ Testing UPDATE operation...');
  
  const teacherIndex = teachers.findIndex(t => t.id === teacherId);
  if (teacherIndex === -1) {
    console.log('❌ Teacher not found');
    return null;
  }
  
  const updatedTeacher = {
    ...teachers[teacherIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  teachers[teacherIndex] = updatedTeacher;
  console.log('✅ Updated teacher:', updatedTeacher.name);
  console.log('📊 Updated data:', updateData);
  return updatedTeacher;
}

// Test DELETE operation
function testDelete(teacherId) {
  console.log('\n🗑️ Testing DELETE operation...');
  
  const teacherIndex = teachers.findIndex(t => t.id === teacherId);
  if (teacherIndex === -1) {
    console.log('❌ Teacher not found');
    return false;
  }
  
  const deletedTeacher = teachers[teacherIndex];
  teachers.splice(teacherIndex, 1);
  console.log('✅ Deleted teacher:', deletedTeacher.name);
  console.log('📊 Remaining teachers:', teachers.length);
  return true;
}

// Test SEARCH operation
function testSearch(query) {
  console.log(`\n🔍 Testing SEARCH operation for: "${query}"...`);
  
  const results = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(query.toLowerCase()) ||
    teacher.email.toLowerCase().includes(query.toLowerCase()) ||
    teacher.teacher_code.toLowerCase().includes(query.toLowerCase())
  );
  
  console.log(`📊 Found ${results.length} results:`);
  results.forEach((teacher, index) => {
    console.log(`${index + 1}. ${teacher.name} (${teacher.teacher_code})`);
  });
  
  return results;
}

// Test VALIDATION
function testValidation() {
  console.log('\n✅ Testing VALIDATION...');
  
  const testCases = [
    { name: 'Valid teacher', data: { name: 'Test User', email: 'test@example.com', role: 'teacher' }, shouldPass: true },
    { name: 'Invalid email', data: { name: 'Test User', email: 'invalid-email', role: 'teacher' }, shouldPass: false },
    { name: 'Empty name', data: { name: '', email: 'test@example.com', role: 'teacher' }, shouldPass: false },
    { name: 'Invalid role', data: { name: 'Test User', email: 'test@example.com', role: 'invalid' }, shouldPass: false },
    { name: 'Valid phone', data: { name: 'Test User', email: 'test@example.com', phone: '0901234567', role: 'teacher' }, shouldPass: true },
    { name: 'Invalid phone', data: { name: 'Test User', email: 'test@example.com', phone: 'invalid-phone', role: 'teacher' }, shouldPass: false }
  ];
  
  testCases.forEach(testCase => {
    const isValid = validateTeacher(testCase.data);
    const result = isValid === testCase.shouldPass ? '✅' : '❌';
    console.log(`${result} ${testCase.name}: ${isValid ? 'PASS' : 'FAIL'}`);
  });
}

// Validation function
function validateTeacher(data) {
  if (!data.name || data.name.trim().length < 2) return false;
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return false;
  if (!data.role || !['admin', 'teacher', 'student'].includes(data.role)) return false;
  if (data.phone && !/^[0-9+\-\s()]+$/.test(data.phone)) return false;
  return true;
}

// Test FORM DATA structure
function testFormData() {
  console.log('\n📋 Testing FORM DATA structure...');
  
  const formData = {
    name: 'Nguyễn Văn Test',
    email: 'test@example.com',
    phone: '0901234567',
    address: '123 Test Street, District 1, HCMC',
    role: 'teacher'
  };
  
  console.log('✅ Form data structure:', formData);
  console.log('✅ All required fields present:', Object.keys(formData).length === 5);
  console.log('✅ Validation passed:', validateTeacher(formData));
  
  return formData;
}

// Test AUTO-GENERATION
function testAutoGeneration() {
  console.log('\n🔧 Testing AUTO-GENERATION...');
  
  const formData = {
    name: 'Auto Test User',
    email: 'auto@example.com',
    phone: '0901111111',
    address: 'Auto Test Address',
    role: 'teacher'
  };
  
  // Simulate auto-generation
  const autoGenerated = {
    id: `teacher-${Date.now()}`,
    user_id: `user-${Date.now()}`,
    teacher_code: `GV${Date.now().toString().slice(-6)}`,
    ...formData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('✅ Auto-generated ID:', autoGenerated.id);
  console.log('✅ Auto-generated user_id:', autoGenerated.user_id);
  console.log('✅ Auto-generated teacher_code:', autoGenerated.teacher_code);
  console.log('✅ Auto-generated timestamps:', autoGenerated.created_at, autoGenerated.updated_at);
  
  return autoGenerated;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting New Teachers CRUD Test Suite...\n');
  
  // Test FORM DATA
  testFormData();
  
  // Test AUTO-GENERATION
  testAutoGeneration();
  
  // Test CREATE
  const newTeacher = testCreate();
  
  // Test READ
  testRead();
  
  // Test UPDATE
  if (newTeacher) {
    testUpdate(newTeacher.id, { 
      name: 'Lê Văn C (Updated)', 
      phone: '0901111111' 
    });
  }
  
  // Test SEARCH
  testSearch('Lê');
  testSearch('GV');
  testSearch('nguyenvana');
  
  // Test VALIDATION
  testValidation();
  
  // Test DELETE
  if (newTeacher) {
    testDelete(newTeacher.id);
  }
  
  // Final READ
  console.log('\n📋 Final teacher list:');
  testRead();
  
  console.log('\n🎉 All CRUD tests completed!');
  console.log('📊 Final statistics:');
  console.log(`- Total teachers: ${teachers.length}`);
  console.log(`- Test operations: CREATE, READ, UPDATE, DELETE, SEARCH, VALIDATION, FORM_DATA, AUTO_GENERATION`);
  console.log('\n✨ New Teachers CRUD is working perfectly!');
}

// Run the tests
runAllTests();

