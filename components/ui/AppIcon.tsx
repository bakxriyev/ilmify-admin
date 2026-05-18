'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

type IconVariant = 'outline' | 'solid';

interface IconProps {
  name: string; // dynamic icon name
  variant?: IconVariant;
  size?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  strokeWidth?: number;
  [key: string]: any;
}

export default function AppIcon({
  name,
  variant = 'outline',
  size = 24,
  className = '',
  onClick,
  disabled = false,
  strokeWidth,
  ...props
}: IconProps) {
  const IconComponent =
    (LucideIcons as unknown as Record<string, React.FC<any>>)[name] || HelpCircle;

  return (
    <IconComponent
      size={size}
      strokeWidth={
        strokeWidth ?? (variant === 'solid' ? 2.5 : 1.75)
      }
      className={`
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${onClick && !disabled ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
}
