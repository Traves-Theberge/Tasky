import React from "react";

export default function CustomSwitch({ checked, onChange, ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      {...props}
    />
  );
}
