"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  id?: string;
  name?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

export function CustomDropdown({ id, name, options, value, onChange, invalid, describedBy }: Props) {
  const fallbackId = useId();
  const dropdownId = id || fallbackId;
  const listboxId = `${dropdownId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="custom-dropdown" ref={rootRef}>
      {name ? <input type="hidden" name={name} value={selected.value} /> : null}
      <button
        id={dropdownId}
        className={`dropdown-trigger ${invalid ? "invalid-field" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected.label}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      {open ? (
        <div className="dropdown-menu" id={listboxId} role="listbox" aria-labelledby={dropdownId}>
          {options.map((option) => {
            const isSelected = option.value === selected.value;
            return (
              <button
                className={`dropdown-option ${isSelected ? "selected" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <Check size={16} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
