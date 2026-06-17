// Utility functions for date calculations

/**
 * Calculate age from birth date
 * @param birthDate - Birth date string (YYYY-MM-DD) or Date object
 * @returns Age in years
 */
export const calculateAge = (birthDate: string | Date): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date to Portuguese locale
 * @param date - Date string or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDateToPT = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-PT');
};

/**
 * Format date for HTML date input
 * @param date - Date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Validate if person is of legal age (18+)
 * @param birthDate - Birth date string or Date object
 * @returns Boolean indicating if person is 18 or older
 */
export const isLegalAge = (birthDate: string | Date): boolean => {
  return calculateAge(birthDate) >= 18;
};

/**
 * Parses an ISO date string (with or without timezone offset) into a local Date object,
 * treating the digits as local to the browser's current timezone.
 * This avoids timezone shifting (e.g. 18:00 UTC shifting to 19:00 local).
 * 
 * @param dateStr - ISO date string or simple date string
 * @returns Date object in local timezone
 */
export const parseLocalISO = (dateStr: string | Date | undefined | null): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  let normalizedStr = dateStr.trim();
  if (normalizedStr.includes(' ')) {
    normalizedStr = normalizedStr.replace(' ', 'T');
  }

  // If it's a full ISO string (contains 'T')
  if (normalizedStr.includes('T')) {
    const [datePart, timePartWithOffset] = normalizedStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Remove any offset like Z, +01:00, -02:00
    const timePart = timePartWithOffset.split(/[Z+-]/)[0];
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    return new Date(
      year,
      month - 1,
      day,
      hours || 0,
      minutes || 0,
      seconds ? Math.floor(seconds) : 0
    );
  } else {
    // If it is just YYYY-MM-DD
    const [year, month, day] = normalizedStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
};

