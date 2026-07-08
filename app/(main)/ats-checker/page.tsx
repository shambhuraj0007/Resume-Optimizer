"use client";

import { useState, useEffect } from "react";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useSession } from "next-auth/react";
import {
  Upload as UploadIcon,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Coins,
  TrendingUp,
  Briefcase,
  FileText,
  Copy,
  Info,
  Sparkles,
  Target,
  AlertTriangle,
  XCircle,
  Check,
  ArrowUp,
  X,
  ChevronRight,
  Star,
  Download,
  Share2,
  ArrowRight,
  Layout,
  Type,
  Clock,
  GraduationCap,
  Award,
  Languages,
  Lock,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import InsufficientCreditsModal from "@/components/credits/InsufficientCreditsModal";
import UpgradeModal from "@/components/credits/UpgradeModal";
import AnimatedRoundedLoader from "./AnimatedRoundedLoader";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { baseCallbackProbability, calculateScores, adjustProbability } from "@/lib/scoring/scoreEngine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { validateResume, ValidationResult } from "@/lib/resume-validation";
import { validateJobDescription } from "@/lib/jd-validation";
import { getFileFromDB, saveFileToDB } from "@/lib/indexed-db";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import ResumeTemplatesPromo from "@/components/seo/ResumeTemplatesPromo";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface Suggestion {
  suggestion: string;
  originalText: string;
  improvedText: string;
  category: "text" | "keyword" | "other";
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
    requiredSkills: number;
    experience: number;
    responsibilities: number;
    education: number;
    industry: number;
  };
  confidence?: number;
  isValidJD?: boolean;
  isValidCV?: boolean;
  validationWarning?: string;
  insufficentExperience?: boolean;
  experienceRequired?: number;
  experienceHas?: number;
  rawLLMData?: any;
}
// --- ADD THESE HELPER COMPONENTS BEFORE YOUR MAIN FUNCTION ---

const SuggestionItem = ({ item, idx, copyToClipboard }: { item: any, idx: number, copyToClipboard: (text: string) => void }) => {
  // Cast icons to any to fix TypeScript errors
  const CopyIcon = Copy as any;
  const InfoIcon = Info as any;

  return (
    <AccordionItem
      value={`suggestion-${idx}`}
      className="border-slate-200 dark:border-slate-700"
    >
      <AccordionTrigger className="text-left hover:no-underline">
        <div className="flex items-start gap-2 w-full">
          <span className={`mt-0.5 shrink-0 font-semibold ${item.category === 'text' ? 'text-blue-600 dark:text-blue-400' :
            item.category === 'keyword' ? 'text-purple-600 dark:text-purple-400' :
              'text-pink-600 dark:text-pink-400'
            }`}>
            {idx + 1}.
          </span>
          <div className="flex-1">
            <span className="text-sm text-foreground">
              {item.suggestion}
            </span>
            {item.category && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.category === "text"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  : item.category === "keyword"
                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                  }`}
              >
                {item.category}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2">
          {/* Original Text Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                {(item.originalText === "MISSING" || !item.originalText) ? "Missing from Resume" : "Current Text"}
              </label>
              {(item.originalText !== "MISSING" && item.originalText) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(item.originalText);
                  }}
                  className="h-6 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <CopyIcon className="h-3 w-3 mr-1" /> Copy
                </Button>
              )}
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-950 dark:text-red-100 italic">
                {(item.originalText === "MISSING" || !item.originalText) ? "⚠️ Content missing in the resume" : item.originalText}
              </p>
            </div>
          </div>

          {/* Improved Text Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                Suggested Text
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.improvedText);
                }}
                className="h-6 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
              >
                <CopyIcon className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-950 dark:text-green-100">
                {item.improvedText}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-950 dark:text-blue-100">
              Copy the Suggested text and replace it in your resume for better ATS optimization
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const UpgradeOverlay = ({ count, setShowUpgradeModal }: { count: number, setShowUpgradeModal: (open: boolean) => void }) => {
  const SparklesIcon = Sparkles as any;
  return (
    <div className="relative mt-4 p-6 border rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden text-center">
      <div className="absolute inset-0 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/50">
        <p className="text-lg font-semibold mb-2 text-foreground">
          Unlock  More Suggestions
        </p>
        <Button onClick={() => setShowUpgradeModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <SparklesIcon className="w-4 h-4 mr-2" /> Upgrade to Unlock All
        </Button>
      </div>
      <div className="space-y-4 opacity-50 blur-sm pointer-events-none select-none">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      </div>
    </div>
  );
};

export default function JobMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showOptimizerConfirm, setShowOptimizerConfirm] = useState(false); // ✅ New state
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const { shouldNavigateOnAnalyze } = useNavigationContext?.() ?? {
    shouldNavigateOnAnalyze: false,
  };

  const { balance, checkCredits, refreshBalance, isPro } = useCredits();
  const { isAnalyzing, result, startAnalysis, clearResult } = useAnalysis();

  // Validation State
  const [isResumeValid, setIsResumeValid] = useState(false);
  const [resumeValidationError, setResumeValidationError] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<'none' | 'warning' | 'error'>('none');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isJDValid, setIsJDValid] = useState(false);
  const [jdValidationError, setJdValidationError] = useState<string | null>(null);
  const [jdErrorState, setJdErrorState] = useState<'none' | 'warning' | 'error'>('none');
  const [isValidatingResume, setIsValidatingResume] = useState(false);
  const [isValidatingJD, setIsValidatingJD] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(false);

  // Interactive Suggestions State
  const [appliedSuggestions, setAppliedSuggestions] = useState<number[]>([]);
  const [liveScore, setLiveScore] = useState<number>(0);
  const [liveCallback, setLiveCallback] = useState<number>(0);

  // Reset live score when result changes
  useEffect(() => {
    if (result) {
      setLiveScore(result.currentScore);
      setLiveCallback(result.currentCallback);
      setAppliedSuggestions([]);
    }
  }, [result]);

  // Error message function
  const getErrorMessage = (result: ValidationResult, fileSize?: number, fileType?: string, textLength?: number) => {

    // RED (Hard rejects) - check in priority order
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return "File size exceeds 5MB. Please compress your resume.";
    }

    if (fileType && !fileType.toLowerCase().includes('pdf')) {
      return "Please upload PDF files only.";
    }

    if (textLength && textLength < 200) {
      return "Scanned/image PDFs not supported. Use searchable PDF.";
    }

    // Check validation result for other red conditions
    if (result.recommendedAction === 'reject') {
      const reason = result.rejectionReason?.toLowerCase() || '';

      if (reason.includes('page')) {
        return "Document exceeds 5 page limit.";
      }
      if (reason.includes('contact') || reason.includes('identity')) {
        return "No contact details found. Please add your email or phone number to your resume.";
      }
      if (reason.includes('not a resume')) {
        return "This doesn't seem like a valid resume. Please provide a document detailing your experience and education.";
      }

      return result.rejectionReason || "This doesn't seem like a valid resume. Please provide a document detailing your experience and education.";
    }

    // YELLOW (Soft warnings)
    if (result.recommendedAction === 'review') {
      const reason = result.rejectionReason?.toLowerCase() || '';

      if (reason.includes('employ') || reason.includes('experience') || reason.includes('history')) {
        return 'Resume incomplete (missing experience). Consider reviewing.';
      }
      if (reason.includes('education')) {
        return 'Resume incomplete (missing education). Consider reviewing.';
      }
      if (reason.includes('skill')) {
        return 'Resume incomplete (missing skills). Consider reviewing.';
      }

      return 'Resume appears incomplete. Consider reviewing.';
    }

    return ''; // Accept - no message
  };

  // Validation Helpers
  const validateResumeContent = (text: string) => {
    if (!text.trim()) {
      setIsResumeValid(false);
      setResumeValidationError(null);
      setErrorState('none');
      return;
    }

    setIsValidatingResume(true);
    try {
      const result = validateResume(text);

      // Get appropriate message
      const message = getErrorMessage(result);

      setResumeValidationError(message || null);
      setValidationResult(result);

      // Set visual state
      if (result.recommendedAction === 'accept') {
        setErrorState('none');
        setIsResumeValid(true);
      } else if (result.recommendedAction === 'review') {
        setErrorState('warning');
        setIsResumeValid(true); // Allow proceed
      } else {
        setErrorState('error');
        setIsResumeValid(false);
      }
    } catch (e) {
      setResumeValidationError("Doesn't look like a resume");
      setIsResumeValid(false);
      setErrorState('error');
    } finally {
      setIsValidatingResume(false);
    }
  };

  const validateJDContent = (text: string) => {
    if (!text.trim()) {
      setIsJDValid(false);
      setJdValidationError(null);
      setJdErrorState('none');
      return;
    }

    setIsValidatingJD(true);
    try {
      // Use local validation (Faster)
      const data = validateJobDescription(text);

      if (!data.isValid) {
        setJdValidationError(data.message || "Invalid job description.");
        setIsJDValid(false);
        setJdErrorState('error');
      } else {
        setJdValidationError(null);
        setIsJDValid(true);
        setJdErrorState('none');
      }
    } catch (e) {
      setJdValidationError("Doesn't look like a Job description");
      setIsJDValid(false);
      setJdErrorState('error');
    } finally {
      setIsValidatingJD(false);
    }
  };

  const handleFileValidation = async (file: File) => {
    setIsValidatingResume(true);
    setResumeValidationError(null);

    // Initial Hygiene Check (Pre-extraction)
    const hygieneResult = validateResume("", undefined, file.name, file.size, file.type);

    if (hygieneResult.recommendedAction === 'reject' &&
      (hygieneResult.rejectionReason?.includes('size') || hygieneResult.rejectionReason?.includes('PDF'))) {
      setResumeValidationError(getErrorMessage(hygieneResult));
      setErrorState('error');
      setIsResumeValid(false);
      setIsValidatingResume(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.text;
        const numPages = data.numPages;

        // Run full validation
        const result = validateResume(text, numPages, file.name, file.size, file.type);

        // Get appropriate message
        const message = getErrorMessage(result, file.size, file.type, text.length);

        setResumeValidationError(message || null);
        setValidationResult(result);

        // Set visual state
        if (result.recommendedAction === 'accept') {
          setErrorState('none');
          setIsResumeValid(true);
        } else if (result.recommendedAction === 'review') {
          setErrorState('warning');
          setIsResumeValid(true); // Allow proceed
        } else {
          setErrorState('error');
          setIsResumeValid(false);
        }

        // Update resume text state if valid enough to be useful (or let user fix it)
        if (result.recommendedAction !== 'reject' || (result.score > 0)) {
          setResumeText(text); // Might as well populate it
        }

      } else {
        const errorData = await response.json();
        // Handle extraction errors (password etc) logic via validateResume if possible
        const isPasswordError = errorData.error && errorData.error.toLowerCase().includes('password');

        const result = validateResume("", undefined, file.name, file.size, file.type, isPasswordError);

        if (result.recommendedAction === 'reject') {
          setResumeValidationError(getErrorMessage(result));
        } else {
          setResumeValidationError(errorData.error || "Failed to extract text from PDF");
        }

        setIsResumeValid(false);
        setErrorState('error');
        setIsValidatingResume(false);
      }
    } catch (error) {
      setResumeValidationError("Failed to process PDF. Please try again.");
      setIsResumeValid(false);
      setErrorState('error');
      setIsValidatingResume(false);
    } finally {
      setIsValidatingResume(false);
    }
  };

  // Save draft on changes
  useEffect(() => {
    const saveDraft = async () => {
      let fileToStore = null;
      if (pdfFile) {
        try {
          await saveFileToDB("atsCheckerDraftResume", pdfFile);
          fileToStore = {
            name: pdfFile.name,
            type: pdfFile.type,
            dataUrl: "STORED_IN_INDEXEDDB",
          };
        } catch (e) {
          fileToStore = {
            name: pdfFile.name,
            type: pdfFile.type,
            dataUrl: await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(pdfFile);
            }),
          };
        }
      }

      const draft = {
        resumeData: resumeText,
        resumeFile: fileToStore,
        inputMode,
        timestamp: Date.now(),
      };
      localStorage.setItem("atsCheckerDraft", JSON.stringify(draft));
    };

    const timeoutId = setTimeout(saveDraft, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [resumeText, inputMode, pdfFile]);

  // Restore state on mount
  useEffect(() => {
    const initializeState = async () => {
      // 0. RESET STATE IF NEW
      const isNewSession = searchParams.get("new");
      if (isNewSession) {
        localStorage.removeItem("optimizedResumeSession");
        localStorage.removeItem("pendingAnalysis");
        sessionStorage.removeItem("savedJobDescription");
        setIsCheckingPending(false);
        return; // Stop initialization, let the user start fresh
      }

      // 1. Navigation Guard: Redirect to optimizer if session exists and not forced for new analysis
      const optimizedResumeSession = localStorage.getItem("optimizedResumeSession");
      if (optimizedResumeSession && !localStorage.getItem("forceNewAnalysis")) {
        router.replace("/resume-optimizer");
        return;
      }

      // 2. CHECK FOR PENDING ANALYSIS (Handoff from Home Page)
      const pendingAnalysisStr = localStorage.getItem("pendingAnalysis");

      if (pendingAnalysisStr) {
        try {
          const payload = JSON.parse(pendingAnalysisStr);

          // Check if it's recent (within last 5 minutes)
          if (Date.now() - payload.timestamp < 300000) {
            localStorage.removeItem("pendingAnalysis"); // Clear it so it doesn't run again on refresh

            // A. Restore Job Description
            setJobDescription(payload.jobDescription);
            validateJDContent(payload.jobDescription);

            // B. Restore Resume
            if (payload.resumeFile) {
              setInputMode("upload");
              let file: File | null = null;

              // Only proceed if we have valid Data URL or valid IndexedDB flag
              const dataUrl = payload.resumeFile.dataUrl;

              // Check if file is in IndexedDB
              if (dataUrl === "STORED_IN_INDEXEDDB") {
                try {
                  const blob = await getFileFromDB("pendingResume");
                  if (blob) {
                    file = new File([blob], payload.resumeFile.name, { type: payload.resumeFile.type });
                  } else {
                    console.error("IndexedDB blob not found for pendingResume");
                  }
                } catch (e) {
                  console.error("Error retrieving from IndexedDB:", e);
                }
              }
              // Fallback for older legacy Base64 (if any)
              else if (dataUrl && dataUrl.startsWith("data:")) {
                try {
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  file = new File([blob], payload.resumeFile.name, { type: payload.resumeFile.type });
                } catch (e) {
                  console.error("Error evaluating data URL:", e);
                }
              }

              if (file) {
                setPdfFile(file);
                handleFileValidation(file);

                // Auto-start logic
                if (payload.autoStart) {
                  // Small delay to ensure state is set
                  setTimeout(() => {
                    const formData = new FormData();
                    formData.append("resume", file as File);
                    formData.append("jobDescription", payload.jobDescription);
                    startAnalysis(formData, () => refreshBalance());
                    setIsCheckingPending(false);
                  }, 100);
                }
              }
            }
            // C. Restore Text Paste
            else if (typeof payload.resumeData === "string") {
              setInputMode("paste");
              setResumeText(payload.resumeData);
              validateResumeContent(payload.resumeData);

              if (payload.autoStart) {
                setTimeout(() => {
                  const formData = new FormData();
                  const blob = new Blob([payload.resumeData], { type: "text/plain" });
                  const textFile = new File([blob], "resume.txt", { type: "text/plain" });
                  formData.append("resume", textFile);
                  formData.append("jobDescription", payload.jobDescription);
                  startAnalysis(formData, () => refreshBalance());
                  setIsCheckingPending(false);
                }, 100);
              }
            }
            return; // Stop here if pending analysis was found and handled
          }
        } catch (e) {
          console.error("Error loading pending analysis:", e);
          localStorage.removeItem("pendingAnalysis");
        }
      } else {
        // If NO pending analysis, check session storage for just the JD
        const savedJd = sessionStorage.getItem("savedJobDescription");
        if (savedJd && !jobDescription) {
          setJobDescription(savedJd);
          validateJDContent(savedJd);
        }
      }

      // 3. CHECK FOR DRAFTS (Page Refresh)
      const draftStr = localStorage.getItem("atsCheckerDraft");

      if (draftStr && !pendingAnalysisStr) { // Only check draft if no pending analysis
        try {
          const draft = JSON.parse(draftStr);
          if (Date.now() - draft.timestamp < 86400000) {
            if (draft.inputMode) setInputMode(draft.inputMode);
            if (draft.resumeText) {
              setResumeText(draft.resumeData || draft.resumeText);
              validateResumeContent(draft.resumeData || draft.resumeText);
            }
            if (draft.resumeFile) {
              let file: File | null = null;
              const dataUrl = draft.resumeFile.dataUrl;

              if (dataUrl === "STORED_IN_INDEXEDDB") {
                const blob = await getFileFromDB("atsCheckerDraftResume");
                if (blob) {
                  file = new File([blob], draft.resumeFile.name, { type: draft.resumeFile.type });
                }
              } else if (dataUrl && dataUrl.startsWith("data:")) {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                file = new File([blob], draft.resumeFile.name, { type: draft.resumeFile.type });
              }

              if (file) {
                setPdfFile(file);
                handleFileValidation(file);
              }
            }
          }
        } catch (e) {
          // console.error("Error loading draft:", e);
        }
      }

      // If we didn't find a pending analysis that auto-started, we are done checking
      if (!pendingAnalysisStr) {
        setIsCheckingPending(false);
      } else {
        // If we did find one, we leave isCheckingPending true until startAnalysis takes over?
        // Actually startAnalysis sets isAnalyzing=true.
        // We need to make sure there is no gap.
        // The startAnalysis call is inside the pendingAnalysis block (lines 588-596).
        // It uses setTimeout(..., 100).
        // So we should setIsCheckingPending(false) INSIDE that timeout or after startAnalysis.
        // But for safety, let's rely on isAnalyzing taking over.
        const payload = JSON.parse(pendingAnalysisStr);
        if (!payload.autoStart) {
          setIsCheckingPending(false);
        }
      }
    };

    initializeState();
    initializeState();
  }, [searchParams]);

  // Onboarding Tour
  useEffect(() => {
    if (status === 'authenticated' && result && !isAnalyzing && session?.user && !(session.user as any).hasCompletedAtsOnboarding) {
      const drive = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        doneBtnText: "Done!",
        nextBtnText: "Next",
        prevBtnText: "Back",
        steps: [
          {
            element: '#ats-optimize-btn',
            popover: {
              title: 'Create Your Optimized Resume',
              description: 'Start here! Once you have reviewed the analysis, click this button to let AI rewrite and format your resume instantly.',
              side: "top",
              align: 'center',
            }
          },
          {
            element: '#ats-suggestions-section',
            popover: {
              title: 'Improvement Suggestions',
              description: 'Review these AI-generated suggestions. You can accept them to instantly boost your matching score.',
              side: "top",
              align: 'center',
            }
          },
          {
            element: '#ats-live-score-card',
            popover: {
              title: 'Live Score Impact',
              description: 'Watch your score increase in real-time as you select suggestions from the list.',
              side: "left",
              align: 'center',
            }
          },
          {
            element: '#ats-keywords-section',
            popover: {
              title: 'Keyword Analysis',
              description: 'See exactly which skills are missing from your resume compared to the job description.',
              side: "bottom",
              align: 'center',
            }
          },
          {
            element: '#ats-score-card-desktop',
            popover: {
              title: 'Match Analysis',
              description: 'This is your baseline score. Aim for at least 70% for the best chance of getting an interview.',
              side: "bottom",
              align: 'center',
            }
          },
          {
            element: '#ats-interview-card-desktop',
            popover: {
              title: 'Interview Probability',
              description: 'Your estimated chance of getting a callback. Optimization significantly increases this!',
              side: "bottom",
              align: 'center',
            }
          }
        ],
        onDestroyed: async () => {
          // Mark as complete via API
          try {
            await fetch('/api/user/complete-ats-onboarding', { method: 'POST' });
            // Refresh session to reflect the change from DB
            await update();
          } catch (err) {
            console.error("Failed to mark onboarding complete", err);
          }
        }
      });

      // Small delay to ensure elements are rendered
      setTimeout(() => {
        drive.drive();
      }, 1000);
    }
  }, [result, status, isAnalyzing, session]);

  useEffect(() => {
    if (result) {
      refreshBalance();
    }
  }, [result, refreshBalance]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-500 dark:text-orange-400";
    return "text-red-500 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Partial Match";
    return "Weak Match";
  };

  const validateFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setPdfFile(file);
      setResumeText("");
      handleFileValidation(file); // Trigger validation
      if (result) {
        clearResult();
        toast({
          title: "Resume Changed",
          description: "Previous analysis cleared. Ready for new analysis.",
        });
      } else {
        toast({
          title: "Resume Selected",
          description: `${file.name} uploaded successfully!`,
        });
      }
    }
  };


  {/* 1. Sort keywords by length (shortest first) to fill gaps better */ }
  // Use optional chaining (?.) and a fallback empty array ([])
  const sortedKeywords = result?.keywords
    ? [...result.keywords].sort((a, b) => a.length - b.length)
    : [];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setPdfFile(file);
      setResumeText("");
      handleFileValidation(file); // Trigger validation
      if (result) {
        clearResult();
        toast({
          title: "Resume Changed",
          description: "Previous analysis cleared. Ready for new analysis.",
        });
      } else {
        toast({
          title: "Resume Uploaded",
          description: `${file.name} uploaded successfully!`,
        });
      }
    }
  };

  // Calculate point values for each suggestion
  const calculateSuggestionPointValues = () => {
    if (!result || !result.rawLLMData) return {};

    const pointValues: Record<number, number> = {};
    const scoreGap = result.potentialScore - result.currentScore;

    // Group suggestions by type for proportional distribution
    const keywordSuggestions = result.suggestions
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.category === 'keyword' && !item.suggestion.toLowerCase().includes("title"));

    const titleSuggestions = result.suggestions
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.suggestion.toLowerCase().includes("title"));

    const criticalSuggestions = result.suggestions
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.category === 'other' && item.suggestion.includes("⚠️"));

    // Calculate weights (critical items get 150% weight)
    const keywordWeight = 1.0;
    const titleWeight = 1.5; // Critical: 150%
    const structuralWeight = 1.5; // Critical: 150%

    const totalWeightedItems =
      (keywordSuggestions.length * keywordWeight) +
      (titleSuggestions.length * titleWeight) +
      (criticalSuggestions.length * structuralWeight);

    if (totalWeightedItems === 0 || scoreGap === 0) return {};

    const basePointValue = scoreGap / totalWeightedItems;

    // Assign point values
    keywordSuggestions.forEach(({ idx }) => {
      pointValues[idx] = Math.max(1, Math.round(basePointValue * keywordWeight));
    });

    titleSuggestions.forEach(({ idx }) => {
      pointValues[idx] = Math.max(1, Math.round(basePointValue * titleWeight));
    });

    criticalSuggestions.forEach(({ idx }) => {
      pointValues[idx] = Math.max(1, Math.round(basePointValue * structuralWeight));
    });

    return pointValues;
  };

  const suggestionPointValues = calculateSuggestionPointValues();

  // Interactive Suggestions Handlers
  const handleToggleSuggestion = (index: number) => {
    setAppliedSuggestions(prev => {
      let newApplied = [...prev];
      const suggestion = result?.suggestions[index];

      if (newApplied.includes(index)) {
        // If it's already checked, uncheck it
        newApplied = newApplied.filter(i => i !== index);
      } else {
        // If it's not checked, add it
        newApplied.push(index);
      }

      // Calculate new score based on point values
      if (result) {
        let addedPoints = 0;
        newApplied.forEach(idx => {
          addedPoints += suggestionPointValues[idx] || 0;
        });

        const newScore = Math.min(result.potentialScore, result.currentScore + addedPoints);
        setLiveScore(newScore);

        // Update callback probability using adjustProbability to match "Current" logic
        // We assume critical missing skills are resolved (passed as []) to reflect potential improvement
        // This ensures we get the same +5 boost if structural fit is good
        const newProb = adjustProbability(
          baseCallbackProbability(newScore),
          result.structuralFit ?? false,
          []
        );
        setLiveCallback(newProb);
      }

      return newApplied;
    });
  };

  const handleResetApplied = () => {
    setAppliedSuggestions([]);
    if (result) {
      setLiveScore(result.currentScore);
      setLiveCallback(result.currentCallback);
    }
  };

  const toggleInputMode = () => {
    const newMode = inputMode === "upload" ? "paste" : "upload";
    setInputMode(newMode);

    // Clear validation state
    setIsResumeValid(false);
    setResumeValidationError(null);

    if (result) {
      clearResult();
      toast({
        title: "Input Mode Changed",
        description: "Previous analysis cleared. Ready for new analysis.",
      });
    }

    if (newMode === "upload") {
      setResumeText("");
    } else {
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === "upload" && !pdfFile) {
      toast({
        title: "Missing Resume",
        description: "Please upload your resume PDF.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === "paste" && !resumeText.trim()) {
      toast({
        title: "Missing Resume",
        description: "Please paste your resume text.",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description:
          "Please paste the job description to analyze compatibility.",
        variant: "destructive",
      });
      return;
    }

    // Validation Checks
    if (!isResumeValid) {
      toast({
        title: "Invalid Resume",
        description: resumeValidationError || "Please provide a valid resume.",
        variant: "destructive",
      });
      return;
    }

    if (!isJDValid) {
      toast({
        title: "Invalid Job Description",
        description: jdValidationError || "Please provide a valid job description.",
        variant: "destructive",
      });
      return;
    }

    // Auth Check
    if (status === "unauthenticated") {
      // Save current state before redirecting
      const fileToStore = pdfFile
        ? {
          name: pdfFile.name,
          type: pdfFile.type,
          dataUrl: await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(pdfFile);
          }),
        }
        : null;

      const resumeData = inputMode === "paste" ? resumeText : null;

      const payload = {
        resumeData,
        resumeFile: fileToStore,
        jobDescription: jobDescription.trim(),
        autoStart: false, // Don't auto-start, just restore state
        timestamp: Date.now(),
      };

      // Save JD specifically to session storage (redundancy & simple restore)
      if (isJDValid && jobDescription) {
        sessionStorage.setItem("savedJobDescription", jobDescription);
      }
      // Also save full state to localStorage (legacy/robustness)
      localStorage.setItem("pendingAnalysis", JSON.stringify(payload));

      toast({
        title: "Sign In Required",
        description: "Please sign in to analyze your resume.",
        variant: "destructive",
      });
      const isExtension = localStorage.getItem("isExtensionMode") === "true";
      if (isExtension) {
        window.location.href = "/extension-mode";
        return;
      }
      router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    const hasSufficientCredits = await checkCredits(1);
    if (!hasSufficientCredits) {
      setShowUpgradeModal(true);
      return;
    }

    if (shouldNavigateOnAnalyze) {
      const fileToStore = pdfFile
        ? {
          name: pdfFile.name,
          type: pdfFile.type,
          dataUrl: await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(pdfFile);
          }),
        }
        : null;

      const resumeData = inputMode === "paste" ? resumeText : null;

      const payload = {
        resumeData,
        resumeFile: fileToStore,
        jobDescription: jobDescription.trim(),
        autoStart: true,
        timestamp: Date.now(),
      };

      sessionStorage.setItem("pendingAnalysis", JSON.stringify(payload));
      router.push("/ats-checker");
      return;
    }

    const formData = new FormData();

    if (inputMode === "upload" && pdfFile) {
      formData.append("resume", pdfFile);
    } else if (inputMode === "paste" && resumeText.trim()) {
      const blob = new Blob([resumeText], { type: "text/plain" });
      const textFile = new File([blob], "resume.txt", { type: "text/plain" });
      formData.append("resume", textFile);
    }

    formData.append("jobDescription", jobDescription.trim());

    await startAnalysis(formData, () => {
      refreshBalance();
    });
  };

  const resetForm = () => {
    setIsCheckingPending(false);
    clearResult();
    setPdfFile(null);
    setResumeText("");
    setJobDescription("");
    setInputMode("upload");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const navigateToOptimizer = async () => {
    let extractedText = resumeText;

    if (inputMode === "upload" && pdfFile) {
      try {


        const formData = new FormData();
        formData.append("file", pdfFile);

        const response = await fetch("/api/extract-pdf-text", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          extractedText = data.text;
        } else {
          const errorData = await response.json();
          toast({
            title: "Invalid Resume",
            description: errorData.error || "Failed to extract text from PDF",
            variant: "destructive",
          });
          return; // Stop execution if validation fails
        }
      } catch (error) {
        // console.error("Error extracting PDF text:", error);
        toast({
          title: "Error",
          description: "Failed to process PDF. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Filter suggestions:
    // 1. Include items with checkboxes ONLY if they are checked (in appliedSuggestions)
    // 2. Include items without checkboxes (AI Improvements, generic warnings) ALWAYS
    const filteredSuggestions = result?.suggestions.filter((item, idx) => {
      const hasCheckbox =
        (item.category === 'keyword' && !item.suggestion.toLowerCase().includes("title")) || // Quick Win
        (item.suggestion.toLowerCase().includes("title")) || // Title
        (item.suggestion.includes("ShortlistAI")); // Structure Fix

      if (hasCheckbox) {
        return appliedSuggestions.includes(idx);
      }
      return true; // Keep AI improvements and other non-interactive suggestions
    }) || [];

    const analysisData = {
      resumeText: extractedText,
      jobDescription,
      result: {
        ...result,
        suggestions: filteredSuggestions
      },
    };

    sessionStorage.setItem("atsAnalysisData", JSON.stringify(analysisData));
    sessionStorage.setItem("shouldAutoGenerate", "true"); // ✅ Set flag for auto-start



    router.push("/resume-optimizer");
  };

  if ((isAnalyzing && !result) || isCheckingPending) {
    return <AnimatedRoundedLoader />;
  }

  return (
    <div className="container min-h-screen mx-auto py-1 md:py-8 px-3 md:px-4">
      {!result ? (
        <Card className="max-w-2xl mx-auto border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resume Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Your Resume <span className="text-pink-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleInputMode}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    {inputMode === "upload" ? (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Paste Text Instead
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-1" />
                        Upload PDF Instead
                      </>
                    )}
                  </Button>
                </div>

                {inputMode === "upload" ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${resumeValidationError
                      ? "border-red-500 bg-red-50/10"
                      : (isResumeValid && pdfFile)
                        ? "border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-950/20"
                        : "border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 bg-slate-50/50 dark:bg-slate-900/50"
                      }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <UploadIcon
                      className={`w-10 h-10 mx-auto mb-3 ${resumeValidationError
                        ? "text-red-500"
                        : pdfFile
                          ? "text-green-500"
                          : "text-purple-500 dark:text-purple-400"
                        }`}
                    />


                    <p className="text-sm font-medium mb-1 text-foreground">
                      {pdfFile
                        ? pdfFile.name
                        : "Drag & drop your resume PDF here"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {pdfFile
                        ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : "or click to browse (max 5MB)"}
                    </p>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="resume">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      >
                        <span>Choose File</span>
                      </Button>
                    </label>
                    {resumeValidationError && inputMode === "upload" && (
                      <div className={`
                        text-sm py-2 px-3 mt-2 rounded-lg border w-full flex items-center justify-center gap-2
                        ${errorState === 'warning'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                        }
                      `}>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {resumeValidationError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={resumeText}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setResumeText(newValue);
                        validateResumeContent(newValue);
                        if (
                          result &&
                          Math.abs(newValue.length - resumeText.length) >
                          10
                        ) {
                          clearResult();
                        }
                      }}
                      placeholder="Paste your complete resume text here including all sections: contact info, summary, experience, education, skills, etc..."
                      className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground/60 resize-y min-h-[200px] ${resumeValidationError
                        ? errorState === 'warning' ? "border-yellow-400 focus:ring-yellow-400" : "border-red-500"
                        : isResumeValid
                          ? "border-green-500"
                          : "border-slate-300 dark:border-slate-700"
                        }`}
                      rows={12}
                      onBlur={() => validateResumeContent(resumeText)}
                    />
                    {resumeValidationError && (
                      <div className={`
                        text-sm py-2 px-3 mt-1 rounded-lg border w-full flex items-center gap-2
                        ${errorState === 'warning'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                        }
                      `}>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {resumeValidationError}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste the complete text from your resume for best results
                    </p>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div>
                <label
                  htmlFor="jobDescription"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Job Description <span className="text-pink-500">*</span>
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setJobDescription(newValue);
                    validateJDContent(newValue);
                    if (
                      result &&
                      Math.abs(newValue.length - jobDescription.length) >
                      10
                    ) {
                      clearResult();
                    }
                  }}
                  placeholder="Paste the complete job description here including responsibilities, requirements, and qualifications..."
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground/60 resize-y min-h-[160px] ${jdValidationError
                    ? jdErrorState === 'warning' ? "border-yellow-400 focus:ring-yellow-400" : "border-red-500"
                    : "border-slate-300 dark:border-slate-700"
                    }`}
                  rows={8}
                  required
                  onBlur={() => validateJDContent(jobDescription)}
                />
                {jdValidationError && (
                  <div className={`
                    text-sm py-2 px-3 mt-1 rounded-lg border w-full flex items-center gap-2
                    ${jdErrorState === 'warning'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                      : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }
                  `}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {jdValidationError}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Include all job requirements, skills, and qualifications for
                  accurate matching
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  isAnalyzing ||
                  (inputMode === "upload" && (!pdfFile || !isResumeValid)) ||
                  (inputMode === "paste" && (!resumeText.trim() || !isResumeValid)) ||
                  !jobDescription.trim() ||
                  !isJDValid
                }
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Match...
                  </>
                ) : (
                  "Analyze My Resume "
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This analysis uses 1 credit and provides detailed compatibility
                insights
              </p>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
          {/* Validation Warning */}
          {result.validationWarning &&
            (!result.isValidCV || !result.isValidJD) && (
              <Card className="border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                        Input Validation Warning
                      </h3>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {result.validationWarning}
                      </p>
                      <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <span
                          className={
                            result.isValidCV
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {result.isValidCV
                            ? "✓ Resume Valid"
                            : "✗ Resume Invalid"}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            result.isValidJD
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {result.isValidJD
                            ? "✓ Job Description Valid"
                            : "✗ Job Description Invalid"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Low Match Score Warning */}
          {result.currentScore < 30 && (
            <Card className="border-red-400 dark:border-red-600 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 shadow-md">
              <CardContent className="p-4 md:pt-6">
                <div className="flex items-start gap-2 md:gap-3">
                  <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 md:space-y-2">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm md:text-base">
                      Not Recommended to Apply
                    </h3>
                    <p className="text-xs md:text-sm text-red-800 dark:text-red-200">
                      Your current match score is{" "}
                      <strong>{result.currentScore}%</strong>, which is below the
                      recommended threshold. This job may not align well with your
                      skills and experience. Consider:
                    </p>
                    <ul className="text-xs md:text-sm text-red-800 dark:text-red-200 list-disc list-inside space-y-0.5 md:space-y-1 ml-1 md:ml-2">
                      <li>
                        Looking for positions that better match your current skillset
                      </li>
                      <li>Acquiring the missing skills before applying</li>
                      <li>
                        Focusing on roles where you have a higher match score (60%+)
                      </li>
                    </ul>
                    <p className="text-[10px] md:text-xs text-red-700 dark:text-red-300 mt-2 md:mt-3 leading-tight">
                      💡 If you still want to apply, review the improvement suggestions
                      below to maximize your chances.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Experience Warning Alert */}
          {result.insufficentExperience && (
            <div className="mb-4 p-4 border-2 border-orange-500 dark:border-orange-600 rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    Insufficient Experience
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    This position requires <strong>{result.experienceRequired} years</strong> of full-time experience,
                    but you have <strong>{result.experienceHas} year{result.experienceHas !== 1 ? 's' : ''}</strong>.
                    Your experience score is <strong>0/20 points</strong>.
                  </p>

                </div>
              </div>
            </div>
          )}

          {/* Match Score Comparison */}
          {/* Job Match Score */}
          {/* =========================================================================
    1. DESKTOP VIEW (hidden on mobile)
    Keeps your original rich layout exactly as it was.
   ========================================================================= */}
          <div className="hidden md:block space-y-2">
            {/* Job Match Score - Desktop */}
            <Card id="ats-score-card-desktop" className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Job Match Score
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                {/* Current Match */}
                <div className="space-y-2 p-2.5 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Current
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {getScoreLabel(result.currentScore)}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(result.currentScore)}`}>
                    {result.currentScore}%
                  </div>
                  <Progress value={result.currentScore} className="h-1.5" />
                </div>

                {/* Potential Match */}
                <div className="space-y-2 p-2.5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Potential
                      </span>
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                      {getScoreLabel(result.potentialScore)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold ${getScoreColor(result.potentialScore)}`}>
                      {result.potentialScore}%
                    </span>
                    {result.potentialScore > result.currentScore && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-600 dark:bg-green-500 text-white">
                        +{result.potentialScore - result.currentScore}%
                      </span>
                    )}
                  </div>
                  <Progress value={result.potentialScore} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            {/* Interview Probability - Desktop */}
            <Card id="ats-interview-card-desktop" className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Briefcase className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Interview Probability
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-3">
                {/* Current Chances */}
                <div className="space-y-2 p-2.5 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                    Current
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${getScoreColor(result.currentCallback)}`}>
                      {result.currentCallback}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      callback
                    </span>
                  </div>
                  <Progress value={result.currentCallback} className="h-1.5" />
                </div>

                {/* After Improvements */}
                <div className="space-y-2 p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Improved
                    </span>
                    <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-bold ${getScoreColor(result.potentialCallback)}`}>
                      {result.potentialCallback}%
                    </span>
                    {result.potentialCallback > result.currentCallback && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-600 dark:bg-emerald-500 text-white">
                        +{result.potentialCallback - result.currentCallback}%
                      </span>
                    )}
                  </div>
                  <Progress value={result.potentialCallback} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* =========================================================================
    2. MOBILE VIEW (md:hidden)
    Minimal Side-by-Side Grid.
    Focuses on "Score vs Potential" in a single glance.
   ========================================================================= */}
          {/* Grid Container - Forces side-by-side layout on mobile (Straight Line) */}
          <div className="grid grid-cols-2 gap-3 w-full md:hidden">

            {/* Card 1: Job Match Score */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-3 flex flex-col gap-2 h-full justify-between">

                {/* Title Area */}
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Job Match
                  </p>
                </div>

                {/* Comparison Area */}
                <div className="flex items-center justify-between px-0.5">
                  {/* Current */}
                  <div className="flex flex-col items-center">
                    <span className={`text-lg sm:text-xl font-black ${getScoreColor(result.currentScore)}`}>
                      {result.currentScore}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase">Current</span>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="text-slate-300 flex items-center justify-center pb-3">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>

                  {/* Potential */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg sm:text-xl font-black text-green-600">
                      {result.potentialScore}%
                    </span>
                    <span className="text-[9px] text-green-600/70 font-medium uppercase">Potential</span>
                  </div>
                </div>

                {/* Progress Bar - Job Match */}
                <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-auto overflow-hidden">
                  {/* Potential (Green Ghost Bar) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-green-500 dark:bg-green-900/40"
                    style={{ width: `${result.potentialScore}%` }}
                  />
                  {/* Current (Solid Bar) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-slate-500 dark:bg-slate-400"
                    style={{ width: `${result.currentScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Interview Chance */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-3 flex flex-col gap-2 h-full justify-between">

                {/* Title Area */}
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Target className="h-3 w-3 text-slate-400 shrink-0" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Callback
                  </p>
                </div>

                {/* Comparison Area */}
                <div className="flex items-center justify-between px-0.5">
                  {/* Current */}
                  <div className="flex flex-col items-center">
                    <span className={`text-lg sm:text-xl font-black ${getScoreColor(result.currentCallback)}`}>
                      {result.currentCallback}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase">Current</span>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="text-slate-300 flex items-center justify-center pb-3">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>

                  {/* Potential */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg sm:text-xl font-black text-green-600">
                      {result.potentialCallback}%
                    </span>
                    <span className="text-[9px] text-green-600/70 font-medium uppercase">Potential</span>
                  </div>
                </div>

                {/* Progress Bar - Callback (Fixed Colors & Widths) */}
                <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-auto overflow-hidden">
                  {/* Potential (Green Ghost Bar) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-green-500 dark:bg-green-900/40"
                    style={{ width: `${result.potentialCallback}%` }}
                  />
                  {/* Current (Solid Bar) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-slate-500 dark:bg-slate-400"
                    style={{ width: `${result.currentCallback}%` }}
                  />
                </div>
              </CardContent>
            </Card>

          </div>





          {/* Keywords Section */}
          {/* =========================================================================
    1. DESKTOP VIEW (hidden md:grid)
    Keeps your original 3-column layout for larger screens.
   ========================================================================= */}
          <div id="ats-keywords-section" className="hidden md:grid md:grid-cols-3 gap-4">
            {/* Top Required Keywords - Desktop */}
            {result.topRequiredKeywords && result.topRequiredKeywords.length > 0 && (
              <Card className="border border-blue-300/60 dark:border-blue-700/60 shadow-lg bg-gradient-to-br from-blue-50/90 via-blue-100/50 to-indigo-50/70 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-indigo-950/40 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3 pt-4 border-b border-blue-200/40 dark:border-blue-800/40">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-950 dark:text-blue-50">
                    <Target className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                    Top Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {result.topRequiredKeywords.slice(0, 10).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 text-xs font-semibold rounded-lg border border-blue-300/70 dark:border-blue-700/70 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matched Keywords - Desktop */}
            <Card className="border border-green-300/60 dark:border-green-700/60 shadow-lg bg-gradient-to-br from-green-50/90 via-emerald-100/50 to-teal-50/70 dark:from-green-950/50 dark:via-emerald-900/30 dark:to-teal-950/40 backdrop-blur-sm transition-all duration-300">
              <CardHeader className="py-3 px-4 border-b border-green-200/40 dark:border-green-800/40">
                <CardTitle className="flex items-center gap-2 pt-2 text-sm font-semibold text-green-950 dark:text-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Matched Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {sortedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 items-center justify-start">
                    {sortedKeywords.slice(0, 10).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100/80 dark:bg-green-900/40 text-green-900 dark:text-green-100 text-[11px] font-medium rounded-md border border-green-300/50 dark:border-green-700/50 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic py-1">No keywords</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Keywords - Desktop */}
            {result.missingKeywords && result.missingKeywords.length > 0 && (
              <Card className="border border-amber-300/60 dark:border-amber-700/60 shadow-lg bg-gradient-to-br from-amber-50/90 via-orange-100/50 to-yellow-50/70 dark:from-amber-950/50 dark:via-orange-900/30 dark:to-yellow-950/40 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3 pt-4 border-b border-amber-200/40 dark:border-amber-800/40">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-50">
                    <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                    Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.slice(0, 10).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 text-xs font-semibold rounded-lg border border-amber-300/70 dark:border-amber-700/70 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* =========================================================================
    2. MOBILE VIEW (md:hidden)
    Uses Tabs to save vertical space.
   ========================================================================= */}
          <div className="md:hidden mb-6">
            <Tabs defaultValue="missing" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800  rounded-lg">
                <TabsTrigger
                  value="missing"
                  className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm"
                >
                  Missing
                </TabsTrigger>
                <TabsTrigger
                  value="matched"
                  className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm"
                >
                  Matched
                </TabsTrigger>
                <TabsTrigger
                  value="required"
                  className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Top Skills
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Missing Keywords */}
              <TabsContent value="missing" className="mt-2">
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4">
                    {result.missingKeywords && result.missingKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.slice(0, 15).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 text-xs font-medium rounded border border-amber-200 dark:border-amber-800 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">No missing keywords!</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Matched Keywords */}
              <TabsContent value="matched" className="mt-2">
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    {sortedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sortedKeywords.slice(0, 15).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white dark:bg-slate-900 text-green-700 dark:text-green-300 text-xs font-medium rounded border border-green-200 dark:border-green-800 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">No matched keywords yet.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Top Required */}
              <TabsContent value="required" className="mt-2">
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-4">
                    {result.topRequiredKeywords && result.topRequiredKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.topRequiredKeywords.slice(0, 15).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-200 dark:border-blue-800 shadow-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">No specific top skills identified.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          {/* Interactive Score Preview - Shows score if suggestions are applied */}

          {/* --- COMPACT DASHBOARD SECTION (Replaces previous top section) --- */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">

              {/* COLUMN 1: COMPACT SCORE CARD (Takes up 4/12 columns) */}
              <div className="md:col-span-4" id="ats-live-score-card">
                <Card className="h-full border-green-300/60 dark:border-green-700/60 shadow-md bg-gradient-to-br from-green-50/90 via-emerald-100/50 to-teal-50/70 dark:from-green-950/50 backdrop-blur-sm">

                  <CardHeader className="pb-2 pt-3 px-3 md:pt-4 md:px-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-bold text-green-950 dark:text-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Live Score
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-3 pb-3 md:px-4 md:pb-4">
                    {/* LAYOUT STRATEGY: 
         Mobile: 'grid grid-cols-2' (Side-by-side)
         Desktop: 'md:flex md:flex-col' (Vertical stack - Original)
      */}
                    <div className="grid grid-cols-2 gap-2 md:flex md:flex-col md:justify-between md:h-full md:gap-4">

                      {/* --- SECTION 1: BIG SCORE DISPLAY --- */}
                      <div className="text-center py-2 bg-white/50 dark:bg-black/20 rounded-lg border border-green-100/50 flex flex-col justify-center">
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase">Current</span>

                        {/* Mobile: 2xl, Desktop: 3xl (Original) */}
                        <div className="text-2xl md:text-3xl font-black text-foreground">
                          {result.currentScore}%
                        </div>

                        {appliedSuggestions.length > 0 && (
                          <>
                            <div className="text-green-600 dark:text-green-400 font-bold text-xs md:text-sm flex justify-center items-center mt-1">
                              <ArrowUp className="h-3 w-3 mr-1" />
                              {liveScore}% <span className="hidden md:inline ml-1">Potential</span>
                            </div>
                            <Progress value={liveScore} className="h-1 md:h-1.5 mt-1 md:mt-2 w-3/4 mx-auto" />
                          </>
                        )}
                      </div>

                      {/* --- SECTION 2: STATS GRID --- */}
                      {/* Mobile: 'grid-cols-1' (Stacked vertically in the right column) 
           Desktop: 'md:grid-cols-2' (Side-by-side - Original)
        */}
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-xs">

                        {/* Stat 1: Applied */}
                        <div className="bg-white/40 dark:bg-black/20 p-1.5 md:p-2 rounded border border-green-100/50 text-center flex flex-col justify-center">
                          <span className="text-muted-foreground block text-[10px] md:text-xs">Applied</span>
                          <span className="font-bold text-green-700 dark:text-green-400 text-lg">
                            {appliedSuggestions.length}
                            <span className="text-gray-400 text-xs font-normal">
                              /{result.suggestions.filter(s => s.category === 'keyword' && !s.suggestion.toLowerCase().includes("title")).length + result.suggestions.filter(s => (s.category === 'other' && s.suggestion.includes("⚠️")) || s.suggestion.toLowerCase().includes("title")).length}
                            </span>
                          </span>
                        </div>

                        {/* Stat 2: Interview */}
                        <div className="bg-white/40 dark:bg-black/20 p-1.5 md:p-2 rounded border border-green-100/50 text-center flex flex-col justify-center">
                          <span className="text-muted-foreground block text-[10px] md:text-xs">Interview</span>
                          <span className="font-bold text-blue-700 dark:text-blue-400 text-lg">
                            {appliedSuggestions.length > 0 ? liveCallback : result.currentCallback}%
                          </span>
                        </div>
                      </div>

                      {/* --- SECTION 3: RESET BUTTON --- */}
                      {appliedSuggestions.length > 0 && (
                        <div className="col-span-2 md:col-span-1">
                          <Button onClick={handleResetApplied} variant="outline" size="sm" className="w-full text-xs h-7 bg-blue-600 text-white">
                            Reset
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>


              {/* COLUMN 2: TABBED ACTION CENTER (Takes up 8/12 columns) */}
              <div className="md:col-span-8">
                <Tabs defaultValue="quick-wins" className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="h-8 bg-slate-100 dark:bg-slate-800 p-0.5">
                      <TabsTrigger value="quick-wins" className="text-xs h-7 px-3 data-[state=active]:bg-blue-600-[state=active]:shadow-sm">
                        Quick Wins ({result.suggestions.filter(s => s.category === 'keyword' && !s.suggestion.toLowerCase().includes("title")).length})
                      </TabsTrigger>
                      <TabsTrigger value="critical" className="text-xs h-7 px-3 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                        Critical ({result.suggestions.filter(s => (s.category === 'other' && s.suggestion.includes("⚠️")) || s.suggestion.toLowerCase().includes("title")).length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB 1: QUICK WINS (Keywords) */}
                  <TabsContent value="quick-wins" className="mt-0 h-full">
                    <Card className="h-full border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
                      <CardContent className="p-0">
                        {/* Scrollable List Area */}
                        <div className="max-h-[220px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                          {result.suggestions.some(s => s.category === 'keyword' && !s.suggestion.toLowerCase().includes("title")) ? (
                            result.suggestions.map((item, idx) => ({ item, idx }))
                              .filter(({ item }) => item.category === 'keyword' && !item.suggestion.toLowerCase().includes("title"))
                              .map(({ item, idx }) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded border border-green-100 dark:border-green-800/50 hover:shadow-sm transition-all group">
                                  <input
                                    type="checkbox"
                                    checked={appliedSuggestions.includes(idx)}
                                    onChange={() => handleToggleSuggestion(idx)}
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                  />
                                  <div className="flex-1 flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground group-hover:text-green-700">{item.suggestion}</span>

                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-8 text-sm text-gray-500">No missing keywords found! 🎉</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 2: CRITICAL ACTIONS */}
                  <TabsContent value="critical" className="mt-0 h-full">
                    <Card className="h-full border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10">
                      <CardContent className="p-0">
                        {/* Scrollable List Area */}
                        <div className="max-h-[220px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                          {/* Title Check */}
                          {result.suggestions.map((item, idx) => ({ item, idx }))
                            .filter(({ item }) => item.suggestion.toLowerCase().includes("title"))
                            .map(({ item, idx }) => (
                              <div key={idx} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded border-l-4 border-l-orange-500 border-y border-r border-gray-100 shadow-sm">
                                <input
                                  type="checkbox"
                                  checked={appliedSuggestions.includes(idx)}
                                  onChange={() => handleToggleSuggestion(idx)}
                                  className="h-4 w-4 rounded border-gray-300 text-orange-600 cursor-pointer"
                                />
                                <div className="flex-1 flex justify-between items-center">
                                  <p className="text-sm font-semibold text-foreground">{item.suggestion}</p>
                                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">+{suggestionPointValues[idx] || 0} pts</span>
                                </div>

                              </div>
                            ))}

                          {/* Other Warnings */}
                          {result.suggestions.map((item, idx) => ({ item, idx }))
                            .filter(({ item }) => item.category === 'other' && item.suggestion.includes("⚠️"))
                            .map(({ item, idx }) => (
                              <div key={idx} className="flex items-start gap-3 p-2 bg-white dark:bg-slate-900 rounded border border-red-100">
                                {item.suggestion.includes("ShortlistAI") ? (
                                  <input type="checkbox" checked={appliedSuggestions.includes(idx)} onChange={() => handleToggleSuggestion(idx)} className="mt-1 h-4 w-4 text-red-600 rounded" />
                                ) : (<AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />)}

                                <div className="flex-1">
                                  <p className="text-sm text-foreground leading-tight">{item.suggestion}</p>

                                </div>
                              </div>
                            ))}

                          {!result.suggestions.some(s => s.category === 'other' && s.suggestion.includes("⚠️")) && !result.suggestions.some(s => s.suggestion.toLowerCase().includes("title")) && (
                            <div className="text-center py-8 text-sm text-muted-foreground">No critical errors found! ✅</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}


          {/* --- 3. AI Improvements (Original Layout - Kept at Bottom) --- */}


          {/* --- NEW IMPROVEMENT SUGGESTIONS SECTION --- */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card id="ats-suggestions-section" className="border-purple-200 dark:border-purple-800 shadow-lg mt-6 mb-8 bg-white dark:bg-slate-900">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                  <Sparkles {...({ className: "h-5 w-5 text-purple-600 dark:text-purple-400" } as any)} />
                  Improvement Suggestions
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive recommendations categorized by type. Click each to see before/after text.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="all" className="w-full">
                  <div className="w-full overflow-x-auto scrollbar-thin-fade pb-1.5 md:pb-0 mb-2 md:mb-0">
                    <TabsList className="flex flex-nowrap w-max justify-start md:grid md:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl h-auto items-center">
                      <TabsTrigger value="text" className="shrink-0 rounded-lg whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        Text {!isPro && <Lock {...({ className: "h-3 w-3 ml-1 opacity-60" } as any)} />} {isPro && `(${result.suggestions.filter((s: any) => s.category === 'text').length})`}
                      </TabsTrigger>
                      <TabsTrigger value="keyword" className="shrink-0 rounded-lg whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        Keywords {!isPro && <Lock {...({ className: "h-3 w-3 ml-1 opacity-60" } as any)} />} {isPro && `(${result.suggestions.filter((s: any) => s.category === 'keyword').length})`}
                      </TabsTrigger>
                      <TabsTrigger value="other" className="shrink-0 rounded-lg whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                        Structural {!isPro && <Lock {...({ className: "h-3 w-3 ml-1 opacity-60" } as any)} />} {isPro && `(${result.suggestions.filter((s: any) => s.category === 'other').length})`}
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        className="shrink-0 rounded-lg whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                      >
                        All {isPro && `(${result.suggestions.length})`}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* All Suggestions Tab */}
                  <TabsContent value="all" className="mt-4">
                    {/* MOBILE OPTIMIZATION: Max Height + Scroll for mobile, auto height for desktop */}
                    <div className="max-h-[320px] overflow-y-auto md:max-h-none md:overflow-visible pr-1 custom-scrollbar">
                      <Accordion type="single" collapsible className="w-full">
                        {(isPro ? result.suggestions : result.suggestions.slice(0, 3)).map((item: any, idx: number) => (
                          <SuggestionItem key={idx} item={item} idx={idx} copyToClipboard={copyToClipboard} />
                        ))}
                      </Accordion>
                    </div>
                    {!isPro && result.suggestions.length > 3 && (
                      <UpgradeOverlay count={result.suggestions.length - 3} setShowUpgradeModal={setShowUpgradeModal} />
                    )}
                  </TabsContent>

                  {/* Dynamic Tabs for Text, Keyword, Other */}
                  {['text', 'keyword', 'other'].map((type) => {
                    const suggestions = (result as any)[`${type}Suggestions`] || [];
                    const hasSuggestions = suggestions.length > 0;
                    const displayCount = 1;

                    return (
                      <TabsContent key={type} value={type} className="mt-4">
                        {!isPro ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <div className={`p-3 rounded-full mb-4 ${type === 'text' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                              type === 'keyword' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                                'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
                              }`}>
                              <Lock {...({ className: "h-6 w-6" } as any)} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {type === 'other' ? 'Structural' : type.charAt(0).toUpperCase() + type.slice(1)} Suggestions Locked
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6">
                              Upgrade to Pro to access specific improvement suggestions separated by category.
                            </p>
                            <Button onClick={() => setShowUpgradeModal(true)} className={`${type === 'text' ? 'bg-blue-600 hover:bg-blue-700' :
                              type === 'keyword' ? 'bg-purple-600 hover:bg-purple-700' :
                                'bg-pink-600 hover:bg-pink-700'
                              } text-white`}>
                              Unlock {type === 'other' ? 'Structural' : type.charAt(0).toUpperCase() + type.slice(1)} Suggestions
                            </Button>
                          </div>
                        ) : (
                          hasSuggestions ? (
                            <>
                              {/* MOBILE OPTIMIZATION: Max Height + Scroll for mobile, auto height for desktop */}
                              <div className="max-h-[320px] overflow-y-auto md:max-h-none md:overflow-visible pr-1 custom-scrollbar">
                                <Accordion type="single" collapsible className="w-full">
                                  {(isPro ? suggestions : suggestions.slice(0, displayCount)).map((item: any, idx: number) => (
                                    <SuggestionItem key={idx} item={item} idx={idx} copyToClipboard={copyToClipboard} />
                                  ))}
                                </Accordion>
                              </div>
                              {!isPro && suggestions.length > displayCount && (
                                <UpgradeOverlay count={suggestions.length - displayCount} setShowUpgradeModal={setShowUpgradeModal} />
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                              No {type} improvement suggestions available.
                            </p>
                          )
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          )}
          {/* --- END NEW IMPROVEMENT SUGGESTIONS SECTION --- */}



          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              id="ats-optimize-btn"
              onClick={() => setShowOptimizerConfirm(true)} // ✅ Opens dialog instead of navigating immediately
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Optimized Resume
            </Button>

            <Button
              onClick={resetForm}
              variant="outline"
              className="w-full border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Analyze Another Job
            </Button>
          </div>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            💡 Generate an AI-optimized resume that incorporates all suggestions
            to maximize your ATS score
          </p>

          {/* SEO Cross-Links to Resume Templates */}
          <ResumeTemplatesPromo />
        </div >
      )}

      {/* Dialogs */}

      {/* ✅ New Optimization Confirmation Dialog */}
      <AlertDialog open={showOptimizerConfirm} onOpenChange={setShowOptimizerConfirm}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Generate Optimized Resume
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">

                <div className="space-y-3 text-sm">
                  <div className="font-semibold text-base text-foreground">
                    What happens next:
                  </div>
                  {result && (
                    <Card className="border-2 border-violet-100 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                              {result.currentScore}%
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Current
                            </div>
                          </div>

                          <div className="flex flex-col items-center px-3">
                            <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-md mb-1">
                              <ArrowLeft className="h-3 w-3 text-white rotate-180" />
                            </div>
                            <div className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-sm">
                              <span className="text-xs font-bold text-white">
                                +{result.potentialScore - result.currentScore}%
                              </span>
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {result.potentialScore}%
                            </div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Optimized
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-3 p-2 rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/50">
                      <CheckCircle className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                      <span className="font-medium">AI applies all improvements</span>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/50">
                      <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <span className="font-medium">Keywords integrated naturally</span>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <span className="font-medium">ATS-optimized formatting</span>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span className="font-medium">Professional resume templates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 font-medium shadow-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={navigateToOptimizer}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InsufficientCreditsModal
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
        onUpgrade={() => {
          setShowInsufficientModal(false);
          setShowUpgradeModal(true);
        }}
        requiredCredits={1}
        title={!isPro ? "Limit Reached" : "Credits Exhausted"}
        description={!isPro ? "You have reached the limit of your current plan. Upgrade to unlock unlimited analyses." : "You have used all your available credits. Purchase more to continue."}
        actionLabel={!isPro ? "Upgrade to Pro" : "Buy Credits"}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onSuccess={() => {
          refreshBalance();
          toast({
            title: "Credits Added!",
            description: "You can now analyze job compatibility.",
          });
        }}
      />
    </div >
  );
}
