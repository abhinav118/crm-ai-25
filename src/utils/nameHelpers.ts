// Helper functions for name processing during contact import

export interface NameSplitResult {
  firstName: string;
  lastName: string;
}

/**
 * Splits a full name into first and last name components
 */
export const splitFullName = (fullName: string): NameSplitResult => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  
  // Split by whitespace and filter out empty parts
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else {
    // First part is first name, rest is last name
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
};

/**
 * Checks if a string looks like a full name (contains only letters, spaces, hyphens, apostrophes)
 */
export const looksLikeFullName = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes(' ')) return false;
  
  // Check if it contains only valid name characters
  const nameRegex = /^[A-Za-z\s'-]+$/;
  if (!nameRegex.test(trimmed)) return false;
  
  // Split into parts and ensure each part looks like a name component
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);
  
  // Must have at least 2 parts, each at least 1 character
  if (parts.length < 2) return false;
  
  // Each part should be at least 1 character and not be obviously non-name data
  return parts.every(part => {
    // Exclude obvious non-name patterns
    if (/^\d+$/.test(part)) return false; // Pure numbers
    if (part.includes('@')) return false; // Email-like
    if (part.includes('.com') || part.includes('.org')) return false; // Domain-like
    return part.length >= 1;
  });
};

/**
 * Processes a contact row to automatically detect and split full names
 */
export const processContactRowForNames = (
  row: Record<string, any>, 
  enableNameSplitting: boolean = true
): Record<string, any> => {
  if (!enableNameSplitting) return row;
  
  const processedRow = { ...row };
  
  // Look for potential full names in any column
  Object.keys(processedRow).forEach(key => {
    const value = processedRow[key];
    
    if (looksLikeFullName(value)) {
      const { firstName, lastName } = splitFullName(value);
      
      // Add split names as new fields, but keep original too
      if (firstName) {
        processedRow[`${key}_first_name`] = firstName;
      }
      if (lastName) {
        processedRow[`${key}_last_name`] = lastName;
      }
      
      console.log(`Detected full name in ${key}: "${value}" → first: "${firstName}", last: "${lastName}"`);
    }
  });
  
  return processedRow;
};
