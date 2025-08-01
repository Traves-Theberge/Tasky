import React, { useState } from "react";

export function Select({ value, onValueChange, children, style, ...props }) {
  return (
    <select 
      className="border border-border/30 rounded-2xl px-4 py-2.5 text-card-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg hover:shadow-xl transition-all duration-300 font-medium bg-card/50 backdrop-blur-sm hover:bg-card/70 cursor-pointer min-w-[160px]"
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      style={style}
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

export function SelectItem({ children, value, style, ...props }) {
  return (
    <option value={value} style={style} {...props}>
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
