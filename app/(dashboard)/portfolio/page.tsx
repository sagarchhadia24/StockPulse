"use client";

import { useState, useEffect } from "react";
import { PortfolioSummaryCard } from "@/components/portfolio/portfolio-summary";
import { PositionCard } from "@/components/portfolio/position-card";
import { AddPositionForm } from "@/components/portfolio/add-position-form";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { PortfolioPositionWithMarket, PortfolioSummary } from "@/types";
import { Briefcase, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortfolioPage() {
  const [positions, setPositions] = useState<PortfolioPositionWithMarket[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolio");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPositions(data.positions || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleDelete = async (positionId: string) => {
    try {
      const response = await fetch(`/api/portfolio?id=${positionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPortfolio();
      }
    } catch (error) {
      console.error("Error deleting position:", error);
    }
  };

  const handleAdd = async () => {
    setShowAddForm(false);
    fetchPortfolio();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-sm text-muted-foreground">Track your stock positions</p>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Position
        </Button>
      </div>

      {/* Empty State */}
      {positions.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">No positions yet</h2>
            <p className="text-muted-foreground mt-1">
              Start tracking your investments by adding your first position.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Position
          </Button>
        </div>
      )}

      {/* Portfolio Content */}
      {positions.length > 0 && summary && (
        <>
          <PortfolioSummaryCard summary={summary} />
          <PortfolioChart positions={positions} />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Positions ({positions.length})</h2>
            <div className="grid gap-3">
              {positions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onDelete={() => handleDelete(position.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Position Dialog */}
      <AddPositionForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={handleAdd}
      />
    </div>
  );
}
