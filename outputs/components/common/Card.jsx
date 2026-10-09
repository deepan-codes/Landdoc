'use client';

export default function Card({
  children,
  className = '',
  hoverable = false,
  noBorder = false,
  noShadow = false,
  padding = true,
  onClick = null,
  ...props
}) {
  const baseStyles = 'bg-white rounded-card transition-all duration-200';

  const borderStyles = noBorder ? '' : 'border border-border';

  const shadowStyles = noShadow ? '' : 'shadow-subtle hover:shadow-subtle';

  const paddingStyles = padding ? 'p-md' : '';

  const hoverStyles = hoverable
    ? 'cursor-pointer hover:shadow-md hover:border-green-dark'
    : '';

  const combinedStyles = `${baseStyles} ${borderStyles} ${shadowStyles} ${paddingStyles} ${hoverStyles} ${className}`;

  return (
    <div
      className={combinedStyles}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
