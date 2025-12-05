/**
 * Date utility functions to handle timezone issues
 * Prevents automatic timezone conversion when parsing date strings
 */

/**
 * Parse a date string without timezone conversion
 * If the date string is in format "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DDTHH:mm:ss.sssZ",
 * it will be parsed as local time without converting to UTC
 * 
 * @param dateString - Date string from database (ISO format)
 * @returns Date object representing the local time
 */
export function parseDateWithoutTimezone(dateString: string | null | undefined): Date {
    if (!dateString) {
        return new Date();
    }

    // If the string contains timezone info (Z or +HH:MM), remove it and parse as local
    // Format: "2024-01-01T10:00:00Z" or "2024-01-01T10:00:00+00:00"
    if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
        // Remove timezone info and parse as local time
        const datePart = dateString.split('T')[0]; // "2024-01-01"
        const timePart = dateString.split('T')[1]?.split(/[Z+-]/)[0] || '00:00:00'; // "10:00:00"
        
        // Create date in local timezone
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
        
        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // If no timezone info, parse directly
    // Format: "2024-01-01T10:00:00"
    if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds = 0] = (timePart || '00:00:00').split(':').map(Number);
        
        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Fallback to standard Date parsing
    return new Date(dateString);
}

/**
 * Format date for display without timezone conversion
 * Uses the date as-is from the database
 */
export function formatDateLocal(dateString: string | null | undefined, format: string = 'dd/MM/yyyy HH:mm'): string {
    if (!dateString) return '';
    
    const date = parseDateWithoutTimezone(dateString);
    
    // Simple formatting without date-fns to avoid timezone issues
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (format === 'dd/MM/yyyy HH:mm') {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    if (format === 'dd/MM/yyyy') {
        return `${day}/${month}/${year}`;
    }
    
    if (format === 'HH:mm') {
        return `${hours}:${minutes}`;
    }
    
    // Default format
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}


