import React, { useRef, useEffect, useState } from 'react';
import { DM_Sans, Roboto, Lato, Open_Sans } from 'next/font/google';
import { ModernTemplate } from './templates/Modern';
import { MinimalTemplate } from './templates/Minimal';
import { ProfessionalTemplate } from './templates/Professional';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ResumeData } from './templates/types';
import { WatermarkOverlay } from './WatermarkOverlay';
import memoizeOne from 'memoize-one';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto', display: 'swap' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });

const TEMPLATES = {
    modern: ModernTemplate,
    minimal: MinimalTemplate,
    professional: ProfessionalTemplate,
    creative: CreativeTemplate,
} as const;

type TemplateKey = keyof typeof TEMPLATES;

interface ResumePreviewProps {
    resumeData: ResumeData;
    selectedTemplate: string;
    isPro: boolean;
    isPaidUser?: boolean;
    isEditing?: boolean;
    updateField?: (section: any, index: number | null, field: string, value: string) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
    resumeData,
    selectedTemplate,
    isPro,
    isPaidUser = false,
    isEditing = false,
    updateField = () => { }
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const TemplateComponent = TEMPLATES[selectedTemplate as TemplateKey] || ModernTemplate;

    useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const padding = 32; // Total horizontal padding (p-4 or p-8)
                const availableWidth = containerWidth - padding;
                const a4WidthPx = 794; // 21cm at 96 DPI

                // Always scale down if the container is smaller than A4
                // This ensures it fits width-wise, preventing horizontal scroll
                if (availableWidth < a4WidthPx) {
                    setScale(availableWidth / a4WidthPx);
                } else {
                    setScale(1);
                }
            }
        };

        const timer = setTimeout(calculateScale, 100);
        window.addEventListener('resize', calculateScale);

        const resizeObserver = new ResizeObserver(calculateScale);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateScale);
            resizeObserver.disconnect();
        };
    }, []);

    const mergedResumeData = React.useMemo(() => ({
        ...resumeData,
        accentColor: resumeData.accentColor || '#3b82f6',
        fontFamily: resumeData.fontFamily || 'Inter',
        sectionOrder: resumeData.sectionOrder || [],
        showIcons: resumeData.showIcons ?? true,
    }), [resumeData]);

    const TemplateComponentMemo = React.useMemo(() => {
        return TEMPLATES[selectedTemplate as TemplateKey] || ModernTemplate;
    }, [selectedTemplate]);

    return (
        <div
            ref={containerRef}
            // CHANGED: replaced overflow-auto with overflow-y-auto and overflow-x-hidden
            className={`w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden p-4 lg:p-8 ${dmSans.variable} ${roboto.variable} ${lato.variable} ${openSans.variable} scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700`}
        >
            {/* Wrapper for the scaled content */}
            <div
                style={{
                    // CHANGED: Strictly control width to prevent horizontal expansion
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start' // Ensure it starts from top
                }}
            >
                {/* PDF Container */}
                <div
                    className="relative bg-white shadow-sm origin-top transition-transform duration-200 ease-out mb-20"
                    style={{
                        width: '842px',
                        height: 'auto',
                        minHeight: '1185px',
                        padding: '24px',
                        boxSizing: 'border-box',
                        transform: `scale(${scale})`,
                        // ADDED: Prevent margins from affecting flow in parent
                        marginBottom: `-${(1 - scale) * 1185}px`
                    }}
                >
                    {!isPaidUser && !isPro && <WatermarkOverlay show={true} />}

                    <div id="resume-content-preview">
                        <TemplateComponentMemo
                            resumeData={mergedResumeData}
                            isEditing={isEditing}
                            updateField={updateField}
                            isPaidUser={isPaidUser || isPro}
                        />
                    </div>

                    <style jsx global>{`
                        #resume-content-preview {
                            font-family: ${mergedResumeData.fontFamily || 'DM Sans'}, sans-serif;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        #resume-content-preview h1, 
                        #resume-content-preview h2, 
                        #resume-content-preview h3 {
                            page-break-after: avoid;
                            break-after: avoid;
                        }

                        #resume-content-preview .work-item,
                        #resume-content-preview .education-item,
                        #resume-content-preview .project-item {
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};
