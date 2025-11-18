'use client';

import { useState } from "react";
import AppIcon from "../icon";
import FieldWrapper from "./FieldWrapper";

const TextFieldTypes = [
  'text', 'number', 'email', 'password', 'url', 'tel', 'search', 'date', 'time', 'datetime-local', 'month', 'year', 'file'
];

export default function TextField({
  label,
  value,
  onChange,
  isRequired,
  autoFocus = false,
  error = null,
  type = 'text',
  subType = null,
  prefixIcon = null,
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
        (type == 'password' ? <a href="#" className="btn btn-outline-secondary" onClick={onBtnTogglePasswordClicked}><AppIcon ic={isPasswordVisible ? 'eye-off' : 'eye'} /></a> : null)
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
        autoComplete={autoComplete} />
    </FieldWrapper>
  );
}
