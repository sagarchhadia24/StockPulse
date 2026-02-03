// app/(dashboard)/alerts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PriceAlert, AlertStatus } from "@/types";
import { AlertCard } from "@/components/alerts/alert-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Plus } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      setAlerts(data.alerts);
      setCount(data.count);
    } catch (err) {
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdate = async (id: string, status: AlertStatus) => {
    const response = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (response.ok) {
      fetchAlerts();
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/alerts?id=${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchAlerts();
    }
  };

  // Group alerts by status
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered");
  const disabledAlerts = alerts.filter((a) => a.status === "disabled");

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
          <p className="text-white/60 mt-1">
            {count} of 20 alerts used
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-white/40" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No alerts yet
          </h2>
          <p className="text-white/60 max-w-md mb-4">
            Set up price and valuation alerts from any stock detail page.
            You'll receive an email when your conditions are met.
          </p>
          <Button onClick={() => router.push("/")}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Stocks
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Active ({activeAlerts.length})
              </h2>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Triggered Alerts */}
          {triggeredAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Triggered ({triggeredAlerts.length})
              </h2>
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Disabled Alerts */}
          {disabledAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white/60">
                Disabled ({disabledAlerts.length})
              </h2>
              <div className="space-y-3">
                {disabledAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
