/**
 * Attendance Utilities
 * Helper functions for parsing and working with attendance records
 */

export interface AttendanceRecord {
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  timestamp: string;
  student_id?: string;
}

export interface ParsedAttendanceRecords {
  [studentId: string]: AttendanceRecord;
}

/**
 * Parse attendance records from API response
 * Handles both string JSON and object formats
 * CRITICAL: Must preserve all records, never return empty object if input has data
 */
export function parseAttendanceRecords(records: any): ParsedAttendanceRecords {
  console.log('[parseAttendanceRecords] Input:', records);
  console.log('[parseAttendanceRecords] Input type:', typeof records);
  console.log('[parseAttendanceRecords] Input is null?', records === null);
  console.log('[parseAttendanceRecords] Input is undefined?', records === undefined);
  
  if (!records) {
    console.log('[parseAttendanceRecords] Records is falsy, returning empty object');
    return {};
  }

  // If it's already an object, return it directly (don't modify)
  if (typeof records === 'object' && !Array.isArray(records)) {
    console.log('[parseAttendanceRecords] ✅ Records is already an object, returning as-is');
    console.log('[parseAttendanceRecords] Records keys:', Object.keys(records));
    console.log('[parseAttendanceRecords] Records keys count:', Object.keys(records).length);
    
    // Validate it has the expected structure
    const hasValidStructure = Object.values(records).every(value => 
      typeof value === 'object' && value !== null && 'status' in value
    );
    console.log('[parseAttendanceRecords] Has valid structure?', hasValidStructure);
    
    return records as ParsedAttendanceRecords;
  }

  // If it's a string, parse it
  if (typeof records === 'string') {
    console.log('[parseAttendanceRecords] Records is a string, parsing...');
    console.log('[parseAttendanceRecords] String length:', records.length);
    console.log('[parseAttendanceRecords] String preview:', records.substring(0, 200));
    
    try {
      const parsed = JSON.parse(records);
      console.log('[parseAttendanceRecords] ✅ Parsed result:', parsed);
      console.log('[parseAttendanceRecords] Parsed type:', typeof parsed);
      
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        console.log('[parseAttendanceRecords] ✅ Parsed is valid object, returning');
        console.log('[parseAttendanceRecords] Parsed keys:', Object.keys(parsed));
        console.log('[parseAttendanceRecords] Parsed keys count:', Object.keys(parsed).length);
        return parsed as ParsedAttendanceRecords;
      } else {
        console.warn('[parseAttendanceRecords] ⚠️ Parsed is not a valid object:', parsed);
        console.warn('[parseAttendanceRecords] Parsed type:', typeof parsed);
        console.warn('[parseAttendanceRecords] Is array?', Array.isArray(parsed));
      }
    } catch (err) {
      console.error('[parseAttendanceRecords] ❌ Error parsing records string:', err);
      console.error('[parseAttendanceRecords] String that failed:', records);
    }
  }

  console.warn('[parseAttendanceRecords] ⚠️ Returning empty object as fallback');
  console.warn('[parseAttendanceRecords] Input was:', records);
  console.warn('[parseAttendanceRecords] Input type was:', typeof records);
  return {};
}

/**
 * Get student attendance status from records
 */
export function getStudentAttendanceStatus(
  studentId: string,
  records: ParsedAttendanceRecords
): {
  status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended';
  notes: string;
  timestamp: string;
} {
  if (!studentId || !records || Object.keys(records).length === 0) {
    return {
      status: 'not_attended',
      notes: '',
      timestamp: ''
    };
  }

  // Try to get record by student_id (key) - exact match
  let record = records[studentId];

  // If not found by direct key, try to find by student_id field in records
  if (!record) {
    for (const [key, value] of Object.entries(records)) {
      // Check if the value has a student_id field that matches
      if (value && typeof value === 'object' && 'student_id' in value) {
        if (value.student_id === studentId) {
          record = value;
          break;
        }
      }
      // Also check if the key itself matches (case-insensitive comparison)
      if (key === studentId) {
        record = value;
        break;
      }
    }
  }

  if (!record) {
    return {
      status: 'not_attended',
      notes: '',
      timestamp: ''
    };
  }

  // Get status from record
  const recordStatus = record.status || 'not_attended';

  // Handle excused status - check if absent with excuse or explicitly excused
  let status: 'present' | 'absent' | 'late' | 'excused' | 'not_attended' = 'not_attended';
  if (recordStatus === 'absent') {
    const recordNotes = (record.notes || '').toLowerCase();
    if (recordNotes.includes('phép') || recordNotes.includes('excused') || recordNotes.includes('có phép')) {
      status = 'excused';
    } else {
      status = 'absent';
    }
  } else if (['present', 'late', 'excused'].includes(recordStatus)) {
    status = recordStatus as 'present' | 'absent' | 'late' | 'excused';
  }

  return {
    status,
    notes: record.notes || '',
    timestamp: record.timestamp || ''
  };
}

/**
 * Count attendance statistics from records
 */
export function countAttendanceStats(records: ParsedAttendanceRecords): {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
} {
  const stats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: Object.keys(records).length
  };

  Object.values(records).forEach((record) => {
    const status = getStudentAttendanceStatus(record.student_id || '', records).status;
    switch (status) {
      case 'present':
        stats.present++;
        break;
      case 'absent':
        stats.absent++;
        break;
      case 'late':
        stats.late++;
        break;
      case 'excused':
        stats.excused++;
        break;
    }
  });

  return stats;
}

/**
 * Validate attendance record format
 */
export function validateAttendanceRecord(record: any): boolean {
  if (!record || typeof record !== 'object') {
    return false;
  }

  // Check required fields
  if (!record.status || typeof record.status !== 'string') {
    return false;
  }

  // Validate status
  const validStatuses = ['present', 'absent', 'late', 'excused'];
  if (!validStatuses.includes(record.status)) {
    return false;
  }

  return true;
}

