import React from "react";

export function Card({ children, ...props }) {
  return <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4" {...props}>{children}</div>;
}

export function CardHeader({ children, ...props }) {
  return <div className="mb-2 font-bold text-lg" {...props}>{children}</div>;
}

export function CardTitle({ children, ...props }) {
  return <div className="text-xl font-semibold" {...props}>{children}</div>;
}

export function CardContent({ children, ...props }) {
  return <div className="mt-2" {...props}>{children}</div>;
}
