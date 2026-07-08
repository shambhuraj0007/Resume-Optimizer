'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { UniversalResume } from './UniversalResume';
import { ResumeData } from './templates/types';

// Constants for A4 at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PREVIEW_PADDING = 24;
const PREVIEW_WIDTH_PX = 842; // A4_WIDTH_PX + 2 * PREVIEW_PADDING
const PREVIEW_HEIGHT_PX = 1300; // A4_HEIGHT_PX + 2 * PREVIEW_PADDING (with buffer for content sync)
const COLUMN_GAP_PX = 48; // Space between columns to match horizontal layout
const COLUMN_FULL_WIDTH = PREVIEW_WIDTH_PX; // Jump exactly one preview container width

interface ResumeRendererProps {
    resumeData: ResumeData & {
        accentColor?: string;
        fontFamily?: string;
        sectionOrder?: string[];
        showIcons?: boolean;
    };
    template: string;
    isPaid: boolean;
    isPaidUser?: boolean;
    isEditing?: boolean;
    updateField?: (section: any, index: number | null, field: string, value: string) => void;
    // Lifted State Props
    currentPage?: number;
    pageCount?: number;
    onPageChange?: (page: number) => void;
    onPageCountChange?: (count: number) => void;
}

export const ResumeRenderer = forwardRef<
    {
        getCurrentPage: () => number;
        getPageCount: () => number;
        goToNextPage: () => void;
        goToPreviousPage: () => void;
    },
    ResumeRendererProps
>(function ResumeRenderer(
    {
        resumeData,
        template,
        isPaid,
        isPaidUser = false,
        isEditing = false,
        updateField = () => { },
        currentPage = 1,
        pageCount: propPageCount,
        onPageChange,
        onPageCountChange,
    },
    ref
) {
    const [internalPageCount, setInternalPageCount] = useState(1);
    const [fontsReady, setFontsReady] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const columnContainerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Wait for fonts before layout finalization
    useEffect(() => {
        if (typeof document !== 'undefined' && document.fonts) {
            document.fonts.ready.then(() => {
                setFontsReady(true);
            }).catch(() => {
                setFontsReady(true); // Fallback if fonts API fails
            });
        } else {
            setFontsReady(true);
        }
    }, []);

    // Scaling Logic (for responsiveness)
    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const padding = 24;
                const availableWidth = containerWidth - padding;

                if (availableWidth < A4_WIDTH_PX) {
                    setScale(availableWidth / A4_WIDTH_PX);
                } else {
                    setScale(1);
                }
            }
        };

        const timer = setTimeout(calculateScale, 150);
        window.addEventListener('resize', calculateScale);

        const resizeObserver = new ResizeObserver(calculateScale);
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateScale);
            resizeObserver.disconnect();
        };
    }, []);

    // Page count calculation using CSS Column scroll width
    const calculatePageCount = useCallback(() => {
        if (!fontsReady || !columnContainerRef.current) return;

        const scrollWidth = columnContainerRef.current.scrollWidth;
        // With columns, scrollWidth is approximately N * PREVIEW_WIDTH
        // We divide by PREVIEW_WIDTH and round to find N
        const calculatedPages = Math.max(1, Math.round(scrollWidth / PREVIEW_WIDTH_PX));

        if (calculatedPages !== internalPageCount) {
            setInternalPageCount(calculatedPages);
            if (onPageCountChange) {
                onPageCountChange(calculatedPages);
            }
        }
    }, [fontsReady, internalPageCount, onPageCountChange]);

    useEffect(() => {
        // Calculate after fonts are ready and a small delay for rendering
        const timer = setTimeout(calculatePageCount, 300);
        return () => clearTimeout(timer);
    }, [resumeData, template, fontsReady, calculatePageCount]);

    // Scroll to the current page
    useEffect(() => {
        if (columnContainerRef.current && currentPage >= 1) {
            const scrollLeft = (currentPage - 1) * COLUMN_FULL_WIDTH;
            columnContainerRef.current.scrollTo({
                left: scrollLeft,
                behavior: 'smooth',
            });
        }
    }, [currentPage]);

    // Expose pagination methods
    useImperativeHandle(
        ref,
        () => ({
            getCurrentPage: () => currentPage,
            getPageCount: () => propPageCount || internalPageCount,
            goToNextPage: () => {
                const max = propPageCount || internalPageCount;
                if (onPageChange) onPageChange(Math.min(max, currentPage + 1));
            },
            goToPreviousPage: () => {
                if (onPageChange) onPageChange(Math.max(1, currentPage - 1));
            },
        }),
        [currentPage, propPageCount, internalPageCount, onPageChange]
    );

    return (
        <div ref={containerRef} className="w-full max-w-[842px] flex flex-col items-center overflow-hidden">
            {/* Outer wrapper for scaling */}
            <div
                className="origin-top transition-transform duration-200"
                style={{
                    transform: `scale(${scale})`,
                    marginBottom: scale < 1 ? `-${(1 - scale) * PREVIEW_HEIGHT_PX}px` : '0',
                }}
            >
                {/* Column container - shows one page at a time */}
                <div
                    ref={columnContainerRef}
                    id="resume-content"
                    className="preview-mode bg-white relative print:shadow-none shadow-sm overflow-hidden"
                    style={{
                        height: internalPageCount > 1 ? `${PREVIEW_HEIGHT_PX}px` : 'auto',
                        minHeight: internalPageCount > 1 ? `${PREVIEW_HEIGHT_PX}px` : 'auto',
                        maxHeight: `${PREVIEW_HEIGHT_PX}px`,
                        width: '842px',
                        columnWidth: `${A4_WIDTH_PX}px`,
                        columnGap: `${COLUMN_GAP_PX}px`,
                        columnFill: 'auto',
                        boxSizing: 'border-box',
                        padding: '24px', // Add padding for breathing room inside white box
                    }}
                >
                    <div id="resume-content-inner">
                        <UniversalResume
                            resumeData={resumeData}
                            template={template}
                            isEditing={isEditing}
                            updateField={updateField}
                            isPaidUser={isPaidUser || isPaid}
                        />
                    </div>
                </div>
            </div>

            {/* Page indicator dots (optional visual) */}
            {internalPageCount > 1 && (
                <div className="flex gap-2 mt-4 print:hidden">
                    {Array.from({ length: internalPageCount }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageChange && onPageChange(i + 1)}
                            className={`w-2.5 h-2.5 rounded-full transition-all z-1000 pb-2 ${currentPage === i + 1
                                ? 'bg-blue-600 scale-100 '
                                : 'bg-slate-300 hover:bg-slate-400'
                                }`}
                            aria-label={`Go to page ${i + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Match PDF rendering: remove wrapper padding */}
            <style jsx global>{`
                #resume-content .resume-wrapper {
                    padding: 0 !important;
                    margin: 0 !important;
                }
            `}</style>
        </div>
    );
});

ResumeRenderer.displayName = 'ResumeRenderer';
