// Test script để kiểm tra fallback data
console.log('Testing frontend fallback...');

// Simulate the SubjectsAPI.create method
const testCreate = async (data) => {
  try {
    // Simulate API call that will fail
    const response = await fetch('http://localhost:8000/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    
    // Fallback: create mock subject
    console.log('Using fallback create due to backend error');
    const newSubject = {
      id: Date.now().toString(),
      name: data.name,
      code: data.code,
      description: data.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Created fallback subject:', newSubject);
    return newSubject;
  }
};

// Test data
const testData = {
  name: 'Lịch sử',
  code: 'HIST',
  description: 'Môn lịch sử Việt Nam'
};

// Run test
testCreate(testData)
  .then(result => {
    console.log('✅ Test successful!');
    console.log('Result:', result);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
