import React from "react";

export function Label({ children, className = "", ...props }) {
  return (
    <label className={`text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
      {children}
    </label>
  );
}
