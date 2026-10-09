'use client';

export default function InputField({
  label,
  name,
  type = 'text',
  placeholder = '',
  value = '',
  onChange = null,
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && (
        <label htmlFor={name} className="text-body font-medium text-text-primary">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          px-md py-sm text-body border-2 rounded-button
          bg-white transition-colors duration-200
          placeholder-text-muted
          disabled:bg-paper disabled:text-text-muted disabled:cursor-not-allowed
          focus:outline-none focus:border-green-dark focus:ring-2 focus:ring-green-dark focus:ring-opacity-20
          ${error ? 'border-danger' : 'border-border'}
          ${inputClassName}
        `}
        {...props}
      />

      {error && (
        <p className="text-small text-danger font-medium">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-small text-text-muted">{helperText}</p>
      )}
    </div>
  );
}
