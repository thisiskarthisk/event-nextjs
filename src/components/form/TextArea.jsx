'use client';

import AppIcon from "../icon";
import FieldWrapper from "./FieldWrapper";

export default function TextArea({
  label,
  value,
  onChange,
  isRequired = false,
  autoFocus = false,
  disabled = false,
  error = null,
  rows = 4,
  prefixIcon = null,
  suffixIcon = null,
  suffixIconOnClick = null,
  className = '',
  placeholder = '',
  name = '',
}) {

  const onFieldChanged = (e) => {
    onChange(e);
  };

  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      className={className}
      prefixIcon={
        prefixIcon ? (
          <div className="input-group-text">
            <AppIcon ic={prefixIcon} />
          </div>
        ) : null
      }
      suffixIcon={
        suffixIcon ? (
          <a
            href="#"
            tabIndex={-1}
            className="btn btn-outline-secondary"
            onClick={suffixIconOnClick}
          >
            <AppIcon ic={suffixIcon} />
          </a>
        ) : null
      }
    >
      <textarea
        className={"form-control" + (error ? " is-invalid" : "")}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={onFieldChanged}
        autoFocus={autoFocus}
        required={isRequired}
        name={name}
        disabled={disabled}
      />
    </FieldWrapper>
  );
}
