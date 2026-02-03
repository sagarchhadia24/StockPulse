// components/alerts/alert-card.tsx
"use client";

import { useState } from "react";
import { PriceAlert, AlertType, AlertStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trash2,
  RefreshCw,
  Pause,
  Play,
  Loader2,
} from "lucide-react";

interface AlertCardProps {
  alert: PriceAlert;
  onUpdate: (id: string, status: AlertStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function getAlertIcon(alertType: AlertType) {
  switch (alertType) {
    case "price_above":
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case "price_below":
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case "valuation_above":
    case "valuation_below":
      return <BarChart3 className="h-4 w-4 text-blue-400" />;
  }
}

function getAlertDescription(alert: PriceAlert): string {
  const threshold = alert.alertType.startsWith("price_")
    ? `$${alert.threshold.toFixed(2)}`
    : alert.threshold.toString();

  switch (alert.alertType) {
    case "price_above":
      return `Price goes above ${threshold}`;
    case "price_below":
      return `Price drops below ${threshold}`;
    case "valuation_above":
      return `Value score goes above ${threshold}`;
    case "valuation_below":
      return `Value score drops below ${threshold}`;
  }
}

function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
    case "triggered":
      return <Badge className="bg-blue-500/20 text-blue-400">Triggered</Badge>;
    case "disabled":
      return <Badge variant="secondary">Disabled</Badge>;
  }
}

export function AlertCard({ alert, onUpdate, onDelete }: AlertCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: AlertStatus) => {
    setLoading(true);
    try {
      await onUpdate(alert.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(alert.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-white/5 transition-all",
        alert.status === "active" && "border-green-500/30",
        alert.status === "triggered" && "border-blue-500/30",
        alert.status === "disabled" && "border-white/10 opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getAlertIcon(alert.alertType)}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{alert.symbol}</span>
              {getStatusBadge(alert.status)}
            </div>
            <p className="text-sm text-white/60 mt-1">
              {getAlertDescription(alert)}
            </p>
            {alert.status === "triggered" && alert.triggeredAt && (
              <p className="text-xs text-white/40 mt-2">
                Triggered at {alert.triggeredValue?.toFixed(2)} on{" "}
                {new Date(alert.triggeredAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          ) : (
            <>
              {alert.status === "active" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("disabled")}
                  title="Pause alert"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {alert.status === "disabled" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("active")}
                  title="Resume alert"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {alert.status === "triggered" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("active")}
                  title="Re-enable alert"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
                title="Delete alert"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
