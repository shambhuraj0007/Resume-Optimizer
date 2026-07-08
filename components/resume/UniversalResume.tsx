"use client";
import React, { useCallback } from 'react';
import { ResumeData } from './templates/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DOMPurify from 'isomorphic-dompurify';
import '@/styles/TemplateEngine.css';

interface UniversalResumeProps {
    resumeData: ResumeData;
    template: string; // 'modern' | 'professional' | 'minimal' | 'creative'
    isEditing?: boolean;
    isPaidUser?: boolean;
    updateField?: (section: any, index: number | null, field: string, value: string) => void;
}

export function UniversalResume({
    resumeData,
    template,
    isEditing = false,
    isPaidUser = false,
    updateField = () => { },
}: UniversalResumeProps) {

    // --- HELPER: Markdown to HTML ---
    const renderMarkdown = useCallback((text: string, forceBullets = false): string => {
        if (!text) return '';

        let segments: string[] = [];
        if (forceBullets) {
            // Split by newline first
            const lines = text.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // If it already looks like a list, don't split by sentence
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
                    segments.push(trimmed);
                } else {
                    // Split by sentence boundary: period/exclamation/question followed by space and Capital letter
                    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/);
                    sentences.forEach(s => {
                        if (s.trim()) segments.push(s.trim());
                    });
                }
            });
        } else {
            segments = text.split('\n');
        }

        let inList = false;
        let html = '';

        segments.forEach((seg) => {
            let line = seg.trim();
            if (!line) return;

            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            const isBullet = line.startsWith('- ') ||
                line.startsWith('* ') ||
                line.startsWith('• ') ||
                forceBullets;

            if (isBullet) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const content = line.replace(/^[-*•]\s+/, '');
                html += `<li>${content}</li>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += `<p>${line}</p>`;
            }
        });

        if (inList) html += '</ul>';
        return DOMPurify.sanitize(html);
    }, []);

    // --- HELPER: Render Input for Editing ---
    const renderInput = useCallback(
        ({ value, onChange, multiline = false, className = '', type = '', ariaLabel = '', forceBullets = false, skipMarkdown = false }: any) => {
            if (!isEditing) {
                if (type === 'link' || type === 'mail' || type === 'phone') {
                    const href = type === 'mail' ? `mailto:${value}` : type === 'phone' ? `tel:${value}` : value;
                    return (
                        <a href={href} target="_blank" rel="noopener noreferrer" className={`hover:underline ${className}`}>
                            {value}
                        </a>
                    );
                }
                if (skipMarkdown) return <span className={className}>{value}</span>;
                return <span className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(value, forceBullets) }} />;
            }

            return multiline ? (
                <Textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full min-h-[40px] text-[10.5pt] border-none focus:ring-1 focus:ring-blue-500 bg-transparent p-1 resize-none ${className}`}
                />
            ) : (
                <Input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-7 text-[10.5pt] border-none focus:ring-1 focus:ring-blue-500 bg-transparent p-1 ${className}`}
                />
            );
        },
        [isEditing, renderMarkdown]
    );

    const hasContent = (section: any) => {
        if (!section) return false;
        if (Array.isArray(section)) return section.length > 0;
        return typeof section === 'string' ? section.trim() !== '' : true;
    };

    return (
        <div
            className={`resume-wrapper template-${template}`}
            style={{
                '--color-accent': resumeData.accentColor || '#3b82f6',
                '--font-primary': resumeData.fontFamily || 'Inter, sans-serif'
            } as React.CSSProperties}
            onContextMenu={(e: React.MouseEvent) => !isPaidUser && e.preventDefault()}
            onCopy={(e: React.ClipboardEvent) => !isPaidUser && e.preventDefault()}
            onMouseDown={(e: React.MouseEvent) => !isPaidUser && (e.detail > 1 && e.preventDefault())}
        >
            {!isPaidUser && (template === 'modern' || template === 'creative' || template === 'professional' || template === 'minimal') && (
                <>
                    <style dangerouslySetInnerHTML={{
                        __html: `
            .resume-wrapper {
                position: relative !important;
                isolation: isolate !important;
                min-height: auto !important;
                background-image: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 70px,
                    rgba(100, 116, 139, 0.03) 70px,
                    rgba(100, 116, 139, 0.03) 140px
                ) !important;
                background-color: white !important;
            }
            .pro-badge {
                display: block !important;
                visibility: visible !important;
                position: absolute !important;
                z-index: 1000 !important;
                pointer-events: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            ${!isPaidUser ? `
            .resume-wrapper, .resume-grid, .resume-sidebar, .resume-main, section, div, span, p, h1, h2, h3, h4, h5, h6, li, aside, header, main {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }
            ` : ''}
            @media print {
                .resume-wrapper::before, .resume-wrapper::after, .pro-badge, .pdf-watermark {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                .resume-wrapper {
                    background-image: none !important;
                }
            }
        `}} />

                    {/* ADDITIONAL SVG WATERMARKS - 12 instances for complete coverage */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 999,
                        pointerEvents: 'none',
                        overflow: 'hidden'
                    }} className="no-print">
                        <svg
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%'
                            }}
                            viewBox="0 0 595 1200"
                            preserveAspectRatio="xMidYMin slice"
                        >
                            {/* Generate 12 watermarks */}
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                <text
                                    key={i}
                                    x="297.5"
                                    y={80 + (i * 95)}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontFamily="Inter, system-ui, sans-serif"
                                    fontWeight="900"
                                    fontSize="22"
                                    fill="#64748b"
                                    opacity="0.15"
                                    transform={`rotate(-35 297.5 ${80 + (i * 95)})`}
                                    letterSpacing="2"
                                >
                                    UPGRADE TO PRO TO DOWNLOAD
                                </text>
                            ))}
                        </svg>
                    </div>

                    {/* FOREGROUND PRO BADGE REMOVED - using SVG watermarks */}
                </>
            )}



            {/* Remove the inline style from resume-grid, let CSS handle it */}


            <div className="resume-grid" >

                {/* SIDEBAR - Modern & Creative Templates */}
                {(template === 'modern' || template === 'creative') && (
                    <aside className="resume-sidebar">
                        <div className="space-y-8">
                            {/* Skills */}
                            {hasContent(resumeData.skills) && (
                                <section>
                                    <h2 style={{ color: 'black' }}>Skills</h2>
                                    <div className="space-y-3">
                                        {resumeData.skills.map((skill, i) => (
                                            <div key={i}>
                                                {skill.skillType === 'individual' ? (
                                                    <div className="text-sm">• {renderInput({ value: skill.skill, onChange: (v: string) => updateField('skills', i, 'skill', v) })}</div>
                                                ) : (
                                                    <>
                                                        <div className="font-bold text-sm tracking-tight">{renderInput({ value: skill.category, onChange: (v: string) => updateField('skills', i, 'category', v) })}</div>
                                                        <div className="text-xs text-secondary mt-0.5">{renderInput({ value: skill.skills, onChange: (v: string) => updateField('skills', i, 'skills', v) })}</div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Languages */}
                            {hasContent(resumeData.languages) && (
                                <section>
                                    <h2>Languages</h2>
                                    <div className="space-y-1">
                                        {resumeData.languages.map((lang, i) => (
                                            <div key={i} className="text-sm flex items-center whitespace-nowrap">
                                                <span className="font-bold">{renderInput({ value: lang.language, onChange: (v: string) => updateField('languages', i, 'language', v), className: "p-0", skipMarkdown: true })}</span>
                                                <span className="font-medium text-secondary">-{renderInput({ value: lang.proficiency, onChange: (v: string) => updateField('languages', i, 'proficiency', v), className: "p-0", skipMarkdown: true })}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Certifications (Sidebar Templates) */}
                            {hasContent(resumeData.certifications) && (
                                <section>
                                    <h2 style={{ color: 'black' }}>Certifications</h2>
                                    <div className="grid grid-cols-1 gap-3">
                                        {resumeData.certifications.map((cert, i) => (
                                            <div key={i} className="text-sm break-inside-avoid">
                                                <div className="font-bold leading-snug">{renderInput({ value: cert.certificationName, onChange: (v: string) => updateField('certifications', i, 'certificationName', v) })}</div>
                                                <div className="text-xs text-secondary mt-0.5">{renderInput({ value: cert.issuingOrganization, onChange: (v: string) => updateField('certifications', i, 'issuingOrganization', v) })}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </aside>
                )}

                {/* HEADER SECTION */}
                <header className="resume-header">
                    <h1 className="uppercase">
                        {renderInput({
                            value: resumeData.personalDetails.fullName,
                            onChange: (v: string) => updateField('personalDetails', null, 'fullName', v),
                            className: "font-black"
                        })}
                    </h1>
                    <div className="text-lg font-bold text-accent tracking-widest uppercase mb-4">
                        {renderInput({
                            value: resumeData.jobTitle,
                            onChange: (v: string) => updateField('jobTitle', null, 'jobTitle', v)
                        })}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9pt] text-secondary font-semibold items-center">
                        {resumeData.personalDetails.email && (
                            <span className="flex items-center gap-1.5 leading-none shrink-0">📧 {renderInput({ value: resumeData.personalDetails.email, type: 'mail', onChange: (v: string) => updateField('personalDetails', null, 'email', v), className: "p-0 underline" })}</span>
                        )}
                        {resumeData.personalDetails.phone && (
                            <span className="flex items-center gap-1.5 leading-none shrink-0 px-2 border-l border-slate-300">📞 {renderInput({ value: resumeData.personalDetails.phone, onChange: (v: string) => updateField('personalDetails', null, 'phone', v), className: "p-0" })}</span>
                        )}
                        {resumeData.personalDetails.location && (
                            <span className="flex items-center gap-1.5 leading-none shrink-0 px-2 border-l border-slate-300">📍 {renderInput({ value: resumeData.personalDetails.location, onChange: (v: string) => updateField('personalDetails', null, 'location', v), className: "p-0" })}</span>
                        )}
                        {resumeData.personalDetails.linkedin && (
                            <span className="flex items-center gap-1.5 leading-none shrink-0 px-2 border-l border-slate-300">🔗 {renderInput({ value: resumeData.personalDetails.linkedin, type: 'link', onChange: (v: string) => updateField('personalDetails', null, 'linkedin', v), className: "p-0 underline" })}</span>
                        )}
                    </div>
                </header>

                {/* MAIN BODY */}
                <main className="resume-main">

                    {/* Professional Summary */}
                    {hasContent(resumeData.objective) && (
                        <section className="resume-summary">
                            <h2>Summary</h2>
                            <div className="text-sm text-gray-800 leading-relaxed text-justify">
                                {renderInput({
                                    value: resumeData.objective,
                                    multiline: true,
                                    onChange: (v: string) => updateField('objective', null, 'objective', v)
                                })}
                            </div>
                        </section>
                    )}

                    {/* Experience */}
                    {hasContent(resumeData.workExperience) && (
                        <section className="resume-experience">
                            <h2>Professional Experience</h2>
                            <div className="space-y-6">
                                {resumeData.workExperience.map((exp, i) => (
                                    <article key={i} className="work-item">
                                        <div className="item-header">
                                            <h3 className="text-base">{renderInput({ value: exp.companyName, onChange: (v: string) => updateField('workExperience', i, 'companyName', v) })}</h3>
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap shrink-0">
                                                {renderInput({ value: exp.startDate, skipMarkdown: true, onChange: (v: string) => updateField('workExperience', i, 'startDate', v) })}
                                                <span className="mx-1 opacity-50">—</span>
                                                {renderInput({ value: exp.endDate, skipMarkdown: true, onChange: (v: string) => updateField('workExperience', i, 'endDate', v) })}
                                            </span>
                                        </div>
                                        <div className="item-sub">
                                            <span className="font-bold text-slate-900">{renderInput({ value: exp.jobTitle, onChange: (v: string) => updateField('workExperience', i, 'jobTitle', v) })}</span>
                                            <span className="text-xs font-medium uppercase">{renderInput({ value: exp.location, onChange: (v: string) => updateField('workExperience', i, 'location', v) })}</span>
                                        </div>
                                        <div className="text-sm text-gray-800 pl-1 mt-1">
                                            {renderInput({
                                                value: exp.description,
                                                multiline: true,
                                                forceBullets: true,
                                                onChange: (v: string) => updateField('workExperience', i, 'description', v)
                                            })}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects */}
                    {hasContent(resumeData.projects) && (
                        <section className="resume-projects">
                            <h2>Key Projects</h2>
                            <div className="space-y-4">
                                {resumeData.projects.map((proj, i) => (
                                    <article key={i} className="project-item">
                                        <div className="item-header">
                                            <h3 className="text-base">{renderInput({ value: proj.projectName, onChange: (v: string) => updateField('projects', i, 'projectName', v) })}</h3>
                                            {proj.link && renderInput({ value: proj.link, type: 'link', onChange: (v: string) => updateField('projects', i, 'link', v) })}
                                        </div>
                                        <div className="text-sm text-gray-800 pl-1">
                                            {renderInput({
                                                value: proj.description,
                                                multiline: true,
                                                forceBullets: true,
                                                onChange: (v: string) => updateField('projects', i, 'description', v)
                                            })}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {hasContent(resumeData.education) && (
                        <section className="resume-education">
                            <h2>Education</h2>
                            <div className="space-y-3">
                                {resumeData.education.map((edu, i) => (
                                    <article key={i} className="education-item">
                                        {/* PRIMARY ROW: Degree | Institution ......... Date */}
                                        <div className="item-header flex flex-row items-baseline justify-between w-full">

                                            {/* LEFT GROUP: Degree + Separator + Institution */}
                                            <div className="flex flex-row items-baseline gap-2 flex-wrap pr-4">
                                                {/* 1. Degree (Black/Bold) */}
                                                <span className="font-black text-gray-900 leading-tight  tracking-tight">
                                                    {renderInput({ value: edu.degree, onChange: (v: string) => updateField('education', i, 'degree', v) })}
                                                </span>




                                                {/* 3. Institution (Accent Color) */}
                                                <span className="font text-accent">
                                                    {renderInput({ value: edu.institution, onChange: (v: string) => updateField('education', i, 'institution', v) })}
                                                </span>
                                            </div>

                                            {/* RIGHT GROUP: Date Range */}
                                            <span className="text-sm font-bold text-slate-400 whitespace-nowrap shrink-0">
                                                {renderInput({ value: edu.startDate, skipMarkdown: true, onChange: (v: string) => updateField('education', i, 'startDate', v) })}
                                                <span className="mx-1 opacity-50">—</span>
                                                {renderInput({ value: edu.endDate, skipMarkdown: true, onChange: (v: string) => updateField('education', i, 'endDate', v) })}
                                            </span>
                                        </div>

                                        {/* SECONDARY ROW: Location (Optional, keeps main line clean) */}
                                        {edu.location && (
                                            <div className="text-xs text-slate-500 italic mt-0.5">
                                                {renderInput({ value: edu.location, onChange: (v: string) => updateField('education', i, 'location', v) })}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}


                    {/* Skills, Languages, Certs (for non-sidebar templates) */}
                    {(template === 'professional' || template === 'minimal') && (
                        <div className="grid grid-cols-1 gap-6 mt-4">
                            {hasContent(resumeData.skills) && (
                                <section className="resume-skills">
                                    <h2>Technical Skills</h2>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {resumeData.skills.map((skill, i) => (
                                            <div key={i} className="text-sm">
                                                {skill.skillType === 'individual' ? (
                                                    <div className="flex gap-2 items-center">
                                                        <span className="w-1.5 h-1.5 bg-accent rounded-full mb-0.5"></span>
                                                        {renderInput({ value: skill.skill, onChange: (v: string) => updateField('skills', i, 'skill', v) })}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 items-start">
                                                        <span className="font-bold flex-shrink-0 min-w-[140px] text-slate-900 inline-flex items-center">
                                                            {renderInput({ value: skill.category, onChange: (v: string) => updateField('skills', i, 'category', v), className: "font-bold inline-block" })}
                                                            <span className="ml-[1px]">:</span>
                                                        </span>
                                                        <span className="text-slate-700">{renderInput({ value: skill.skills, onChange: (v: string) => updateField('skills', i, 'skills', v) })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {hasContent(resumeData.languages) && (
                                    <section className="resume-languages">
                                        <h2>Languages</h2>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                            {resumeData.languages.map((lang, i) => (
                                                <div key={i} className="text-sm flex border-b border-slate-100 pb-1 items-center whitespace-nowrap break-inside-avoid">
                                                    <span className="font-bold text-slate-800">{renderInput({ value: lang.language, onChange: (v: string) => updateField('languages', i, 'language', v), className: "p-0", skipMarkdown: true })}</span>
                                                    <span className="text-slate-500 font-medium">-{renderInput({ value: lang.proficiency, onChange: (v: string) => updateField('languages', i, 'proficiency', v), className: "p-0", skipMarkdown: true })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {hasContent(resumeData.certifications) && (
                                    <section className="resume-certifications">
                                        <h2>Certifications</h2>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {resumeData.certifications.map((cert, i) => (
                                                <div key={i} className="text-sm break-inside-avoid">
                                                    <div className="font-bold text-slate-900 leading-snug">{renderInput({ value: cert.certificationName, onChange: (v: string) => updateField('certifications', i, 'certificationName', v) })}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{renderInput({ value: cert.issuingOrganization, onChange: (v: string) => updateField('certifications', i, 'issuingOrganization', v) })}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div >
    );
}
