import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { formatRelativeDay, formatDate } from "../lib/utils";
import * as api from "../lib/api";
import { Ruler } from "lucide-react";
import { FloatingActionButton } from "../components/ui/TabBar";
import { EditGrowthModal } from "../components/EditEntryModals";

interface GrowthEntry {
  id: number;
  weight_grams: number | null;
  height_mm: number | null;
  measured_at: string;
  notes: string | null;
}

function gramsToKg(g: number): string {
  return (g / 1000).toFixed(2);
}

function gramsToLbs(g: number): string {
  return (g / 453.592).toFixed(1);
}

function mmToCm(mm: number): string {
  return (mm / 10).toFixed(1);
}

function mmToInches(mm: number): string {
  return (mm / 25.4).toFixed(1);
}

export default function Growth() {
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GrowthEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const res = await api.getGrowthEntries();
    setEntries((res.data?.entries as unknown as GrowthEntry[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    const weightGrams = weightKg
      ? Math.round(parseFloat(weightKg) * 1000)
      : null;
    const heightMm = heightCm ? Math.round(parseFloat(heightCm) * 10) : null;

    if (!weightGrams && !heightMm) {
      showToast("error", "Enter at least weight or height");
      return;
    }

    setSaving(true);
    const res = await api.logGrowth(
      weightGrams,
      heightMm,
      undefined,
      notes || undefined,
    );
    setSaving(false);

    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", "Growth entry logged");
      setWeightKg("");
      setHeightCm("");
      setNotes("");
      setShowAdd(false);
      refresh();
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Growth" subtitle="Track weight & height" />

      {entries.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Ruler className="w-6 h-6" />}
          title="No growth entries yet"
          description="Tap Add to log a measurement"
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              padding="md"
              className="cursor-pointer press-effect"
              onClick={() => setEditingEntry(entry)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {entry.weight_grams && (
                    <p className="text-[24px] font-bold text-[var(--color-accent)] leading-tight">
                      {gramsToKg(entry.weight_grams)}
                      <span className="text-[15px] font-medium">kg</span>
                    </p>
                  )}
                  {entry.height_mm && (
                    <p className="text-[24px] font-bold text-[var(--color-purple)] leading-tight">
                      {mmToCm(entry.height_mm)}
                      <span className="text-[15px] font-medium">cm</span>
                    </p>
                  )}
                  <p className="text-[13px] text-[var(--color-text-secondary)]">
                    {formatRelativeDay(entry.measured_at)
                      ? `${formatRelativeDay(entry.measured_at)} · `
                      : ""}
                    {formatDate(entry.measured_at.slice(0, 10))}
                  </p>
                  {entry.notes && (
                    <p className="text-[13px] text-[var(--color-text-tertiary)]">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1 pt-1">
                  {entry.weight_grams && (
                    <p className="text-[14px] text-[var(--color-text-secondary)] tabular-nums">
                      {gramsToLbs(entry.weight_grams)}lbs
                    </p>
                  )}
                  {entry.height_mm && (
                    <p className="text-[14px] text-[var(--color-text-secondary)] tabular-nums">
                      {mmToInches(entry.height_mm)}in
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FloatingActionButton onClick={() => setShowAdd(true)} label="Add" />

      {/* Add Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Log Measurement"
      >
        <div className="space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 4.30"
            hint={
              weightKg
                ? `${gramsToLbs(Math.round(parseFloat(weightKg) * 1000))} lbs`
                : undefined
            }
          />
          <Input
            label="Height (cm)"
            type="number"
            inputMode="decimal"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g. 52.5"
            hint={
              heightCm
                ? `${mmToInches(Math.round(parseFloat(heightCm) * 10))} inches`
                : undefined
            }
          />
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Day 36 weigh-in, 25th percentile"
          />
          <Button
            size="lg"
            fullWidth
            onClick={handleAdd}
            isLoading={saving}
            disabled={!weightKg && !heightCm}
          >
            Save
          </Button>
        </div>
      </Modal>

      <EditGrowthModal
        entry={editingEntry}
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={() => {
          setEditingEntry(null);
          refresh();
        }}
        onDeleted={() => {
          setEditingEntry(null);
          refresh();
        }}
      />
    </PageContainer>
  );
}
