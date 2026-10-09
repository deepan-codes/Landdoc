'use client';

export default function ProgressBar({
  value = 0,
  max = 100,
  label = null,
  showPercentage = false,
  height = 'h-1',
  color = 'green-dark',
  className = '',
  ...props
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    'green-dark': 'bg-green-dark',
    'success': 'bg-success',
    'warning': 'bg-warning',
    'danger': 'bg-danger',
  };

  return (
    <div className={className} {...props}>
      {label && (
        <div className="flex justify-between items-center mb-xs">
          <span className="text-small text-text-muted">{label}</span>
          {showPercentage && (
            <span className="text-small font-medium text-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-border rounded-full overflow-hidden`}>
        <div
          className={`${height} ${colorStyles[color]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          role="progressbar"
        />
      </div>
    </div>
  );
}
