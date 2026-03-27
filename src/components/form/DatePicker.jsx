import { useEffect, useRef } from "react"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.min.css"
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect"
import "flatpickr/dist/plugins/monthSelect/style.css"

export default function DatePicker({ id, label, value, format, error, onChange, placeholder}) {
  const inputRef = useRef(null)
  const fpRef = useRef(null)
  const yearMonthMode = format === "Y-m"

  useEffect(() => {
    if (!inputRef.current) return

    const config = {
      defaultDate: value ?? "",
      onChange: (selectedDates, dateStr) => onChange(dateStr),
      disableMobile: true,
      maxDate: "today"
    }

    if (yearMonthMode) {
      config.dateFormat = "Y-m"
      config.plugins = [
        new monthSelectPlugin({
          shorthand: false,
          dateFormat: "Y-m",
          altFormat: "F Y"
        })
      ]
    } else {
      config.dateFormat = format || "d-m-Y"
    }

    fpRef.current = flatpickr(inputRef.current, config)

    return () => {
      if (fpRef.current) {
        fpRef.current.destroy()
        fpRef.current = null
      }
    }
  }, [format])

  return (
    <div className="mb-3 text-center">
      <label htmlFor={id} className="form-label text-center w-100">
        {label}
      </label>

      <input
        ref={inputRef}
        type="text"
        id={id}
        className={`form-control text-start w-100 mx-auto ${error ? "is-invalid" : ""}`}
        placeholder={placeholder}
        readOnly
      />

      {error && (
        <div className="invalid-feedback d-block text-center">
          {error}
        </div>
      )}
    </div>
  )
}
