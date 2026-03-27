'use client';

import { useState } from "react";
import FieldWrapper from "./FieldWrapper";
import AppIcon from "../icon";

const VALID_TYPES = [
  'text','number','email','password','url','tel','search',
  'date','time','datetime-local','month','year','file','color', 'checkbox' , 
];

export default function TextField({
  label,
  value,
  onChange,
  type = "text",
  subType = null,
  isRequired = false,
  disabled = false,
  error = null,
  className = "",
  placeholder = "",
  name = "",
  autoFocus = false,
  autoComplete = null,
  accept = null,
  prefixIcon = null,
  suffixIcon = null,
  suffixIconOnClick = null,

  inline = false,          // label + control in one row
  toggle = false,         // render switch instead of checkbox
}) {

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const onTogglePassword = (e) => {
    e.preventDefault();
    setIsPasswordVisible(p => !p);
  };

  const onFieldChanged = (e) => {

    // -----------------------
    // FILE INPUT
    // -----------------------
    if (type === "file") {
      onChange(e);     // forward real event
      return;
    }

    // CHECKBOX
    if (type === "checkbox") {
      onChange(e.target.checked);
      return;
    }


    let newValue = e.target.value;

    // -----------------------
    // FORMATTERS
    // -----------------------
    if (type === "tel" && subType === "mobile") {
      newValue = newValue.replace(/[^0-9]/g, "").substring(0, 10);
    }

    if (type === "number" && subType === "year") {
      newValue = newValue.replace(/[^0-9]/g, "").substring(0, 4);
    }

    if (subType === "gstNo") {
      newValue = newValue
        .toUpperCase()
        .replace(/[^A-Z0-9]/gi, "")
        .substring(0, 15);
    }

    onChange(newValue);
  };

  /* ----------------------------------
      CHECKBOX / TOGGLE RENDER
  ---------------------------------- */

  if (type === "checkbox") {
    return (
      <div className="d-flex align-items-center gap-3 mb-2">

        <input
          type="checkbox"
          className="form-check-input"
          checked={Boolean(value)}
          onChange={(e) => {
            console.log("checkbox changed:", e.target.checked);
            onChange(e.target.checked);
          }}
          disabled={disabled}
          name={name}
        />

        <span className="fw-medium">
          {label}
          {isRequired && <span className="text-danger">*</span>}
        </span>

      </div>
    );
  }



  
  return (
    <FieldWrapper
      label={label}
      error={error}
      isRequired={isRequired}
      className={className}
      prefixIcon={
        prefixIcon && (
          <div className="input-group-text">
            <AppIcon ic={prefixIcon} />
          </div>
        )
      }
      suffixIcon={
        type === "password" ? (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onTogglePassword}
          >
            <AppIcon ic={isPasswordVisible ? "eye-off" : "eye"} />
          </button>
        ) : suffixIcon
      }
    >
      <input
        className={"form-control" + (error ? " is-invalid" : "")}
        type={
          type === "password"
            ? (isPasswordVisible ? "text" : "password")
            : VALID_TYPES.includes(type)
              ? type
              : "text"
        }
        value={type === "file" ? undefined : value}
        
        onChange={onFieldChanged}
        name={name}
        placeholder={placeholder}
        required={isRequired}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        accept={accept}
      />
    </FieldWrapper>
  );
}
