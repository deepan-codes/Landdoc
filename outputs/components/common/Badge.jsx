'use client';

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...props
}) {
  // Color variants for document types
  const variantStyles = {
    default: 'bg-paper text-text-primary border border-border',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-danger text-white',
    info: 'bg-green-dark bg-opacity-10 text-green-dark border border-green-dark',
    orange: 'bg-warning bg-opacity-10 text-warning border border-warning',
    green: 'bg-success bg-opacity-10 text-success border border-success',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    gray: 'bg-text-muted bg-opacity-10 text-text-muted border border-text-muted',
    purple: 'bg-purple-100 text-purple-700 border border-purple-200',
  };

  const sizeStyles = {
    xs: 'px-xs py-[2px] text-xs font-medium rounded',
    sm: 'px-sm py-xs text-small font-medium rounded',
    md: 'px-md py-sm text-secondary font-medium rounded-button',
  };

  const combinedStyles = `${variantStyles[variant]} ${sizeStyles[size]} inline-flex items-center gap-1 ${className}`;

  return (
    <span className={combinedStyles} {...props}>
      {children}
    </span>
  );
}
