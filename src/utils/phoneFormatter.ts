/**
 * Formats a phone number to the standard U.S. format (XXX) XXX-XXXX
 * @param input - The phone number string to format
 * @returns Formatted phone number or original input if invalid
 */
export function formatPhoneNumber(input: string): string {
  if (!input) return input;
  
  // Strip all non-digit characters
  const cleaned = input.replace(/\D/g, '');
  
  // Check if we have a valid 10-digit number (or 11 with country code)
  if (cleaned.length === 10) {
    // Format into (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : input;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Handle 11-digit number starting with 1 (US country code)
    const tenDigit = cleaned.substring(1);
    const match = tenDigit.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : input;
  }
  
  // Return original input if it doesn't match expected patterns
  return input;
}