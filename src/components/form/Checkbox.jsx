import { check } from "drizzle-orm/gel-core";
import FieldWrapper from "./FieldWrapper";

export default function Checkbox({
  label,
  checked,
  onChange,
  isRequired,
  id = null,
  disabled = false,
  error = null,
}) {
  return (
    <FieldWrapper label={null} isRequired={isRequired} error={error}>
      <div className="form-check">
        <input type="checkbox" className="form-check-input" disabled={disabled} onChange={e => onChange(e.target.checked)} id={id} value={true} checked={checked} />
        <label className="form-check-label" htmlFor={id}>{label}</label>
      </div>
    </FieldWrapper>
  );
}
