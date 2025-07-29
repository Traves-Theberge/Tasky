import React, { useState } from "react";

export function Select({ value, onValueChange, children, ...props }) {
  return (
    <select 
      className="border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  return (
    <div className={`inline-block relative ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SelectContent({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function SelectItem({ children, value, ...props }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}

export function SelectValue({ placeholder, children, ...props }) {
  return (
    <span {...props}>
      {children || placeholder}
    </span>
  );
}
