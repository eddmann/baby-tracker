import { InputHTMLAttributes, forwardRef, ReactNode, useId } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className,
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full h-12 px-4 text-[15px]",
              !!leftIcon && "pl-11",
              !!rightIcon && "pr-11",
              "bg-[var(--color-surface-secondary)]",
              "text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-tertiary)]",
              "rounded-[var(--radius-md)]",
              "border-2 border-transparent",
              "transition-all duration-200",
              "focus:outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)]",
              "focus:shadow-[inset_0_0_0_1px_var(--color-accent)]",
              error && "border-[var(--color-danger)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[13px] text-[var(--color-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
