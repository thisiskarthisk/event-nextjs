'use client';

export default function FieldWrapper({ children, label, isRequired, error = null, prefixIcon = null, suffixIcon = null, className = '' }) {
  return (
    <div className={"form-group" + (isRequired ? ' required-field' : '') + (className ? ` ${className}` : '')}>
      <label className="form-label">{ label }</label>

      {
        (prefixIcon || suffixIcon) ? <div className="input-group">
          { prefixIcon && prefixIcon }

          {children}

          { suffixIcon && suffixIcon }
        </div> : children
      }

      {
        error && <div className="invalid-feedback">{error}</div>
      }
    </div>
  );
}
