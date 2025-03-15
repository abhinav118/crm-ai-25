
import React from 'react';
import { cn } from '@/lib/utils';

export type AvatarProps = {
  name: string;
  status?: 'active' | 'inactive' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'active':
      return 'bg-avatar-green';
    case 'busy':
      return 'bg-avatar-amber';
    case 'away':
      return 'bg-avatar-purple';
    default:
      return 'bg-avatar-blue';
  }
};

const Avatar: React.FC<AvatarProps> = ({ name, status, size = 'md', className }) => {
  const initials = getInitials(name);
  const colorClass = getStatusColor(status);
  
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size];

  return (
    <div 
      className={cn(
        'avatar-base', 
        colorClass, 
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;
