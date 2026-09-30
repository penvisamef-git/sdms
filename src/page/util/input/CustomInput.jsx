import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react';
import './custominput.style.css';

const CustomInput = forwardRef(({
  // Basic props
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  readOnly = false,
  autoFocus = false,
  
  // Styling props
  size = 'md',
  variant = 'default',
  color = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  
  // Validation props
  error = '',
  success = false,
  helperText = '',
  showPasswordToggle = false,
  showClear = false,
  onClear,
  
  // Other props
  className = '',
  style = {},
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value || defaultValue || '');
  const inputRef = React.useRef(null);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) onChange(e);
  };

  // Handle clear
  const handleClear = () => {
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
    if (onClear) onClear();
  };

  // Determine input type (for password toggle)
  const getInputType = () => {
    if (type === 'password' && showPassword) return 'text';
    return type;
  };

  // Determine variant classes
  const getVariantClass = () => {
    switch (variant) {
      case 'outline':
        return 'input-outline';
      case 'filled':
        return 'input-filled';
      case 'underlined':
        return 'input-underlined';
      case 'rounded':
        return 'input-rounded';
      default:
        return '';
    }
  };

  // Determine color class
  const getColorClass = () => {
    if (error) return 'input-error';
    if (success) return 'input-success';
    switch (color) {
      case 'primary':
        return 'input-primary';
      case 'secondary':
        return 'input-secondary';
      case 'success':
        return 'input-success';
      case 'warning':
        return 'input-warning';
      case 'danger':
        return 'input-danger';
      case 'info':
        return 'input-info';
      default:
        return 'input-primary';
    }
  };

  // Determine size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'input-sm';
      case 'lg':
        return 'input-lg';
      default:
        return '';
    }
  };

  // Determine if password toggle should show
  const showPasswordToggleIcon = type === 'password' && showPasswordToggle;

  // Determine if clear button should show
  const showClearButton = showClear && inputValue.length > 0;

  return (
    <div 
      className={`custom-input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}
      style={style}
    >
      {/* Label */}
      {label && (
        <label 
          className={`custom-input-label ${required ? 'required' : ''}`}
          htmlFor={name}
        >
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div 
        className={`custom-input-container 
          ${getVariantClass()} 
          ${getColorClass()} 
          ${getSizeClass()} 
          ${isFocused ? 'focused' : ''} 
          ${disabled ? 'disabled' : ''} 
          ${readOnly ? 'readonly' : ''} 
          ${error ? 'has-error' : ''} 
          ${success ? 'has-success' : ''}
          ${icon ? 'has-icon' : ''}
          ${iconPosition === 'right' ? 'icon-right' : ''}
        `}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <span className="input-icon input-icon-left">
            {icon}
          </span>
        )}

        {/* Input */}
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref && typeof ref === 'object') ref.current = node;
          }}
          id={name}
          name={name}
          type={getInputType()}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={(e) => { if (onBlur) onBlur(e); }}
          onFocus={(e) => { if (onFocus) onFocus(e); }}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          autoFocus={autoFocus}
          className={`custom-input ${error ? 'input-error' : ''}`}
          style={{
            color: 'var(--input-text-color, #1a1a1a)',
          }}
          {...rest}
        />

        {/* Right Icon */}
        {icon && iconPosition === 'right' && (
          <span className="input-icon input-icon-right">
            {icon}
          </span>
        )}

        {/* Clear Button */}
        {showClearButton && (
          <button
            type="button"
            className="input-clear-btn"
            onClick={handleClear}
            aria-label="Clear input"
          >
            <X size={16} />
          </button>
        )}

        {/* Password Toggle */}
        {showPasswordToggleIcon && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Status Icons */}
        {error && (
          <span className="input-status-icon input-status-error">
            <AlertCircle size={18} />
          </span>
        )}
        {success && !error && (
          <span className="input-status-icon input-status-success">
            <CheckCircle size={18} />
          </span>
        )}
      </div>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <div className={`custom-input-helper ${error ? 'has-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput;