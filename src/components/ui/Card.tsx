import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "inset" | "elevated";
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const variantStyles = {
  default: "bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
  inset: "bg-[var(--color-surface)] border border-[var(--color-border)]",
  elevated: "bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      header,
      footer,
      padding = "md",
      variant = "default",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] overflow-hidden",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {header && (
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            {header}
          </div>
        )}
        <div className={paddingStyles[padding]}>{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = "Card";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardGroup({ children, className, ...props }: CardGroupProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-surface)]",
        "rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-sm)]",
        "overflow-hidden",
        "divide-y divide-[var(--color-border)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onClick?: () => void;
}

export function CardRow({
  children,
  onClick,
  className,
  ...props
}: CardRowProps) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      className={cn(
        "px-4 py-3 flex items-center justify-between",
        interactive &&
          "cursor-pointer press-effect hover:bg-[var(--color-surface-secondary)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
