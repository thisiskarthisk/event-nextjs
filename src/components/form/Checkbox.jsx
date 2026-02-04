'use client';

import { useId } from "react";
import AppIcon from "../icon";

export default function Checkbox({
  label = "",
  checked = false,
  onChange = () => {},
  disabled = false,
  name = "",
  className = "",
  required = false,
  id: customId, // Allow override
  size = "md", // sm, md, lg
  variant = "default", // default, outline
}) {
  const generatedId = useId(); // Unique ID for accessibility
  const id = customId || generatedId;
  const isChecked = Boolean(checked);

  const handleChange = (e) => {
    if (disabled) return;
    onChange(e.target.checked);
  };

  const sizeClasses = {
    sm: "form-check-input-sm",
    md: "",
    lg: "form-check-lg"
  };

  const variantClasses = {
    default: "",
    outline: "border-warning"
  };

  return (
    <div className={`form-check d-flex align-items-center gap-2 mb-2 ${className}`}>
      <input
        type="checkbox"
        className={`form-check-input ${sizeClasses[size]} ${variantClasses[variant]}`}
        id={id}
        name={name}
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        required={required}
      />
      
      <label 
        htmlFor={id}
        className="form-check-label fw-medium mb-0 cursor-pointer user-select-none"
      >
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
    </div>
  );
}
