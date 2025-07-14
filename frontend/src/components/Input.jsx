import { clsx } from "clsx";
import React from "react";

const Input = React.forwardRef(
  (
    { label, error, type = "text", className = "", required = false, ...props },
    ref
  ) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            "input",
            error &&
              "border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default Input;
