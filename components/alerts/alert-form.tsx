// components/alerts/alert-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertType } from "@/types";
import { Loader2 } from "lucide-react";

interface AlertFormProps {
  symbol: string;
  currentPrice: number;
  currentScore: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALERT_TYPE_OPTIONS: { value: AlertType; label: string }[] = [
  { value: "price_above", label: "Price goes above" },
  { value: "price_below", label: "Price drops below" },
  { value: "valuation_above", label: "Becomes undervalued (score above 65)" },
  { value: "valuation_below", label: "Becomes overvalued (score below 35)" },
];

export function AlertForm({
  symbol,
  currentPrice,
  currentScore,
  open,
  onOpenChange,
  onSuccess,
}: AlertFormProps) {
  const [alertType, setAlertType] = useState<AlertType>("price_above");
  const [threshold, setThreshold] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPriceAlert = alertType.startsWith("price_");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const thresholdValue = parseFloat(threshold);
    if (isNaN(thresholdValue) || thresholdValue <= 0) {
      setError("Please enter a valid threshold");
      return;
    }

    // Validate valuation thresholds
    if (!isPriceAlert && (thresholdValue < 0 || thresholdValue > 100)) {
      setError("Value score must be between 0 and 100");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          alertType,
          threshold: thresholdValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create alert");
        return;
      }

      onSuccess();
      onOpenChange(false);
      setThreshold("");
    } catch (err) {
      setError("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: AlertType) => {
    setAlertType(value);
    // Set default threshold based on type
    if (value === "price_above") {
      setThreshold((currentPrice * 1.1).toFixed(2)); // 10% above
    } else if (value === "price_below") {
      setThreshold((currentPrice * 0.9).toFixed(2)); // 10% below
    } else if (value === "valuation_above") {
      setThreshold("65");
    } else if (value === "valuation_below") {
      setThreshold("35");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Alert for {symbol}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alert Type</Label>
            <Select value={alertType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {isPriceAlert ? "Target Price ($)" : "Target Score (0-100)"}
            </Label>
            <Input
              type="number"
              step={isPriceAlert ? "0.01" : "1"}
              min={isPriceAlert ? "0.01" : "0"}
              max={isPriceAlert ? undefined : "100"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={isPriceAlert ? "Enter price..." : "Enter score..."}
            />
            <p className="text-xs text-muted-foreground">
              Current {isPriceAlert ? "price" : "score"}:{" "}
              {isPriceAlert ? `$${currentPrice.toFixed(2)}` : currentScore}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Alert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
