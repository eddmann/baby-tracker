import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import { TabBar } from "../ui/TabBar";
import { Loader2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store";
import { checkSession } from "../../store/slices/authSlice";
import { cn } from "../../lib/utils";
import { TOKEN_KEY } from "../../../shared/constants";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-background)]">
      <main className="flex-1 pt-[env(safe-area-inset-top,0px)] pb-[calc(49px+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <TabBar />
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("max-w-lg mx-auto px-4 py-6 page-content", className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] text-[var(--color-text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
    </div>
  );
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const token = localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      dispatch(checkSession());
    }
  }, [token, isAuthenticated, isLoading, dispatch]);

  useEffect(() => {
    if (!token && !isLoading) {
      navigate("/pin");
    }
  }, [token, isLoading, navigate]);

  if (isLoading || (token && !isAuthenticated)) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-[14px] text-[var(--color-text-secondary)] max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default AppShell;
