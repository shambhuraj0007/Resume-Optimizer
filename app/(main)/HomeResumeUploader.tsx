"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";

import UpgradeModal from "@/components/credits/UpgradeModal";
// You can remove InsufficientCreditsModal import if it's no longer used anywhere else
import InsufficientCreditsModal from "@/components/credits/InsufficientCreditsModal";
import { useSession } from "next-auth/react";
import { validateResume, ValidationResult } from "@/lib/resume-validation";
import { validateJobDescription } from "@/lib/jd-validation";

import { saveFileToDB, getFileFromDB } from "@/lib/indexed-db";
import { useTour } from "@/hooks/useTour";



const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ========== SIZE CONFIGURATION - ADJUST THESE VALUES ==========
const SIZES = {
  // Resume upload box and paste textarea
  resumeMinHeight: "150px",  // Options: "200px", "300px", "400px"
  resumeMaxHeight: "400px",  // Options: "500px", "600px", "800px"
  resumeRows: 10,            // Options: 8, 12, 15

  // Job description textarea
  jdMinHeight: "190px",      // Options: "100px", "150px", "200px"
  jdMaxHeight: "400px",      // Options: "300px", "500px", "600px"
  jdRows: 5,                 // Options: 4, 6, 8
};
// ================================================================

interface HomeResumeUploaderProps {
  initialJd?: string;
  isExtension?: boolean;
}

function HomeResumeUploader({ initialJd, isExtension }: HomeResumeUploaderProps) {
  const router = useRouter();

  // Initialize Tour
  const { startTour } = useTour();

  const { status } = useSession();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Prefetch immediately on mount
    router.prefetch("/ats-checker");

    if (initialJd) {
      console.log("Extension JD Received:", initialJd.substring(0, 20) + "...");
      setJobDescription(initialJd);
      // router.prefetch("/ats-checker"); // Moved up

      // ✅ Explicitly trigger validation so the button enables immediately
      validateJDContent(initialJd);
    }
  }, [initialJd]);

  // Note: You can remove showInsufficientModal state if you aren't using the modal anymore
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const { balance, refreshBalance } = useCredits();



  // Error message function
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
  const validateResumeContent = async (text: string) => {
    if (!text.trim()) {
      setIsResumeValid(false);
      setResumeValidationError(null);
      setErrorState('none');
      return;
    }

    setIsValidatingResume(true);
    try {
      // Use local validation
      const result = validateResume(text);

      // Get appropriate message
      const message = getErrorMessage(result, undefined, undefined, text.length);

      setResumeValidationError(message || null);
      setValidationResult(result);

      // Set visual state
      if (result.recommendedAction === 'accept') {
        setErrorState('none');
        setIsResumeValid(true);
      } else if (result.recommendedAction === 'review') {
        setErrorState('warning');
        setIsResumeValid(true); // Allow proceed on review
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

  const validateJDContent = async (text: string) => {
    if (!text.trim()) {
      setIsJDValid(false);
      setJdValidationError(null);
      setJdErrorState('none');
      return;
    }

    setIsValidatingJD(true);
    try {
      // Use local validation (Faster)
      const result = validateJobDescription(text);

      if (!result.isValid) {
        setJdValidationError(result.message || "Invalid job description.");
        setIsJDValid(false);
        setJdErrorState('error');
      } else {
        setJdValidationError(null);
        setIsJDValid(true);
        setJdErrorState('none');
      }
    } catch (e) {
      setJdValidationError("Doesn't look like a job description");
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
    // We pass empty text for hygiene checks on file metadata.
    const hygieneResult = validateResume("", undefined, file.name, file.size, file.type);

    // If hygiene check fails solidly (like size or type), stop early
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

        // Run full validation with extracted text
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
      } else {
        const errorData = await response.json();
        // Handle extraction errors (password etc) via validateResume logic if possible 
        // or manual fallback
        const isPasswordError = errorData.error && errorData.error.toLowerCase().includes('password');

        const result = validateResume("", undefined, file.name, file.size, file.type, isPasswordError);

        if (result.recommendedAction === 'reject') {
          setResumeValidationError(getErrorMessage(result));
        } else {
          setResumeValidationError(errorData.error || "Failed to extract text from PDF");
        }

        setIsResumeValid(false);
        setErrorState('error');
      }
    } catch (error) {
      setResumeValidationError("Failed to process PDF. Please try again.");
      setIsResumeValid(false);
      setErrorState('error');
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
          await saveFileToDB("homeResumeDraft", pdfFile);
          fileToStore = {
            name: pdfFile.name,
            type: pdfFile.type,
            dataUrl: "STORED_IN_INDEXEDDB",
          };
        } catch (e) {
          // Fallback to Base64 if IndexedDB fails
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
      localStorage.setItem("homeAnalyzerDraft", JSON.stringify(draft));
    };

    const timeoutId = setTimeout(saveDraft, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [resumeText, inputMode, pdfFile]);

  // Restore state on mount
  useEffect(() => {
    if (isExtension) {
      localStorage.setItem("isExtensionMode", "true");
    }

    // Restore JD from session storage if available (handle redirect back from login)
    const savedJd = sessionStorage.getItem("savedJobDescription");
    if (savedJd) {
      setJobDescription(savedJd);
      // Validate to ensure UI is in correct state
      validateJDContent(savedJd);
    }

    const initializeState = async () => {
      const draftStr = localStorage.getItem("homeAnalyzerDraft");

      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          // Check if draft is recent (e.g., 24 hours)
          if (Date.now() - draft.timestamp < 86400000) {
            if (draft.inputMode) setInputMode(draft.inputMode);

            if (draft.resumeData) {
              setResumeText(draft.resumeData);
              validateResumeContent(draft.resumeData);
            }

            if (draft.resumeFile) {
              let file: File | null = null;
              if (draft.resumeFile.dataUrl === "STORED_IN_INDEXEDDB") {
                const blob = await getFileFromDB("homeResumeDraft");
                if (blob) {
                  file = new File([blob], draft.resumeFile.name, { type: draft.resumeFile.type });
                }
              } else {
                const res = await fetch(draft.resumeFile.dataUrl);
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
    };

    initializeState();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setResumeText("");
      handleFileValidation(file); // Trigger validation
      toast({
        title: "Resume Selected",
        description: `${file.name} selected. analyzing...`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPdfFile(file);
      setResumeText("");
      handleFileValidation(file); // Trigger validation
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const toggleInputMode = () => {
    const newMode = inputMode === "upload" ? "paste" : "upload";
    setInputMode(newMode);

    // Clear validation state
    setIsResumeValid(false);
    setResumeValidationError(null);
    setErrorState('none');

    if (newMode === "upload") {
      setResumeText("");
    } else {
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Input Validations
    if (inputMode === "upload" && !pdfFile) {
      toast({ title: "Missing Resume", description: "Please upload your resume PDF.", variant: "destructive" });
      return;
    }
    if (inputMode === "paste" && !resumeText.trim()) {
      toast({ title: "Missing Resume", description: "Please paste your resume text.", variant: "destructive" });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: "Missing Job Description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }
    if (!isResumeValid) {
      toast({ title: "Invalid Resume", description: resumeValidationError || "Please provide a valid resume.", variant: "destructive" });
      return;
    }
    if (!isJDValid) {
      toast({ title: "Invalid Job Description", description: jdValidationError || "Please provide a valid job description.", variant: "destructive" });
      return;
    }

    // 2. Prepare File Data (Use IndexedDB if file exists)
    let filePayload = null;
    if (pdfFile) {
      try {
        // Save actual blob to IndexedDB
        await saveFileToDB('pendingResume', pdfFile);
        // Set payload marker
        filePayload = { name: pdfFile.name, type: pdfFile.type, dataUrl: "STORED_IN_INDEXEDDB" };
      } catch (e) {
        console.error("IDB Save Error", e);
        toast({ title: "Storage Error", description: "Could not save file locally.", variant: "destructive" });
        return;
      }
    }

    // 3. Prepare Common Payload
    const payload = {
      resumeData: inputMode === 'paste' ? resumeText : null,
      resumeFile: filePayload,
      jobDescription: jobDescription.trim(),
      autoStart: true,
      timestamp: Date.now(),
    };

    // 4. Auth Check & Redirect
    if (status === "unauthenticated") {
      // Save JD to session storage to persist across login redirect
      if (isJDValid && jobDescription) {
        sessionStorage.setItem("savedJobDescription", jobDescription);
      }

      // Save pending state so it picks up after login
      localStorage.setItem("pendingAnalysis", JSON.stringify(payload));

      toast({ title: "Sign In Required", description: "Please sign in to analyze.", variant: "destructive" });

      if (isExtension) {
        // Keep in sidebar: Redirect to extension landing page (which has the Login button)
        window.location.href = "/extension-mode";
        return;
      }

      router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    // 5. Credit Check
    if (!balance || balance.credits === 0 || balance.hasExpired) {
      setShowUpgradeModal(true);
      return;
    }

    setIsNavigating(true);

    try {
      // 6. Save Handoff Data
      localStorage.setItem("pendingAnalysis", JSON.stringify(payload));

      // 7. Navigate Immediately
      router.push("/ats-checker");

    } catch (error) {
      console.error("Error preparing analysis:", error);
      toast({ title: "Error", description: "Failed to prepare analysis.", variant: "destructive" });
      setIsNavigating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative p-1 sm:p-1.5 md:p-2 lg:p-2">
      {isNavigating && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-sm font-medium">Opening Analyzer...</p>
          </div>
        </div>
      )}

      <Card id="tour-welcome" className={`${isExtension ? 'w-full' : 'max-w-2xl'} mx-auto border-0 shadow-none`}>
        <CardContent className="pt-2 pb-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Resume Input */}
            <div id="tour-upload" className="mb-12">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-m font-medium">
                  Your Resume <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleInputMode}
                  className="text-xs"
                  aria-label={inputMode === "upload" ? "Switch to paste text mode" : "Switch to file upload mode"}
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
                <>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`block border-2 border-dashed rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center p-6 ${resumeValidationError
                      ? errorState === 'warning'
                        ? "border-yellow-400 bg-yellow-50/10"
                        : "border-red-500 bg-red-50/10"
                      : (isResumeValid && pdfFile)
                        ? "border-green-400 bg-green-50/10"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5"
                      }`}
                    style={{ minHeight: SIZES.resumeMinHeight }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload
                      className={`w-10 h-10 mx-auto mb-3 ${resumeValidationError
                        ? "text-red-500"
                        : pdfFile
                          ? "text-green-500"
                          : "text-muted-foreground"
                        }`}
                    />
                    <p className="text-sm font-medium mb-1">
                      {pdfFile
                        ? pdfFile.name
                        : "Click here or drag & drop your resume PDF"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {pdfFile
                        ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : "Maximum file size: 5MB"}
                    </p>
                    <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                      Browse Files
                    </span>
                  </label>
                  {resumeValidationError && inputMode === "upload" && (
                    <div className={`
                      text-xs py-2 px-3 mt-2 rounded-lg border text-left w-full
                      ${errorState === 'warning'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }
                    `}>
                      <span className="flex items-center gap-1 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {resumeValidationError}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setResumeText(newValue);
                      validateResumeContent(newValue);
                    }}
                    placeholder="Paste your complete resume text here including all sections: contact info, summary, experience, education, skills, etc..."
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-y ${resumeValidationError ? "border-red-500" : "border-input"}`}
                    style={{
                      minHeight: SIZES.resumeMinHeight,
                      maxHeight: SIZES.resumeMaxHeight
                    }}
                    rows={SIZES.resumeRows}
                    onBlur={() => validateResumeContent(resumeText)}
                  />
                  {resumeValidationError && (
                    <div className={`
                      text-xs py-2 px-3 mt-1 rounded-lg border text-left w-full
                      ${errorState === 'warning'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }
                    `}>
                      <span className="flex items-center gap-1 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {resumeValidationError}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the complete text from your resume for best results
                  </p>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div id="tour-jd" className="mt-9">
              <label
                htmlFor="jobDescription"
                className="block text-m font-medium mb-2"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setJobDescription(newValue);
                  validateJDContent(newValue);
                }}
                placeholder="Paste the complete job description here including responsibilities, requirements, and qualifications..."
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-y ${jdValidationError
                  ? jdErrorState === 'warning'
                    ? "border-yellow-400 focus:ring-yellow-400"
                    : "border-red-500 focus:ring-red-500"
                  : "border-input"}`}
                style={{
                  minHeight: SIZES.jdMinHeight,
                  maxHeight: SIZES.jdMaxHeight
                }}
                rows={SIZES.jdRows}
                required
                onBlur={() => validateJDContent(jobDescription)}
              />
              {jdValidationError && (
                <div className={`
                  text-xs py-2 px-3 mt-1 rounded-lg border text-left w-full
                  ${jdErrorState === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                  }
                `}>
                  <span className="flex items-center gap-1 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {jdValidationError}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Include all job requirements, skills, and qualifications for
                accurate matching
              </p>
            </div>

            <Button
              id="tour-analyze"
              type="submit"
              disabled={
                isNavigating ||
                (inputMode === "upload" && (!pdfFile || !isResumeValid)) ||
                (inputMode === "paste" && (!resumeText.trim() || !isResumeValid)) ||
                !jobDescription.trim() ||
                !isJDValid
              }
              className="w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-12"
              size="lg"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing Analysis...
                </>
              ) : (
                "Analyze My Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Note: InsufficientCreditsModal component remains here but is not triggered */}
      <InsufficientCreditsModal
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
        onUpgrade={() => {
          setShowInsufficientModal(false);
          setShowUpgradeModal(true);
        }}
        requiredCredits={1}
      />

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onSuccess={() => {
          refreshBalance();
          setShowUpgradeModal(false);
        }}
      />
    </div>
  );
}

export default HomeResumeUploader;