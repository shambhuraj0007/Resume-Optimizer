"use client";
import React, { useState, useEffect, useRef } from 'react';
import { UniversalResume } from './UniversalResume';
import { ResumeData } from './templates/types';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';



interface ResumeMultiPageViewerProps {
  resumeData: ResumeData;
  template: string;
  isPaid: boolean;
}

export function ResumeMultiPageViewer({
  resumeData,
  template,
  isPaid,
}: ResumeMultiPageViewerProps) {
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCalculating, setIsCalculating] = useState(true);

  // Calculate total pages by measuring content height
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      const element = document.getElementById('resume-content');
      if (element) {
        // A4 height at 96dpi = 1123px (297mm)
        const A4_HEIGHT = 1123;
        const totalHeight = element.scrollHeight;
        const calculatedPages = Math.ceil(totalHeight / A4_HEIGHT);
        setPageCount(Math.max(1, calculatedPages));
      }
      setIsCalculating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [resumeData, template]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(pageCount, prev + 1));
  };

  const handleDownload = async () => {
    if (!isPaid) {
      alert('Upgrade to download PDF');
      return;
    }

    try {
      const response = await fetch('/api/render-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          data: resumeData,
          type: 'pdf',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 pb-20">

      {/* TOOLBAR */}
      <div className="sticky top-0 w-full bg-white shadow-md z-40 flex justify-between items-center px-6 py-4">
        <h2 className="text-lg font-bold text-gray-800">Preview</h2>
        <button
          onClick={handleDownload}
          disabled={!isPaid}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isPaid ? 'Download PDF' : 'Upgrade to Download'}
        </button>
      </div>

      {/* MAIN PREVIEW AREA */}
      <div className="w-full max-w-4xl px-4 py-8">
        <div
          id="resume-content"
          className="transition-all duration-300"
        >
          <UniversalResume
            resumeData={resumeData}
            template={template}
            isEditing={false}
          />
        </div>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Left Navigation */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Previous</span>
          </button>

          {/* Page Indicator */}
          <div className="text-center">
            <div className="flex items-center gap-2">
              <div className="w-24">
                <div className="text-sm font-bold text-foreground">
                  Page {currentPage} of {pageCount}
                </div>
              </div>
            </div>
            {isCalculating && (
              <div className="text-xs text-gray-500 mt-1">Calculating...</div>
            )}
          </div>

          {/* Right Navigation */}
          <button
            onClick={handleNext}
            disabled={currentPage === pageCount}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-sm font-medium">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PAGE INDICATOR BADGES (Floating) */}
      <div className="fixed right-6 bottom-28 flex flex-col gap-2">
        {Array.from({ length: pageCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${currentPage === i + 1
              ? 'bg-blue-600 text-white shadow-lg scale-110'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
