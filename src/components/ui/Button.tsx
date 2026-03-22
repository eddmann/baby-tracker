import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-accent)] text-white
    hover:brightness-110
    active:brightness-95
  `,
  secondary: `
    bg-[var(--color-accent)]/10 text-[var(--color-accent)]
    hover:bg-[var(--color-accent)]/15
    active:bg-[var(--color-accent)]/20
  `,
  ghost: `
    bg-transparent text-[var(--color-accent)]
    hover:bg-[var(--color-surface-secondary)]
    active:bg-[var(--color-border)]
  `,
  danger: `
    bg-[var(--color-danger)] text-white
    hover:brightness-110
    active:brightness-95
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] rounded-[var(--radius-sm)] gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-[var(--radius-md)] gap-2",
  lg: "h-[52px] px-5 text-[17px] rounded-[var(--radius-lg)] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center",
          "font-semibold tracking-[-0.01em]",
          "transition-all duration-200",
          "focus-ring press-effect",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size} />
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

function Spinner({ size }: { size: ButtonSize }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  return (
    <svg
      className={cn("animate-spin", sizeMap[size])}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
