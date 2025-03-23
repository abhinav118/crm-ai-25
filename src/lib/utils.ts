
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to extract initials from a name
export function getInitials(name: string): string {
  if (!name) return '';
  
  // Split the name by spaces and get first characters of each part
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters
}
