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
