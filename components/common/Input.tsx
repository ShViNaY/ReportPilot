// components/common/Input.tsx
import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', type = 'text', ...props }, ref) => {
    const inputId = id || props.name;
    const [showPassword, setShowPassword] = useState(false);

    // Toggle password visibility
    const isPasswordField = type === 'password';
    const displayType = isPasswordField && showPassword ? 'text' : type;

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>

        {/* Input wrapper for password visibility toggle */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={displayType}
            className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 ${
              isPasswordField ? 'pr-10' : ''
            } ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
            {...props}
          />

          {/* Show/Hide Password Button */}
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye icon (visible)
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Eye-off icon (hidden)
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clipRule="evenodd"
                  />
                  <path d="M15.171 13.576l1.414 1.414A10.016 10.016 0 0019.542 10c-1.274-4.057-5.064-7-9.542-7a9.958 9.958 0 00-2.572.35l1.286 1.286A4 4 0 0115.171 13.576z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';