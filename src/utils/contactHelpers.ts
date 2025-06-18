
export const getFullName = (contact: { first_name: string; last_name?: string | null }) => {
  return `${contact.first_name} ${contact.last_name || ''}`.trim();
};

export const getInitials = (contact: { first_name: string; last_name?: string | null }) => {
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
