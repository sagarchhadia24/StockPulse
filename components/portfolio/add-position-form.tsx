"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AddPositionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPositionForm({ open, onOpenChange, onSuccess }: AddPositionFormProps) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!symbol.trim() || !shares || !buyPrice) {
      setError("Symbol, shares, and buy price are required");
      return;
    }

    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(buyPrice);

    if (sharesNum <= 0 || priceNum <= 0) {
      setError("Shares and buy price must be positive");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          shares: sharesNum,
          buyPrice: priceNum,
          buyDate: buyDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add position");
      }

      // Reset form
      setSymbol("");
      setShares("");
      setBuyPrice("");
      setBuyDate("");
      setNotes("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add position");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="symbol">Stock Symbol</Label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. AAPL"
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shares">Shares</Label>
              <input
                id="shares"
                type="number"
                step="0.0001"
                min="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <Label htmlFor="buyPrice">Buy Price ($)</Label>
              <input
                id="buyPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="buyDate">Buy Date (optional)</Label>
            <input
              id="buyDate"
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this position..."
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background resize-none"
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Position"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
