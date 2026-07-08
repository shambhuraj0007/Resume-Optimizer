"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  suggestion: string;
  originalText: string;
  improvedText: string;
  category: 'text' | 'keyword' | 'other';
}

interface CompatibilityResult {
  currentScore: number;
  potentialScore: number;
  currentCallback: number;
  potentialCallback: number;
  keywords: string[];
  topRequiredKeywords?: string[];
  missingKeywords?: string[];
  suggestions: Suggestion[];
  textSuggestions?: Suggestion[];
  keywordSuggestions?: Suggestion[];
  otherSuggestions?: Suggestion[];
  scoreBreakdown?: {
    skills?: number;          // 0-35 points (new deterministic)
    experience?: number;      // 0-20 points (new deterministic)
    education?: number;       // 0-15 points (new deterministic)
    responsibilities?: number; // 0-15 points (new deterministic)
    title?: number;           // 0-10 points (new deterministic)
    format?: number;          // 0-5 points (new deterministic)
    // Old fields (backward compatibility)
    requiredSkills?: number;
    industry?: number;
  };
  confidence?: number;
  isValidJD?: boolean;
  isValidCV?: boolean;
  validationWarning?: string;
  // New deterministic scoring fields
  structuralFit?: boolean;
  matchedSkills?: Array<{ skill: string; matchType: string; locations: string[] }>;
  insufficentExperience?: boolean;
  experienceRequired?: number;
  experienceHas?: number;
  rawLLMData?: any; // Full LLM extraction result for simulation
  analysisId?: string;
  resumeText?: string;
  jobDescription?: string;
}

interface AnalysisContextType {
  isAnalyzing: boolean;
  result: CompatibilityResult | null;
  startAnalysis: (formData: FormData, onComplete?: () => void) => Promise<void>;
  clearResult: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const startAnalysis = useCallback(async (formData: FormData, onComplete?: () => void) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/ats-check", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error || "Analysis failed");
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Set result
      setResult(data);
      setIsAnalyzing(false);

      // Save to sessionStorage for persistence across navigation
      try {
        sessionStorage.setItem('currentAnalysisResult', JSON.stringify(data));
        console.log('✅ Analysis result saved to sessionStorage');
      } catch (error) {
        console.error('Error saving to sessionStorage:', error);
      }

      // Show validation warning if present
      if (data.validationWarning) {
        toast({
          title: "Validation Warning",
          description: data.validationWarning,
          variant: "destructive",
        });
      }

      // Call completion callback if provided
      if (onComplete) {
        onComplete();
      }

      // ------------------------------------------------------------------
      // GTM EVENT: scan_done and first_scan_done
      // ------------------------------------------------------------------
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        const scanCount = data.scansUsed || 1;

        if (scanCount === 1) {
          (window as any).dataLayer.push({
            event: 'first_scan_done',
            scan_count: 1,
            source: 'ats_checker',
          });
        }

        (window as any).dataLayer.push({
          event: 'scan_done',
          scan_count: scanCount,
          source: 'ats_checker',
        });
      }
      // ------------------------------------------------------------------
    } catch (error: any) {
      console.error("Error checking compatibility:", error);
      setIsAnalyzing(false);

      // Special handling for extension mode: if unauthorized, reload to show login screen
      const isExtensionMode = typeof window !== "undefined" &&
        (window.location.pathname.includes("extension-mode") ||
          localStorage.getItem("isExtensionMode") === "true");

      if (isExtensionMode && (error.message?.includes("Unauthorized") || error.status === 401)) {
        window.location.href = "/extension-mode";
        return;
      }

      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setIsAnalyzing(false);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        isAnalyzing,
        result,
        startAnalysis,
        clearResult,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
