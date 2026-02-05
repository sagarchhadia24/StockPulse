// components/stock/ai-insight-section.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsight, AnalysisStyle } from "@/types";
import {
  Sparkles,
  RefreshCw,
  Clock,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightSectionProps {
  symbol: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffHours >= 24) {
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
  }
  if (diffHours >= 1) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
}

function getConfidenceConfig(confidence: string) {
  switch (confidence) {
    case "high":
      return {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        label: "High confidence",
        description: "Analysis based on comprehensive data",
      };
    case "medium":
      return {
        icon: Info,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        label: "Medium confidence",
        description: "Some metrics unavailable",
      };
    case "low":
      return {
        icon: AlertTriangle,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        label: "Low confidence",
        description: "Limited data available",
      };
    default:
      return {
        icon: Info,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        label: "Unknown",
        description: "",
      };
  }
}

export function AIInsightSection({ symbol }: AIInsightSectionProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analysisStyle, setAnalysisStyle] = useState<AnalysisStyle>("concise");
  const [staleWarning, setStaleWarning] = useState<string | null>(null);

  const generateInsight = async (refresh: boolean = false) => {
    setLoading(true);
    setError(null);
    setStaleWarning(null);

    try {
      const response = await fetch(`/api/stocks/${symbol}/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh, style: analysisStyle }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate insight");
      }

      const data = await response.json();
      setInsight(data);
      setHasLoaded(true);

      if (data.staleReason) {
        setStaleWarning(data.staleReason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  };

  const confidenceConfig = insight ? getConfidenceConfig(insight.confidence) : null;
  const ConfidenceIcon = confidenceConfig?.icon || Info;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00dc82]" />
            AI Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {!hasLoaded && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={analysisStyle === "concise" ? "default" : "ghost"}
                  onClick={() => setAnalysisStyle("concise")}
                  className="h-7 text-xs"
                >
                  Concise
                </Button>
                <Button
                  size="sm"
                  variant={analysisStyle === "detailed" ? "default" : "ghost"}
                  onClick={() => setAnalysisStyle("detailed")}
                  className="h-7 text-xs"
                >
                  Detailed
                </Button>
              </div>
            )}
            {insight && (
              <>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(insight.generatedAt)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => generateInsight(true)}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasLoaded && !loading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#00dc82]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-[#00dc82]" />
            </div>
            <p className="text-muted-foreground mb-4">
              Get AI-powered analysis of this stock&apos;s valuation with sector comparisons.
            </p>
            <Button onClick={() => generateInsight()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {analysisStyle === "detailed" ? "Detailed " : ""}AI Insight
                </>
              )}
            </Button>
          </div>
        )}

        {loading && !insight && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateInsight()}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {staleWarning && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-500">{staleWarning}</p>
          </div>
        )}

        {insight && !loading && (
          <div className="space-y-6">
            {/* Confidence Badge */}
            {confidenceConfig && (
              <div className={cn("flex items-center gap-2 p-2 rounded-lg", confidenceConfig.bgColor)}>
                <ConfidenceIcon className={cn("h-4 w-4", confidenceConfig.color)} />
                <span className={cn("text-sm font-medium", confidenceConfig.color)}>
                  {confidenceConfig.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  - {confidenceConfig.description}
                </span>
              </div>
            )}

            {/* Summary */}
            <div>
              <p className="leading-relaxed">{insight.summary}</p>
            </div>

            {/* Valuation Analysis */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Valuation Analysis
              </h4>
              <p className="text-sm leading-relaxed">
                {insight.valuationAnalysis}
              </p>
            </div>

            {/* Recent Performance */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Recent Performance
              </h4>
              <p className="text-sm leading-relaxed">
                {insight.recentPerformance}
              </p>
            </div>

            {/* Key Considerations */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Key Considerations
              </h4>
              <ul className="space-y-2">
                {insight.keyConsiderations.map((consideration, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-[#00dc82] mt-1">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
              {insight.keyConsiderations.length === 1 &&
               insight.keyConsiderations[0].includes("Analysis based on") && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Try refreshing for more detailed considerations
                </p>
              )}
            </div>

            {/* Data Quality Indicator */}
            {insight.inputData.dataCompleteness !== undefined && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      insight.inputData.dataCompleteness >= 70 ? "bg-green-500" :
                      insight.inputData.dataCompleteness >= 40 ? "bg-yellow-500" : "bg-orange-500"
                    )}
                    style={{ width: `${insight.inputData.dataCompleteness}%` }}
                  />
                </div>
                <span>{insight.inputData.dataCompleteness}% data coverage</span>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground border-t pt-4">
              AI-generated analysis based on current metrics and sector comparisons. Not financial advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
