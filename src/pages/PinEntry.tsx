import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../store";
import { verifyPin } from "../store/slices/authSlice";
import { cn } from "../lib/utils";
import { Delete } from "lucide-react";

export default function PinEntry() {
  const [pin, setPin] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length >= 4) {
        handleSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (pinValue: string) => {
    const result = await dispatch(verifyPin(pinValue));
    if (verifyPin.fulfilled.match(result)) {
      navigate("/", { replace: true });
    } else {
      setPin("");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-xs animate-fade-in">
        <h1 className="text-[28px] font-bold text-center text-[var(--color-text-primary)] mb-2">
          Baby Tracker
        </h1>
        <p className="text-[15px] text-center text-[var(--color-text-secondary)] mb-10">
          Enter your PIN
        </p>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-8" data-testid="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              data-filled={i < pin.length}
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-200",
                i < pin.length
                  ? "bg-[var(--color-accent)] scale-110"
                  : "bg-[var(--color-border)]",
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-[14px] text-center text-[var(--color-danger)] mb-4 animate-slide-up">
            {error}
          </p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (key) => {
              if (key === "") return <div key="empty" />;
              if (key === "del") {
                return (
                  <button
                    key="del"
                    onClick={handleDelete}
                    aria-label="Delete"
                    disabled={isLoading || pin.length === 0}
                    className={cn(
                      "h-16 rounded-[var(--radius-lg)]",
                      "flex items-center justify-center",
                      "text-[var(--color-text-primary)]",
                      "hover:bg-[var(--color-surface-secondary)]",
                      "transition-colors duration-200",
                      "press-effect",
                      "disabled:opacity-30",
                    )}
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleDigit(key)}
                  disabled={isLoading}
                  className={cn(
                    "h-16 rounded-[var(--radius-lg)]",
                    "bg-[var(--color-surface)]",
                    "shadow-[var(--shadow-sm)]",
                    "text-[22px] font-medium text-[var(--color-text-primary)]",
                    "hover:bg-[var(--color-surface-secondary)]",
                    "transition-colors duration-200",
                    "press-effect",
                    "disabled:opacity-50",
                  )}
                >
                  {key}
                </button>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
