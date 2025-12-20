'use client';

import { useEffect, useRef, useState } from "react";
import FieldWrapper from "./FieldWrapper";

import Select from 'react-select';

export default function SelectPicker({ label, options, value, onChange, isRequired, error = null, optionLabelKey = 'label', optionValueKey = 'value', disabled = false }) {
  const [ formattedOptions, setFormattedOptions ] = useState([]);

  const [ selectedValue, setSelectedValue ] = useState(null);

  const getDefaultValue = () => {
    if (value) {
      for (const opt of formattedOptions) {
        if (opt.value == value) {
          return {...opt};
        }
      }
    }

    return null;
  };

  useEffect(() => {
    let newFormattedOptions = [];

    // Format choices to needed format
    Object.keys(options).map(i => {
      const opt = options[i];
      let label, value;

      // If the options are Array of objects
      if (typeof(opt) === 'object') {
        label = opt[optionLabelKey];
        value = opt[optionValueKey];
      } else {
        // If the options are just objects (key: value)
        label = opt;
        value = i;
      }

      newFormattedOptions.push({
        'label': label,
        'value': value,
      });
    });

    console.log(newFormattedOptions);

    setFormattedOptions([ ...newFormattedOptions ]);
  }, [options, optionLabelKey, optionValueKey]);

  useEffect(() => {
    setSelectedValue(getDefaultValue());
    console.log(getDefaultValue(), value);
  }, [formattedOptions, value]);

  return (
    <FieldWrapper label={label} isRequired={isRequired} error={error}>
      <Select
        options={formattedOptions}
        className={error ? 'is-invalid' : ''}
        value={selectedValue}
        onChange={(newValue) => onChange(newValue && newValue.value ? newValue.value : null)}
        isDisabled={disabled} />
    </FieldWrapper>
  );
}
