"use client";

import { useState, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import ResumeOptimizationLoader from "./ResumeOptimizationLoader";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, FileText, Download, Eye, ArrowLeft, CheckCircle, Copy, EyeOff, Zap, Lock, ChevronLeft, ChevronRight, Edit, MoveUp, MoveDown, LayoutTemplate } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useUserStatus } from "@/hooks/useUserStatus";
import InsufficientCreditsModal from "@/components/credits/InsufficientCreditsModal";
import UpgradeModal from "@/components/credits/UpgradeModal";
import { WatermarkOverlay } from "@/components/resume/WatermarkOverlay";
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

// Import resume templates
import { ModernTemplate } from "@/components/resume/templates/Modern";
import { ProfessionalTemplate } from "@/components/resume/templates/Professional";
import { CreativeTemplate } from "@/components/resume/templates/CreativeTemplate";
import { MinimalTemplate } from "@/components/resume/templates/Minimal";
import { ResumeData } from "@/components/resume/templates/types";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeRenderer } from "@/components/resume/ResumeRenderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TEMPLATES = {
  modern: ModernTemplate,

  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES | 'latex';

const DEFAULT_SECTION_ORDER = [
  'objective',
  'workExperience',
  'projects',
  'education',
  'skills',
  'certifications',
  'languages',
  'customSections',
];

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Calibri', label: 'Calibri' },
];

export default function ResumeOptimizerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState<ResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("modern");
  const [showPreview, setShowPreview] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false);
  const [latexCode, setLatexCode] = useState<string | null>(null);
  const [showLatexPreview, setShowLatexPreview] = useState(false);
  const [showOptimizationLoader, setShowOptimizationLoader] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTemplatesCaching, setIsTemplatesCaching] = useState(false);
  // Track specific background PDF generation
  const [isBackgroundPdfLoading, setIsBackgroundPdfLoading] = useState(false);

  // Theme & Layout States
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [tempSectionOrder, setTempSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [showIcons, setShowIcons] = useState(true);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isMobileTemplateOpen, setIsMobileTemplateOpen] = useState(false);

  // New state for inline editing and PDF preview
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // PDF Mirror States
  const [showPdfMirror, setShowPdfMirror] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const { balance, checkCredits, refreshBalance } = useCredits();
  const { isPro, loading: userStatusLoading } = useUserStatus();

  // Pagination State
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const canGoPrev = currentPage > 1 && !isEditing;
  const canGoNext = currentPage < pageCount && !isEditing;

  const handlePrevious = () => {
    if (!canGoPrev) return;
    setCurrentPage((prev: number) => prev - 1);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setCurrentPage((prev: number) => prev + 1);
  };

  const updateField = <T extends keyof ResumeData>(
    section: T,
    index: number | null,
    field: string,
    value: string
  ) => {
    setOptimizedResume((prev: ResumeData | null) => {
      if (!prev) return null;
      if (index === null) {
        if (section === 'personalDetails') {
          return {
            ...prev,
            personalDetails: { ...prev.personalDetails, [field]: value },
          };
        }
        if (section === 'objective') return { ...prev, objective: value };
        if (section === 'jobTitle') return { ...prev, jobTitle: value };
        return prev;
      }
      const sectionArray = [...(prev[section] as any[])];
      sectionArray[index] = { ...sectionArray[index], [field]: value };
      return { ...prev, [section]: sectionArray };
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const newOrder = Array.from(tempSectionOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);
    setTempSectionOrder(newOrder);
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...tempSectionOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setTempSectionOrder(newOrder);
  };

  const moveSectionDown = (index: number) => {
    if (index === tempSectionOrder.length - 1) return;
    const newOrder = [...tempSectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setTempSectionOrder(newOrder);
  };

  const saveSectionOrder = () => {
    setSectionOrder(tempSectionOrder);
    setIsReorderModalOpen(false);
  };

  const debouncedSetAccentColor = useMemo(
    () => debounce((color: string) => setAccentColor(color), 100),
    []
  );

  const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetAccentColor(e.target.value);
  };

  // State Persistence: Load from sessionStorage on mount
  useEffect(() => {
    const forceNew = sessionStorage.getItem('forceNewAnalysis');
    if (forceNew === 'true') {
      sessionStorage.removeItem('forceNewAnalysis');
      sessionStorage.removeItem('optimizedResumeSession');
      // Still need analysisData for a fresh start if redirected from ATS checker
      const storedData = sessionStorage.getItem('atsAnalysisData');
      if (storedData) {
        try {
          setAnalysisData(JSON.parse(storedData));
        } catch (e) { }
      }
      return;
    }

    const savedSession = sessionStorage.getItem('optimizedResumeSession');
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession);
        if (data.optimizedResume) setOptimizedResume(data.optimizedResume);
        if (data.selectedTemplate) setSelectedTemplate(data.selectedTemplate);
        if (data.showPreview) setShowPreview(data.showPreview);
        if (data.analysisData) setAnalysisData(data.analysisData);
        if (data.latexCode) setLatexCode(data.latexCode);
        if (data.showLatexPreview) setShowLatexPreview(data.showLatexPreview);
        if (data.resumeId) setResumeId(data.resumeId);
        if (data.accentColor) setAccentColor(data.accentColor);
        if (data.fontFamily) setFontFamily(data.fontFamily);
        if (data.sectionOrder) {
          setSectionOrder(data.sectionOrder);
          setTempSectionOrder(data.sectionOrder);
        }
        if (typeof data.showIcons === 'boolean') setShowIcons(data.showIcons);
      } catch (error) {
        console.error("Error loading optimizedResumeSession:", error);
      }
    } else {
      // Fallback to basic analysis data if no session exists
      const storedData = sessionStorage.getItem('atsAnalysisData');
      if (storedData) {
        try {
          setAnalysisData(JSON.parse(storedData));
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load analysis data. Please run ATS analysis again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Analysis Data",
          description: "Please run an ATS analysis first.",
          variant: "destructive",
        });
      }
    }
  }, []);

  // State Persistence: Save to sessionStorage on change
  useEffect(() => {
    if (optimizedResume || analysisData) {
      const sessionData = {
        optimizedResume,
        selectedTemplate,
        showPreview,
        analysisData,
        latexCode,
        showLatexPreview,
        resumeId,
        accentColor,
        fontFamily,
        sectionOrder,
        showIcons
      };
      sessionStorage.setItem('optimizedResumeSession', JSON.stringify(sessionData));
    }
  }, [optimizedResume, selectedTemplate, showPreview, analysisData, latexCode, showLatexPreview, resumeId, accentColor, fontFamily, sectionOrder, showIcons]);

  const handleRefreshPdfMirror = async () => {
    if (!optimizedResume || !showPdfMirror) return;

    setIsPdfLoading(true);
    try {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }

      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: optimizedResume,
          template: selectedTemplate !== 'latex' ? selectedTemplate : 'modern',
          accentColor: (optimizedResume as any).accentColor || '#3b82f6',
          fontFamily: (optimizedResume as any).fontFamily || 'Inter',
          sectionOrder: (optimizedResume as any).sectionOrder || [],
          showIcons: (optimizedResume as any).showIcons ?? true,
          watermark: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF mirror');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error refreshing PDF mirror:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh PDF mirror',
        variant: 'destructive',
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const debouncedRefreshMirror = useMemo(
    () => debounce(handleRefreshPdfMirror, 1000),
    [optimizedResume, selectedTemplate, showPdfMirror]
  );

  useEffect(() => {
    if (showPdfMirror) {
      debouncedRefreshMirror();
    }
    return () => debouncedRefreshMirror.cancel();
  }, [optimizedResume, selectedTemplate, showPdfMirror]);



  // Onboarding Tour
  useEffect(() => {
    console.log('🚀 Checking Onboarding Tour Conditions:', {
      status,
      hasOptimizedResume: !!optimizedResume,
      isGenerating,
      hasUser: !!session?.user,
      hasCompleted: (session?.user as any)?.hasCompletedOptimizedResumeOnboarding
    });

    if (status === 'authenticated' && optimizedResume && !isGenerating && session?.user && !(session.user as any).hasCompletedOptimizedResumeOnboarding) {
      console.log('✅ Conditions met! Starting tour...');

      // Ensure we are in "Preview" mode for the tour
      if (!showPreview && !isEditing) {
        setShowPreview(true);
      }

      const drive = driver({
        showProgress: true,
        animate: true,
        allowClose: false,
        doneBtnText: "Done!",
        nextBtnText: "Next",
        prevBtnText: "Back",
        steps: [
          {
            element: '#resume-preview-panel',
            popover: {
              title: 'Your Optimized Resume',
              description: 'This is the AI-generated version of your resume, tailored specifically for the job.',
              side: "left",
              align: "center",
            }
          },
          {
            element: '#template-selection-card',
            popover: {
              title: 'Choose a Template',
              description: 'Select from our range of ATS-friendly templates. Click to switch instantly.',
              side: "right",
              align: 'center',
            }
          },
          {
            element: '#download-pdf-btn',
            popover: {
              title: 'Download Your Resume',
              description: 'Once you are happy with the result, click here to download the PDF.',
              side: "bottom",
              align: 'center',
            }
          },
          {
            element: '#edit-resume-btn',
            popover: {
              title: 'Edit Content',
              description: 'Need to make tweaks? Click Edit to modify text, rearrange sections, or customize fonts and colors.',
              side: "bottom",
              align: 'center',
            }
          }
        ],
        onDestroyed: async () => {
          // Mark as complete via API
          try {
            await fetch('/api/user/complete-optimized-resume-onboarding', { method: 'POST' });
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
      }, 1500);
    }
  }, [optimizedResume, status, isGenerating, session]);

  const handleSave = async () => {
    if (!optimizedResume || !session?.user?.email) return;

    try {
      setIsSaving(true);
      const user = session.user as any;
      const resumePayload = {
        ...optimizedResume,
        accentColor,
        fontFamily,
        sectionOrder,
        showIcons
      };

      if (resumeId) {
        // Update existing resume
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resumePayload),
        });

        if (!response.ok) throw new Error('Failed to update resume');
      } else {
        // Create new resume
        const response = await fetch('/api/resumes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id || user.email,
            userEmail: user.email,
            resumeData: resumePayload,
          }),
        });

        if (!response.ok) throw new Error('Failed to create resume');

        const data = await response.json();
        setResumeId(data.resumeId);
      }

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Resume saved successfully!",
      });

      // Refresh profile resumes list if needed (optional, but good practice)
    } catch (error) {
      // console.error("Error saving resume:", error);
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const preCacheTemplates = async (data: ResumeData) => {
    const templates: (keyof typeof TEMPLATES)[] = ['modern', 'professional', 'creative', 'minimal'];
    console.log('🚀 Pre-caching all templates for instant switch...');

    // Return the promise so we can wait for it if needed
    return Promise.all(templates.map(tpl =>
      fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          template: tpl,
          accentColor: data.accentColor || '#3b82f6',
          fontFamily: data.fontFamily || 'Inter',
          sectionOrder: data.sectionOrder || [],
          showIcons: data.showIcons ?? true,
          isPaidUser: isPro,
          watermark: false,
        }),
      }).catch(err => console.error(`Failed to pre-cache ${tpl}:`, err))
    ));
  };

  const generateOptimizedResumeLatex = async () => {
    if (!analysisData) {
      toast({
        title: "Missing Data",
        description: "Analysis data not found. Please run ATS analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLatex(true);

    try {
      // Handle both data structures
      const result = analysisData.result || analysisData;
      const suggestions = result.suggestions || [];
      const missingKeywords = result.missingKeywords || [];

      toast({
        title: "Generating LaTeX Code...",
        description: "Converting to LaTeX and applying improvements. This may take 20-30 seconds.",
      });

      const response = await fetch("/api/optimize-resume-latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: analysisData.resumeText,
          suggestions: suggestions,
          missingKeywords: missingKeywords,
          action: "preview",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate LaTeX code");
      }

      const data = await response.json();
      setLatexCode(data.latexCode);
      setShowLatexPreview(true);

      toast({
        title: "LaTeX Code Generated! 📄",
        description: "Review the code below. You can copy it or download the .tex file.",
      });
    } catch (error) {
      // console.error("Error generating LaTeX code:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate LaTeX code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLatex(false);
    }
  };

  const copyLatexToClipboard = async () => {
    if (!latexCode) return;

    try {
      await navigator.clipboard.writeText(latexCode);
      toast({
        title: "Copied to Clipboard! 📋",
        description: "LaTeX code has been copied. You can paste it into Overleaf or any LaTeX editor.",
      });
    } catch (error) {
      // console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const downloadLatexCodeOnly = async () => {
    try {
      // Handle both data structures
      const result = analysisData.result || analysisData;
      const suggestions = result.suggestions || [];
      const missingKeywords = result.missingKeywords || [];

      toast({
        title: "Generating LaTeX Code...",
        description: "Creating optimized LaTeX code for your resume.",
      });

      const response = await fetch("/api/optimize-resume-latex-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: analysisData.resumeText,
          suggestions: suggestions,
          missingKeywords: missingKeywords,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate LaTeX code");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'optimized-resume.tex';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast({
        title: "LaTeX Code Downloaded! 📄",
        description: "You can compile this .tex file using Overleaf (overleaf.com) or any LaTeX editor.",
      });
    } catch (error) {
      // console.error("Error downloading LaTeX code:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate LaTeX code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateClick = async () => {
    if (!analysisData) {
      toast({
        title: "Missing Data",
        description: "Analysis data not found. Please run ATS analysis first.",
        variant: "destructive",
      });
      return;
    }

    // Auth Check
    if (status === "unauthenticated") {
      toast({
        title: "Sign In Required",
        description: "Please sign in to optimize your resume.",
        variant: "destructive",
      });
      router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }


    setShowConfirmModal(true);
  };

  const generateOptimizedResume = async () => {
    setShowConfirmModal(false);
    setShowOptimizationLoader(true);
    setIsGenerating(true);

    try {
      // Handle both data structures: from ATS checker (with result object) and from analysis history (direct fields)
      const result = analysisData.result || analysisData;
      const suggestions = result.suggestions || [];
      const missingKeywords = result.missingKeywords || [];
      const analysisId = analysisData.analysisId || result.analysisId;

      // If we have neither analysisId nor enough inline data, block with a clear message
      if (!analysisId && (!analysisData.resumeText || !analysisData.jobDescription || suggestions.length === 0)) {
        throw new Error("Missing analysis reference. Please run an ATS analysis first.");
      }

      const response = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisId,
          // These are optional now; backend will fall back to AnalysisResult when missing
          resumeText: analysisData.resumeText,
          jobDescription: analysisData.jobDescription,
          suggestions,
          missingKeywords,
          currentScore: result.currentScore,
          potentialScore: result.potentialScore,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to generate your resume.",
            variant: "destructive",
          });
          // Redirect to login preserving current URL so they come back here
          // Use window.location.href to handle extension iframe context better
          window.open(`https://shortlistai.cv/signin?callbackUrl=${encodeURIComponent(window.location.href)}`, "_blank");
          return;
        }

        if (response.status === 402) {
          setShowInsufficientModal(true);
          throw new Error(error.message || "Insufficient credits");
        }

        throw new Error(error.error || "Failed to generate optimized resume");
      }

      const data = await response.json();

      await refreshBalance();

      const resumeData: ResumeData = {
        personalDetails: data.personalDetails,
        objective: data.objective || "",
        jobTitle: data.jobTitle || "",
        workExperience: data.workExperience || [],
        education: data.education || [],
        skills: data.skills || [],
        projects: data.projects || [],
        languages: data.languages || [],
        certifications: data.certifications || [],
        customSections: data.customSections || [],
        accentColor: "#3b82f6",
        fontFamily: "Inter",
        sectionOrder: DEFAULT_SECTION_ORDER,
        showIcons: true,
      };

      setOptimizedResume(resumeData);
      setAccentColor("#3b82f6");
      setFontFamily("Inter");
      setSectionOrder(DEFAULT_SECTION_ORDER);
      setTempSectionOrder(DEFAULT_SECTION_ORDER);
      setShowIcons(true);

      // ✅ Non-Blocking Pre-caching: Fire and forget
      // We show the UI immediately and let PDF generation happen in background
      setShowPreview(true);
      setIsBackgroundPdfLoading(true);

      preCacheTemplates(resumeData)
        .then(() => {
          console.log("Background PDF generation complete");
        })
        .catch((err) => {
          console.error("Background PDF generation failed", err);
        })
        .finally(() => {
          setIsBackgroundPdfLoading(false);
          setIsTemplatesCaching(false);
        });


    } catch (error) {
      // console.error("Error generating optimized resume:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate optimized resume",
        variant: "destructive",
      });
    } finally {
      // Show immediately without delay
      setShowOptimizationLoader(false);
      setIsGenerating(false);
    }
  };

  // ✅ Auto-trigger generation if flag is detected
  useEffect(() => {
    const shouldAuto = sessionStorage.getItem('shouldAutoGenerate');

    // Only run if we have the flag, data is loaded, and we aren't already working
    if (shouldAuto === 'true' && analysisData && !isGenerating && !optimizedResume) {
      sessionStorage.removeItem('shouldAutoGenerate'); // Clear flag so it doesn't run on refresh
      generateOptimizedResume();
    }
  }, [analysisData, isGenerating, optimizedResume]);

  const downloadPDF = async () => {
    if (!optimizedResume) {
      toast({
        title: "No Resume Found",
        description: "Please generate an optimized resume first.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is Pro before allowing download
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      toast({
        title: "Generating PDF...",
        description: "Creating your resume PDF. This may take a few seconds...",
      });

      // Generate PDF using server-side Puppeteer
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: optimizedResume,
          template: selectedTemplate !== 'latex' ? selectedTemplate : 'modern',
          accentColor: optimizedResume.accentColor || '#3b82f6',
          fontFamily: optimizedResume.fontFamily || 'Inter',
          sectionOrder: optimizedResume.sectionOrder || [],
          showIcons: optimizedResume.showIcons ?? true,
          isPaidUser: isPro,
          watermark: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Generated PDF is empty');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${optimizedResume.personalDetails.fullName.replace(/\s+/g, '_')}_Optimized_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded! 🎉",
        description: "Your optimized resume has been saved successfully.",
      });

    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };




  const isLegacyTemplate = (key: string): key is keyof typeof TEMPLATES => {
    return key in TEMPLATES;
  };

  const TemplateComponent = isLegacyTemplate(selectedTemplate)
    ? TEMPLATES[selectedTemplate]
    : null;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 mb-0"
      onContextMenu={(e) => e.preventDefault()}
    >
      {showOptimizationLoader && <ResumeOptimizationLoader />}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg">
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
                  <ul className="space-y-2 text-slate-700 dark:text-slate-300">

                    <li className="flex items-start gap-3 p-2 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/50">
                      <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <span className="font-medium">AI applies all improvements</span>
                    </li>
                    <li className="flex items-start gap-3 p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
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

                {/* Credit Balance - Enhanced visibility */}

              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 font-medium shadow-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={generateOptimizedResume}
              className="bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 hover:from-violet-700 hover:via-purple-700 hover:to-purple-800 text-white font-semibold shadow-xl hover:shadow-2xl border-2 border-violet-500 dark:border-violet-400 transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Credit Modals */}
      <InsufficientCreditsModal
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
        onUpgrade={() => {
          setShowInsufficientModal(false);
          setShowUpgradeModal(true);
        }}
        requiredCredits={0}
      />

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* Minimal Header */}


      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Panel - Controls */}
          <div className="h-full hidden lg:flex flex-col bg-white dark:bg-slate-900 p-3 lg:p-4 overflow-hidden">
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col min-h-0">
              {!optimizedResume ? (
                <div className="flex flex-col gap-3 min-h-0 flex-1">
                  {/* Hero Section - Compact */}
                  <div className="text-center space-y-2 py-2">
                    <div className="inline-flex p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        AI Resume Optimizer
                      </h1>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Transform your resume with AI-powered optimization
                      </p>
                    </div>
                  </div>

                  {/* Score Display - Compact */}


                  {/* Main CTA Card - Scrollable Only Here */}
                  <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-md">
                    <CardContent className="p-3 pb-3 space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <CheckCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                            What happens next:
                          </p>
                          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                            <li className="flex items-start gap-1">
                              <span className="text-blue-600 dark:text-blue-400">•</span>
                              <span>AI applies all improvements</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-blue-600 dark:text-blue-400">•</span>
                              <span>Keywords integrated naturally</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-blue-600 dark:text-blue-400">•</span>
                              <span>ATS-optimized formatting</span>
                            </li>
                            <li className="flex items-start gap-1">
                              <span className="text-blue-600 dark:text-blue-400">•</span>
                              <span>Multiple templates available</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {!session && (
                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 py-1.5">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <AlertTitle className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                            Not signed in
                          </AlertTitle>
                          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                            Sign in to save your optimized resume
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleGenerateClick}
                        disabled={isGenerating || !analysisData}
                        className="w-full h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg text-sm"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Generate Optimized Resume
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>



                  {/* Analyze Another Job Button */}
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        if (typeof window !== 'undefined') {
                          sessionStorage.removeItem('atsAnalysisData');
                          sessionStorage.removeItem('currentAnalysisResult');
                          sessionStorage.removeItem('atsFormData');
                          window.location.href = '/ats-checker?new=true';
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        window.location.href = '/ats-checker?new=true';
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs border-2"
                    type="button"
                  >
                    Analyze Another Job
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto">
                  {/* Success Message - Compact */}
                  <div className="text-center space-y-1.5 py-2">
                    <div className="inline-flex p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Resume Optimized!
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Choose a template and download
                      </p>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <Card className="border-2 border-violet-200 dark:border-violet-800 shadow-md">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Download Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-3">
                      {selectedTemplate === "latex" ? (
                        <>
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-bold text-amber-900 dark:text-amber-100">LaTeX Mode Active</span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                              Review and manage your LaTeX code directly in the preview panel. You can copy the code or download the file for professional compilation.
                            </p>

                          </div>
                        </>
                      ) : (
                        <>
                          {isTemplatesCaching ? (
                            <Skeleton className="h-8 w-full rounded-lg" />
                          ) : (
                            <Button
                              onClick={downloadPDF}
                              size="sm"
                              className={`w-full h-8 text-xs ${!isPro
                                ? "bg-slate-400 hover:bg-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                } text-white`}
                              disabled={isEditing}
                            >
                              {!isPro ? (
                                <>
                                  <Zap className="mr-1.5 h-3 w-3 text-yellow-300" />
                                  Download PDF (Pro)
                                </>
                              ) : (
                                <>
                                  <Download className="mr-1.5 h-3 w-3" />
                                  Download PDF
                                </>
                              )}
                            </Button>
                          )}





                          {session && (
                            <>
                              {isEditing ? (
                                <div className="space-y-4">
                                  {/* Inline Edit Actions */}
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleSave}
                                      size="sm"
                                      className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      disabled={isSaving}
                                    >
                                      {isSaving ? (
                                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle className="mr-1.5 h-3 w-3" />
                                      )}
                                      Save Changes
                                    </Button>
                                    <Button
                                      onClick={() => setIsEditing(false)}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-8 text-xs border-red-200 hover:bg-red-50 text-red-600"
                                      disabled={isSaving}
                                    >
                                      Cancel
                                    </Button>
                                  </div>

                                  {/* Theme Customization UI */}
                                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theme Settings</p>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] text-slate-500">Accent Color</Label>
                                        <Input
                                          type="color"
                                          value={accentColor}
                                          onChange={handleAccentColorChange}
                                          className="h-8 w-full cursor-pointer p-0.5"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] text-slate-500">Font Family</Label>
                                        <Select value={fontFamily} onValueChange={setFontFamily}>
                                          <SelectTrigger className="h-8 text-[11px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {FONT_OPTIONS.map((font) => (
                                              <SelectItem key={font.value} value={font.value} className="text-[11px]">
                                                {font.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>


                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setIsEditing(true);
                                    setShowPreview(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-xs border-2"
                                >
                                  <Edit className="mr-1.5 h-3 w-3" />
                                  Edit Layout & Style
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Template Selection */}
                  <Card id="template-selection-card" className="border-2 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Select Template
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Legacy Templates */}
                        <button
                          onClick={() => setSelectedTemplate('modern')}
                          className={`p-2 border-2 rounded-lg transition-all text-xs font-medium capitalize ${selectedTemplate === 'modern' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Modern
                        </button>

                        <button
                          onClick={() => setSelectedTemplate('minimal')}
                          className={`p-2 border-2 rounded-lg transition-all text-xs font-medium capitalize ${selectedTemplate === 'minimal' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Minimal
                        </button>
                        <button
                          onClick={() => setSelectedTemplate('professional')}
                          className={`p-2 border-2 rounded-lg transition-all text-xs font-medium capitalize ${selectedTemplate === 'professional' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Professional
                        </button>
                        <button
                          onClick={() => setSelectedTemplate('creative')}
                          className={`p-2 border-2 rounded-lg transition-all text-xs font-medium capitalize ${selectedTemplate === 'creative' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Creative
                        </button>
                      </div>



                      <button
                        onClick={() => {
                          if (!isPro) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setSelectedTemplate("latex");
                          if (!latexCode && !isGeneratingLatex) {
                            generateOptimizedResumeLatex();
                          }
                        }}
                        className={`w-full p-2 border-2 rounded-lg transition-all relative overflow-hidden ${selectedTemplate === "latex"
                          ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
                          } ${!isPro ? "opacity-90" : ""}`}
                      >
                        {!isPro && (
                          <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg shadow-sm">
                            <Lock className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 text-left">
                              LaTeX Template
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 text-left">
                              Advanced {!isPro && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 px-1 rounded ml-1 font-bold">PRO</span>}
                            </p>
                          </div>
                          <span className="text-base">{!isPro ? "🔒" : "⭐"}</span>
                        </div>
                      </button>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="space-y-2">




                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          if (typeof window !== 'undefined') {
                            // Clear stored session data (localStorage is used in ats-checker)
                            localStorage.removeItem('optimizedResumeSession');
                            localStorage.setItem('forceNewAnalysis', 'true');

                            // Clear all analysis-related data from both storages to be safe
                            localStorage.removeItem('atsAnalysisData');
                            localStorage.removeItem('atsAnalysisResult'); // Some contexts usages
                            localStorage.removeItem('atsFormData');
                            localStorage.removeItem('atsCheckerDraft');
                            localStorage.removeItem('pendingAnalysis');

                            sessionStorage.clear(); // Clear session storage completely for this flow
                          }

                          // Force hard reload to clear React Context state
                          window.location.href = '/ats-checker';
                        } catch (error) {
                          console.error('Error:', error);
                          window.location.href = '/ats-checker';
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-2"
                      type="button"
                    >
                      Analyze Another Job
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Right Panel - Scrollable Preview */}
          <div id="resume-preview-panel" className="h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-hidden relative">
            {isGeneratingLatex ? (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-violet-600 animate-pulse" />
                </div>
                <div className="mt-6 text-center space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Generating LaTeX...</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Our AI is converting your resume content and applying strategic optimizations. This takes about 20-30 seconds.
                  </p>
                </div>
              </div>
            ) : null}

            {optimizedResume ? (
              <>
                {selectedTemplate === "latex" ? (
                  <div className="h-full flex flex-col p-4">
                    <Card className="border-2 border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden shadow-xl bg-white dark:bg-slate-900">
                      <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">LaTeX Source Code</h3>

                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={copyLatexToClipboard}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            disabled={!latexCode}
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            Copy
                          </Button>
                          <Button
                            onClick={downloadLatexCodeOnly}
                            variant="default"
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                            disabled={!latexCode}
                          >
                            <Download className="h-3.5 w-3.5" />
                            .tex File
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden relative">
                        {latexCode ? (
                          <div className="h-full overflow-y-auto p-4 font-mono text-[13px] leading-relaxed bg-slate-950 text-slate-300">
                            <pre className="whitespace-pre-wrap selection:bg-violet-500/30">
                              {latexCode}
                            </pre>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                              <Sparkles className="h-8 w-8 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">No LaTeX code generated yet</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Click the generate button to begin optimization</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-4 right-4 group">
                          <Alert className="w-52 py-2 px-3 border-amber-200 bg-amber-50 shadow-lg dark:bg-amber-950/20 dark:border-amber-900/50">
                            <AlertDescription className="text-[10px] text-amber-800 dark:text-amber-200">
                              Use <a href="https://overleaf.com" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-600">Overleaf</a> for best results
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (showPreview || isEditing) ? (
                  <div className="w-full h-full flex flex-col items-center bg-[#f4f7fa] overflow-y-auto relative font-sans py-8">
                    {/* FLOATING TOP BAR - Responsive */}
                    <div className="sticky top-0 w-full max-w-[25cm] px-2 md:px-4 z-20 pointer-events-none mb-4">
                      <div className="
      bg-gradient-to-r from-slate-50/95 to-sky-50/90
      backdrop-blur-lg
      shadow-xl
      border border-slate-300/70
      ring-1 ring-white/40
      rounded-2xl
      p-2 md:px-6 md:py-4
      flex items-center 
      pointer-events-auto
      transition-all duration-300
      hover:shadow-2xl
      gap-2 md:gap-4
    "
                      >
                        {/* Action Container - Changed to md:justify-start */}
                        <div className="flex items-center gap-2 md:gap-3 w-full justify-between md:justify-start">

                          {/* Pagination - Stays grouped */}
                          <div className="flex items-center gap-1 bg-slate-100/50 rounded-lg p-1 pr-2 md:pr-3 border border-slate-300/50">
                            <button
                              onClick={handlePrevious}
                              disabled={!canGoPrev}
                              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                            >
                              <ChevronLeft className="w-4 h-4 text-slate-800" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-800 min-w-[20px] md:w-[30px] text-center select-none">
                              {currentPage}/{pageCount}
                            </span>
                            <button
                              onClick={handleNext}
                              disabled={!canGoNext}
                              className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                            >
                              <ChevronRight className="w-4 h-4 text-slate-800" />
                            </button>
                          </div>

                          {/* Button Group */}
                          <div className="flex items-center gap-2">
                            {/* Mobile Template Switch Button */}
                            <Button
                              onClick={() => setIsMobileTemplateOpen(true)}
                              size="sm"
                              variant="outline"
                              className="lg:hidden h-8 w-8 p-0 md:w-auto md:px-3 gap-2 rounded-lg border-violet-200 text-violet-700 bg-violet-50"
                            >
                              <LayoutTemplate className="w-4 h-4" />
                              <span className="hidden md:inline text-xs font-medium">Templates</span>
                            </Button>

                            {/* Separator - Visible only on desktop */}
                            <div className="h-6 w-px bg-slate-200/50 hidden md:block"></div>

                            {/* Download Button */}
                            <Button
                              id="download-pdf-btn"
                              onClick={downloadPDF}
                              size="sm"
                              className={`h-8 border-0 text-white rounded-lg px-3 md:px-4 gap-2 transition-all shadow-md active:scale-95 text-xs font-bold ${isEditing || isBackgroundPdfLoading
                                ? "bg-slate-400 hover:bg-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-black"
                                }`}
                              disabled={isEditing || isBackgroundPdfLoading}
                            >
                              {isBackgroundPdfLoading ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                  Preparing...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-1.5 h-3 w-3" />
                                  Download PDF
                                </>
                              )}
                            </Button>

                            {/* Edit Button */}
                            <Button
                              id="edit-resume-btn"
                              onClick={() => setIsEditing(!isEditing)}
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 md:w-auto md:px-3 gap-2 rounded-lg text-xs font-medium border ${isEditing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-transparent text-slate-600 '}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">{isEditing ? 'Done' : 'Edit'}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RESUME RENDERER - Wrapped in scrollable area handled by ResumeRenderer internally if needed, or by this container */}
                    <div className="flex-1 w-full flex flex-col items-center relative">
                      <ResumeRenderer
                        resumeData={{
                          ...(optimizedResume as ResumeData),
                          accentColor,
                          fontFamily,
                          sectionOrder,
                          showIcons,
                        }}
                        template={selectedTemplate as string}
                        isPaid={isPro}
                        isEditing={isEditing}
                        updateField={updateField}
                        currentPage={currentPage}
                        pageCount={pageCount}
                        onPageChange={setCurrentPage}
                        onPageCountChange={setPageCount}
                        isPaidUser={isPro}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-100/50 dark:bg-slate-900/50">
                    <div className="text-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full w-fit mx-auto">
                        <EyeOff className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-md font-bold text-foreground">Preview Is Hidden</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Optimize your content first or click "PDF Preview" to toggle.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <div className="max-w-md text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center animate-pulse">
                      <Sparkles className="h-10 w-10 text-violet-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Ready to Optimize?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Click the "Generate Optimized Resume" button on the left to transform your experience into an ATS-friendly masterpiece.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Reorder Modal */}
      <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
        <DialogContent className="print:hidden border-purple-200 dark:border-purple-800">
          <DialogHeader>
            <DialogTitle className="text-purple-900 dark:text-purple-100 uppercase tracking-widest text-sm">Rearrange Sections</DialogTitle>
          </DialogHeader>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-4">
                  {tempSectionOrder.map((section, index) => (
                    <Draggable key={section} draggableId={section} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {section.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => moveSectionUp(index)}
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              onClick={() => moveSectionDown(index)}
                              disabled={index === tempSectionOrder.length - 1}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="mt-6 flex gap-3">
            <Button onClick={saveSectionOrder} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              Apply Changes
            </Button>
            <Button variant="outline" onClick={() => setIsReorderModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Template Selection Modal */}
      <Dialog open={isMobileTemplateOpen} onOpenChange={setIsMobileTemplateOpen}>
        <DialogContent className="w-[95%] max-w-sm rounded-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Choose Template
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {/* Standard Templates */}
            {(['modern', 'minimal', 'professional', 'creative'] as const).map((tpl) => (
              <button
                key={tpl}
                onClick={() => { setSelectedTemplate(tpl); setIsMobileTemplateOpen(false); }}
                className={`
            relative group flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300
            ${selectedTemplate === tpl
                    ? 'border-violet-600 bg-violet-50/80 dark:border-violet-500 dark:bg-violet-500/10 shadow-md scale-[1.02]'
                    : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50 hover:border-violet-200 hover:bg-violet-50/30'
                  }
          `}
              >
                {/* Visual indicator for selection */}
                {selectedTemplate === tpl && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                )}

                {/* Mini Resume Graphic */}
                <div className={`
            w-10 h-14 rounded border shadow-sm mb-3 flex flex-col p-1.5 gap-1 transition-colors
            ${selectedTemplate === tpl ? 'bg-white dark:bg-slate-900 border-violet-100 dark:border-violet-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
          `}>
                  {/* Abstract lines representing resume layout */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mb-0.5 opacity-80" />
                  <div className="w-2/3 h-1 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-0.5" />
                  <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div className="w-3/4 h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
                </div>

                <span className={`text-xs font-bold capitalize tracking-wide ${selectedTemplate === tpl ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {tpl}
                </span>
              </button>
            ))}

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}