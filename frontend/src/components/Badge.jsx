import { clsx } from "clsx";
import React from "react";

const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const variantClasses = {
    primary: "badge-primary",
    secondary: "badge-secondary",
    success: "badge-success",
    danger: "badge-danger",
    warning: "badge-warning",
    outline: "badge-outline",
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const classes = clsx(
    "badge",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
