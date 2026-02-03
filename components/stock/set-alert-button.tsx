// components/stock/set-alert-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertForm } from "@/components/alerts/alert-form";
import { Bell } from "lucide-react";
import { toast } from "sonner";

interface SetAlertButtonProps {
  symbol: string;
  currentPrice: number;
  currentScore: number;
}

export function SetAlertButton({
  symbol,
  currentPrice,
  currentScore,
}: SetAlertButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    toast.success("Alert created successfully!");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Set Alert
      </Button>

      <AlertForm
        symbol={symbol}
        currentPrice={currentPrice}
        currentScore={currentScore}
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
