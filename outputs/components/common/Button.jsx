'use client';

import Link from 'next/link';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  // Base styles
  const baseStyles = 'font-sans font-medium transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap';

  // Variant styles
  const variantStyles = {
    primary: 'bg-green-dark text-white hover:bg-opacity-90 disabled:bg-opacity-50',
    secondary: 'border-2 border-green-dark text-green-dark hover:bg-green-dark hover:bg-opacity-5 disabled:border-opacity-50',
    text: 'text-green-dark hover:text-green-900 disabled:opacity-50',
    danger: 'bg-danger text-white hover:bg-opacity-90 disabled:bg-opacity-50',
    outline: 'border-2 border-border text-text-primary hover:bg-paper disabled:border-opacity-50',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-sm py-xs text-secondary rounded-button min-h-[36px]',
    md: 'px-md py-sm text-body rounded-button min-h-[44px]',
    lg: 'px-lg py-md text-body rounded-button min-h-[52px]',
  };

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={combinedStyles} {...props}>
        {children}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedStyles}
      {...props}
    >
      {children}
    </button>
  );
}
