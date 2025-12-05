'use client';

import { useState } from "react";
import AppIcon from "../icon";
import FieldWrapper from "./FieldWrapper";

const TextFieldTypes = [
  'text', 'number', 'email', 'password', 'url', 'tel', 'search', 'date', 'time', 'datetime-local', 'month', 'year', 'file', 'color',
];

export default function TextField({
  label,
  value,
  onChange,
  isRequired,
  autoFocus = false,
  disabled = false,
  error = null,
  type = 'text',
  subType = null,
  prefixIcon = null,
  suffixIcon = null,
  suffixIconOnClick = null,
  className = '',
  placeholder = '',
  name = '',
  autoComplete = null,
}) {
  const [ isPasswordVisible, togglePassword ] = useState(false);

  const onBtnTogglePasswordClicked = (e) => {
    e.preventDefault();

    if (document.activeElement) document.activeElement.blur();

    togglePassword(!isPasswordVisible);
  };

  const onFieldChanged = (e) => {
    let newValue = e.target.value;

    if (type === "file") {
      const file = e.target.files?.[0] || null;
      onChange(file);
      return;
    }
    if (type == 'tel') {
      if (subType == 'mobile') {
        newValue = newValue.replace(/[^0-9]/g, '').substr(0, 10);
      }
    }

    onChange(newValue);
  };

  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      prefixIcon={prefixIcon ? <div className="input-group-text"><AppIcon ic={prefixIcon} /></div> : null}
      suffixIcon={
        (suffixIcon || type == 'password' ? <a href="#" tabIndex={-1} className="btn btn-outline-secondary" onClick={suffixIcon ? suffixIconOnClick : onBtnTogglePasswordClicked}>
          { suffixIcon || <AppIcon ic={isPasswordVisible ? 'eye-off' : 'eye'} /> }
        </a> : null)
      }
      className={className}>
      <input
        className={"form-control" + (error ? ' is-invalid' : '')}
        type={isPasswordVisible ? 'text' : (TextFieldTypes.includes(type) ? type : 'text')}
        value={value}
        onChange={onFieldChanged}
        autoFocus={autoFocus}
        required={isRequired}
        placeholder={placeholder}
        name={name}
        autoComplete={autoComplete}
        disabled={disabled} />
    </FieldWrapper>
  );
}
