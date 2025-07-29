import React from "react";

export function Button({ children, variant = "default", size = "default", className = "", ...props }) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-gray-500",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-red-500",
    outline: "border border-border bg-background hover:bg-muted text-foreground focus:ring-gray-500",
    ghost: "hover:bg-muted text-foreground focus:ring-gray-500",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8",
    icon: "h-10 w-10",
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
