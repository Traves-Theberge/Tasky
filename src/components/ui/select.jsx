import React, { useState } from "react";

export function Select({ value, onValueChange, children, ...props }) {
  return (
    <select 
      className="border border-border/30 rounded-xl px-4 py-3 text-card-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
      style={{ backgroundColor: '#7f7f7c' }}
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
