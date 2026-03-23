import { useState, useEffect, useRef } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { cn } from "../lib/utils";
import * as api from "../lib/api";

// Helper to convert ISO string to datetime-local format
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Helper to convert datetime-local to ISO string
function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString();
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    clearTimeout(timerRef.current);
    await onDelete();
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Button variant="danger" fullWidth onClick={handleClick}>
      {confirming ? "Tap again to confirm delete" : "Delete"}
    </Button>
  );
}

// ─── Sleep ───────────────────────────────────────────────

interface EditSleepModalProps {
  entry: {
    id: number;
    started_at: string;
    ended_at: string | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EditSleepModal({
  entry,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: EditSleepModalProps) {
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (entry) {
      setStartedAt(toDatetimeLocal(entry.started_at));
      setEndedAt(entry.ended_at ? toDatetimeLocal(entry.ended_at) : "");
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    const res = await api.updateSleep(entry.id, {
      started_at: fromDatetimeLocal(startedAt),
      ended_at: endedAt ? fromDatetimeLocal(endedAt) : undefined,
      notes: notes || null,
    });
    setSaving(false);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Sleep updated");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    const res = await api.deleteSleep(entry.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Sleep deleted");
      onDeleted();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Sleep">
      <div className="space-y-4">
        <Input
          label="Started"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
        <Input
          label="Ended"
          type="datetime-local"
          value={endedAt}
          onChange={(e) => setEndedAt(e.target.value)}
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
        />
        <Button size="lg" fullWidth onClick={handleSave} isLoading={saving}>
          Save
        </Button>
        <DeleteButton onDelete={handleDelete} />
      </div>
    </Modal>
  );
}

// ─── Feed ────────────────────────────────────────────────

interface EditFeedModalProps {
  entry: {
    id: number;
    type: string;
    side: string | null;
    started_at: string;
    ended_at: string | null;
    amount_ml: number | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EditFeedModal({
  entry,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: EditFeedModalProps) {
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [side, setSide] = useState<"left" | "right">("left");
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (entry) {
      setStartedAt(toDatetimeLocal(entry.started_at));
      setEndedAt(entry.ended_at ? toDatetimeLocal(entry.ended_at) : "");
      setSide((entry.side as "left" | "right") ?? "left");
      setAmountMl(entry.amount_ml ? String(entry.amount_ml) : "");
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const isBreast = entry?.type === "breast";

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    const fields: Parameters<typeof api.updateFeed>[1] = {
      started_at: fromDatetimeLocal(startedAt),
      notes: notes || null,
    };
    if (isBreast) {
      fields.side = side;
      if (endedAt) fields.ended_at = fromDatetimeLocal(endedAt);
    } else {
      const amount = parseInt(amountMl);
      if (amount > 0) fields.amount_ml = amount;
    }
    const res = await api.updateFeed(entry.id, fields);
    setSaving(false);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Feed updated");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    const res = await api.deleteFeed(entry.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Feed deleted");
      onDeleted();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Feed">
      <div className="space-y-4">
        <Input
          label="Started"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
        {isBreast && (
          <>
            <Input
              label="Ended"
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Side
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["left", "right"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={cn(
                      "h-11 rounded-[var(--radius-md)] text-[15px] font-semibold transition-all duration-200",
                      side === s
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]",
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {!isBreast && (
          <Input
            label="Amount (ml)"
            type="number"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder="e.g. 120"
          />
        )}
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
        />
        <Button size="lg" fullWidth onClick={handleSave} isLoading={saving}>
          Save
        </Button>
        <DeleteButton onDelete={handleDelete} />
      </div>
    </Modal>
  );
}

// ─── Nappy ───────────────────────────────────────────────

interface EditNappyModalProps {
  entry: {
    id: number;
    type: string;
    occurred_at: string;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EditNappyModal({
  entry,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: EditNappyModalProps) {
  const [type, setType] = useState<"wet" | "dirty" | "both">("wet");
  const [occurredAt, setOccurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (entry) {
      setType(entry.type as "wet" | "dirty" | "both");
      setOccurredAt(toDatetimeLocal(entry.occurred_at));
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const typeConfig = {
    wet: {
      color: "text-[var(--color-accent)]",
      bg: "bg-[var(--color-accent)]",
      label: "Wet",
    },
    dirty: {
      color: "text-[var(--color-warning)]",
      bg: "bg-[var(--color-warning)]",
      label: "Dirty",
    },
    both: {
      color: "text-[var(--color-danger)]",
      bg: "bg-[var(--color-danger)]",
      label: "Both",
    },
  };

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    const res = await api.updateNappy(entry.id, {
      type,
      occurred_at: fromDatetimeLocal(occurredAt),
      notes: notes || null,
    });
    setSaving(false);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Nappy updated");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    const res = await api.deleteNappy(entry.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Nappy deleted");
      onDeleted();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Nappy">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["wet", "dirty", "both"] as const).map((t) => {
              const config = typeConfig[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "h-11 rounded-[var(--radius-md)] text-[15px] font-semibold transition-all duration-200",
                    type === t
                      ? `${config.bg} text-white`
                      : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]",
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
        <Input
          label="Time"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
        />
        <Button size="lg" fullWidth onClick={handleSave} isLoading={saving}>
          Save
        </Button>
        <DeleteButton onDelete={handleDelete} />
      </div>
    </Modal>
  );
}

// ─── Pump ────────────────────────────────────────────────

interface EditPumpModalProps {
  entry: {
    id: number;
    started_at: string;
    ended_at: string | null;
    amount_ml: number | null;
    notes: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EditPumpModal({
  entry,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}: EditPumpModalProps) {
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (entry) {
      setStartedAt(toDatetimeLocal(entry.started_at));
      setEndedAt(entry.ended_at ? toDatetimeLocal(entry.ended_at) : "");
      setAmountMl(entry.amount_ml ? String(entry.amount_ml) : "");
      setNotes(entry.notes ?? "");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    const fields: Parameters<typeof api.updatePump>[1] = {
      started_at: fromDatetimeLocal(startedAt),
      notes: notes || null,
    };
    if (endedAt) fields.ended_at = fromDatetimeLocal(endedAt);
    const amount = parseInt(amountMl);
    if (amount > 0) fields.amount_ml = amount;
    const res = await api.updatePump(entry.id, fields);
    setSaving(false);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Pump updated");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    const res = await api.deletePump(entry.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Pump deleted");
      onDeleted();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Pump">
      <div className="space-y-4">
        <Input
          label="Started"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
        <Input
          label="Ended"
          type="datetime-local"
          value={endedAt}
          onChange={(e) => setEndedAt(e.target.value)}
        />
        <Input
          label="Amount (ml)"
          type="number"
          inputMode="numeric"
          value={amountMl}
          onChange={(e) => setAmountMl(e.target.value)}
          placeholder="e.g. 60"
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
        />
        <Button size="lg" fullWidth onClick={handleSave} isLoading={saving}>
          Save
        </Button>
        <DeleteButton onDelete={handleDelete} />
      </div>
    </Modal>
  );
}
