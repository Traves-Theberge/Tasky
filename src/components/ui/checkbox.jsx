import React from "react";

export function Checkbox({ checked, onChange, onCheckedChange, className = "", ...props }) {
  const handleChange = (e) => {
    const isChecked = e.target.checked;
    if (onChange) onChange(e);
    if (onCheckedChange) onCheckedChange(isChecked);
  };

  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-2 border-border bg-background text-gray-900 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 dark:text-white ${className}`}
      checked={checked}
      onChange={handleChange}
      {...props}
    />
  );
}
