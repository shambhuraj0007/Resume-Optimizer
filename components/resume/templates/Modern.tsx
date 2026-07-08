"use client";
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';
import memoizeOne from 'memoize-one';

import DOMPurify from 'isomorphic-dompurify';

const processMarkdown = memoizeOne((text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  let inList = false;
  let html = '';

  lines.forEach((line) => {
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const trimmedLine = line.trim();
    const isBullet = trimmedLine.startsWith('- ') ||
      trimmedLine.startsWith('* ') ||
      trimmedLine.startsWith('• ');

    if (isBullet) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      const content = trimmedLine.replace(/^[-*•]\s+/, '');
      html += `<li>${content}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line.trim()) {
        html += `<p>${line.trim()}</p>`;
      }
    }
  });

  if (inList) html += '</ul>';

  return DOMPurify.sanitize(html);
});

export function ModernTemplate({
  resumeData,
  isEditing,
  updateField,
  isPaidUser = false
}: TemplateProps & { isPaidUser?: boolean }) {


  const renderInput = useCallback(
    ({
      value,
      onChange,
      multiline = false,
      className = '',
      type = '',
      ariaLabel = '',
      skipMarkdown = false,
    }: {
      value: string;
      onChange: (value: string) => void;
      multiline?: boolean;
      className?: string;
      type?: string;
      ariaLabel?: string;
      skipMarkdown?: boolean;
    }) => {
      if (!isEditing) {
        if (type === 'link') {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-600 hover:underline ${className}`}
              aria-label={ariaLabel}
              style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
            >
              {value}
            </a>
          );
        }
        if (type === 'mail') {
          return (
            <a
              href={`mailto:${value}`}
              className={`hover:underline ${className}`}
              aria-label={ariaLabel}
              style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
            >
              {value}
            </a>
          );
        }
        if (type === 'phone') {
          return (
            <a href={`tel:${value}`} className={`hover:underline ${className}`} aria-label={ariaLabel}>
              {value}
            </a>
          );
        }
        if (skipMarkdown) return <span className={className}>{value}</span>;
        return <span className={className} dangerouslySetInnerHTML={{ __html: processMarkdown(value) }} />;
      }

      if (multiline) {
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-h-[60px] ${className}`}
            aria-label={ariaLabel}
          />
        );
      }

      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`focus-visible:ring-2 ${className}`}
          aria-label={ariaLabel}
        />
      );
    },
    [isEditing]
  );

  const hasContent = useCallback((section: unknown): boolean => {
    if (!section) return false;
    if (Array.isArray(section)) return section.length > 0;
    if (typeof section === 'object' && section !== null) {
      return Object.values(section).some((value) =>
        typeof value === 'string' ? value.trim() !== '' : Boolean(value)
      );
    }
    return typeof section === 'string' ? section.trim() !== '' : Boolean(section);
  }, []);

  return (

    <div
      className="resume-page modern-template w-full"
      style={{ minHeight: 'auto' }}
      onContextMenu={(e: React.MouseEvent) => !isPaidUser && e.preventDefault()}
      onCopy={(e: React.ClipboardEvent) => !isPaidUser && e.preventDefault()}
      onMouseDown={(e: React.MouseEvent) => !isPaidUser && (e.detail > 1 && e.preventDefault())}
    >
      {!isPaidUser && (
        <>
          {/* BACKGROUND WATERMARK - Impossible to remove */}
          <svg
            className="bg-watermark"
            viewBox="0 0 595 842"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern id="watermark-bg" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                <text
                  x="75" y="75"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Inter, sans-serif"
                  fontWeight="800"
                  fontSize="24"
                  fill="#94a3b8"
                  opacity="0.4"
                  transform="rotate(-25 75 75)"
                >
                  UPGRADE TO PRO
                </text>
              </pattern>
            </defs>
            <rect width="595" height="842" fill="url(#watermark-bg)" />
          </svg>

          {/* FOREGROUND SUBTLE BADGE */}
          <div className="pro-badge">
            <span>PRO</span>
          </div>
        </>
      )}
      {/* ✅ HEADER - Reduced padding */}
      <div className="bg-gray-900 text-white px-8 py-8 no-break">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-1 tracking-tight break-words-force">
            {renderInput({
              value: resumeData.personalDetails.fullName,
              onChange: (value) => updateField('personalDetails', null, 'fullName', value),
              className: 'text-white bg-transparent border-white uppercase p-0',
              ariaLabel: 'Full name',
            })}
          </h1>
          <p className="text-lg text-blue-400 font-semibold mb-4 break-words-force">
            {renderInput({
              value: resumeData.jobTitle,
              onChange: (value) => updateField('jobTitle', null, 'jobTitle', value),
              className: 'text-blue-400 bg-transparent border-blue-400 p-0',
              ariaLabel: 'Job title',
            })}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300 border-t border-gray-800 pt-4">
            {resumeData.personalDetails.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-400" />
                {renderInput({
                  value: resumeData.personalDetails.email,
                  onChange: (value) => updateField('personalDetails', null, 'email', value),
                  type: 'mail',
                  className: 'text-gray-300 p-0',
                  ariaLabel: 'Email',
                })}
              </div>
            )}
            {resumeData.personalDetails.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-400" />
                {renderInput({
                  value: resumeData.personalDetails.phone,
                  onChange: (value) => updateField('personalDetails', null, 'phone', value),
                  type: 'phone',
                  className: 'text-gray-300 p-0',
                  ariaLabel: 'Phone',
                })}
              </div>
            )}
            {resumeData.personalDetails.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                {renderInput({
                  value: resumeData.personalDetails.location,
                  onChange: (value) => updateField('personalDetails', null, 'location', value),
                  className: 'text-gray-300 p-0',
                  ariaLabel: 'Location',
                })}
              </div>
            )}
            {resumeData.personalDetails.linkedin && (
              <div className="flex items-center gap-1.5">
                <Linkedin className="w-4 h-4 text-blue-400" />
                {renderInput({
                  value: resumeData.personalDetails.linkedin,
                  onChange: (value) => updateField('personalDetails', null, 'linkedin', value),
                  type: 'link',
                  className: 'text-gray-300 p-0',
                  ariaLabel: 'LinkedIn',
                })}
              </div>
            )}
            {resumeData.personalDetails.github && (
              <div className="flex items-center gap-1.5">
                <Github className="w-4 h-4 text-blue-400" />
                {renderInput({
                  value: resumeData.personalDetails.github,
                  onChange: (value) => updateField('personalDetails', null, 'github', value),
                  type: 'link',
                  className: 'text-gray-300 p-0',
                  ariaLabel: 'GitHub',
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-[33%_67%] gap-0">
        {/* LEFT SIDEBAR - Reduced padding and spacing */}
        <div className="bg-gray-50 px-4 pt-1 pb-4 space-y-4">
          {/* Contact Info */}
          {/* Contact Info Removed - Moved to Header */}

          {/* Skills */}
          {hasContent(resumeData.skills) && (
            <section aria-labelledby="skills" className="sidebar-section no-break">
              <h2
                id="skills"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Skills
              </h2>
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="text-[10px] leading-snug break-words-force">
                    {skill.skillType === 'individual' ? (
                      renderInput({
                        value: skill.skill,
                        onChange: (value) => updateField('skills', index, 'skill', value),
                        className: 'text-gray-700',
                        ariaLabel: 'Skill',
                      })
                    ) : (
                      <>
                        <div className="font-bold text-gray-900 mb-0.5">
                          {renderInput({
                            value: skill.category,
                            onChange: (value) => updateField('skills', index, 'category', value),
                            ariaLabel: 'Skill category',
                          })}
                        </div>
                        <div className="text-gray-600 leading-snug">
                          {renderInput({
                            value: skill.skills,
                            onChange: (value) => updateField('skills', index, 'skills', value),
                            ariaLabel: 'Skills',
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {hasContent(resumeData.languages) && (
            <section aria-labelledby="languages" className="sidebar-section no-break">
              <h2
                id="languages"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Languages
              </h2>
              <div className="space-y-1">
                {resumeData.languages.map((language, index) => (
                  // Changed to flex container to align items horizontally
                  <div key={index} className="text-[11pt] flex items-center">
                    <span className="font-bold text-gray-900">
                      {renderInput({
                        value: language.language,
                        onChange: (value) => updateField('languages', index, 'language', value),
                        className: "font-bold inline-block p-0 min-w-0 outline-none",
                        ariaLabel: "Language name"
                      })}
                    </span>
                    <span className="text-gray-800 font-medium">
                      -{renderInput({
                        value: language.proficiency,
                        onChange: (value) => updateField('languages', index, 'proficiency', value),
                        className: "inline-block p-0 min-w-0 outline-none",
                        ariaLabel: "Language proficiency"
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </section>

          )}

          {/* Certifications */}
          {hasContent(resumeData.certifications) && (
            <section aria-labelledby="certifications" className="sidebar-section no-break">
              <h2
                id="certifications"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Certifications
              </h2>
              <div className="space-y-2">
                {resumeData.certifications.map((cert, index) => (
                  <div key={index} className="text-[10px]">
                    <div className="font-bold text-gray-900">
                      {renderInput({
                        value: cert.certificationName,
                        onChange: (value) => updateField('certifications', index, 'certificationName', value),
                        ariaLabel: 'Certification name',
                      })}
                    </div>
                    <div className="text-gray-600 text-[9px]">
                      {renderInput({
                        value: cert.issuingOrganization,
                        onChange: (value) => updateField('certifications', index, 'issuingOrganization', value),
                        ariaLabel: 'Issuing organization',
                      })}
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      {renderInput({
                        value: cert.issueDate,
                        onChange: (value) => updateField('certifications', index, 'issueDate', value),
                        ariaLabel: 'Issue date',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN - Reduced padding and spacing */}
        <div className="px-6 pt-1 pb-4 space-y-4">
          {/* Professional Summary */}
          {hasContent(resumeData.objective) && (
            <section aria-labelledby="summary" className="compact-section">
              <h2
                id="summary"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Professional Summary
              </h2>
              <div className="text-[10px] text-gray-700 break-words-force text-justify" style={{ lineHeight: '1.4' }}>
                {renderInput({
                  value: resumeData.objective,
                  onChange: (value) => updateField('objective', null, 'objective', value),
                  multiline: true,
                  className: 'text-[10px]',
                  ariaLabel: 'Professional summary',
                })}
              </div>
            </section>
          )}

          {/* Work Experience */}
          {hasContent(resumeData.workExperience) && (
            <section aria-labelledby="experience" className="compact-section">
              <h2
                id="experience"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Work Experience
              </h2>
              <div className="space-y-2.5">
                {resumeData.workExperience.map((exp, index) => (
                  <article key={index} className="work-item">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <div className="font-bold text-gray-900 text-[11px] flex-1 break-words-force">
                        {renderInput({
                          value: exp.jobTitle,
                          onChange: (value) => updateField('workExperience', index, 'jobTitle', value),
                          ariaLabel: 'Job title',
                        })}
                      </div>
                      <div className="text-[9px] text-gray-600 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                        {renderInput({
                          value: exp.startDate,
                          onChange: (value) => updateField('workExperience', index, 'startDate', value),
                          className: 'w-16 p-0',
                          ariaLabel: 'Start date',
                          skipMarkdown: true,
                        })}
                        <span>—</span>
                        {renderInput({
                          value: exp.endDate,
                          onChange: (value) => updateField('workExperience', index, 'endDate', value),
                          className: 'w-16 p-0',
                          ariaLabel: 'End date',
                          skipMarkdown: true,
                        })}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-700 mb-1 italic break-words-force">
                      {renderInput({
                        value: exp.companyName,
                        onChange: (value) => updateField('workExperience', index, 'companyName', value),
                        ariaLabel: 'Company name',
                      })}
                      {exp.location && (
                        <>
                          <span className="mx-1">•</span>
                          {renderInput({
                            value: exp.location,
                            onChange: (value) => updateField('workExperience', index, 'location', value),
                            className: 'inline-block',
                            ariaLabel: 'Location',
                          })}
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-600 break-words-force text-justify" style={{ lineHeight: '1.4' }}>
                      {renderInput({
                        value: exp.description,
                        onChange: (value) => updateField('workExperience', index, 'description', value),
                        multiline: true,
                        className: 'text-[10px]',
                        ariaLabel: 'Job description',
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {hasContent(resumeData.education) && (
            <section aria-labelledby="education" className="compact-section">
              <h2
                id="education"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Education
              </h2>
              <div className="space-y-2.5">
                {resumeData.education.map((edu, index) => (
                  <article key={index} className="education-item">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <div className="font-bold text-gray-900 text-[11px] flex-1 break-words-force">
                        {renderInput({
                          value: edu.degree,
                          onChange: (value) => updateField('education', index, 'degree', value),
                          ariaLabel: 'Degree',
                        })}
                      </div>
                      <div className="text-[9px] text-gray-600 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                        {renderInput({
                          value: edu.startDate,
                          onChange: (value) => updateField('education', index, 'startDate', value),
                          className: 'w-16 p-0',
                          ariaLabel: 'Start date',
                          skipMarkdown: true,
                        })}
                        <span>—</span>
                        {renderInput({
                          value: edu.endDate,
                          onChange: (value) => updateField('education', index, 'endDate', value),
                          className: 'w-16 p-0',
                          ariaLabel: 'End date',
                          skipMarkdown: true,
                        })}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-700 italic break-words-force">
                      {renderInput({
                        value: edu.institution,
                        onChange: (value) => updateField('education', index, 'institution', value),
                        ariaLabel: 'Institution',
                      })}
                      {edu.location && (
                        <>
                          <span className="mx-1">•</span>
                          {renderInput({
                            value: edu.location,
                            onChange: (value) => updateField('education', index, 'location', value),
                            className: 'inline-block',
                            ariaLabel: 'Location',
                          })}
                        </>
                      )}
                    </div>
                    {edu.description && (
                      <div className="text-[10px] text-gray-600 mt-1 break-words-force text-justify">
                        {renderInput({
                          value: edu.description,
                          onChange: (value) => updateField('education', index, 'description', value),
                          ariaLabel: 'Description',
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {hasContent(resumeData.projects) && (
            <section aria-labelledby="projects" className="compact-section">
              <h2
                id="projects"
                className="text-[11px] font-bold text-gray-900 mb-2 pb-1 border-b-2 border-gray-800 uppercase tracking-wide"
              >
                Projects
              </h2>
              <div className="space-y-2.5">
                {resumeData.projects.map((project, index) => (
                  <article key={index} className="project-item">
                    <div className="font-bold text-gray-900 mb-0.5 text-[11px] break-words-force">
                      {renderInput({
                        value: project.projectName,
                        onChange: (value) => updateField('projects', index, 'projectName', value),
                        ariaLabel: 'Project name',
                      })}
                    </div>
                    {project.link && (
                      <div className="text-[10px] text-blue-600 mb-1 break-words-force">
                        {renderInput({
                          value: project.link,
                          onChange: (value) => updateField('projects', index, 'link', value),
                          type: 'link',
                          ariaLabel: 'Project link',
                        })}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-600 break-words-force text-justify" style={{ lineHeight: '1.4' }}>
                      {renderInput({
                        value: project.description,
                        onChange: (value) => updateField('projects', index, 'description', value),
                        multiline: true,
                        className: 'text-[10px]',
                        ariaLabel: 'Project description',
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <style jsx>{`
        /* WATERMARK - UNREMOVABLE */
        .bg-watermark {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1 !important;
          pointer-events: none !important;
          display: block !important;
          visibility: visible !important;
          opacity: 0.85 !important;
        }

        .pro-badge {
          position: absolute !important;
          top: 24px !important;
          right: 24px !important;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          color: white !important;
          padding: 6px 12px !important;
          border-radius: 20px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
          z-index: 999 !important;
          letter-spacing: 0.5px !important;
          transform: rotate(-8deg) !important;
          pointer-events: none !important;
          display: block !important;
          visibility: visible !important;
        }

        @media print {
          .bg-watermark, .pro-badge {
            display: block !important;
            visibility: visible !important;
            opacity: 0.85 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        ${!isPaidUser ? `
        .resume-page, .resume-page * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        ` : ''}

        /* Ensure content renders ABOVE watermark */
        .resume-page > *:not(.bg-watermark):not(.pro-badge) {
          position: relative !important;
          z-index: 10 !important;
        }

        .no-break {
          page-break-inside: avoid;
        }
      `}</style>
    </div>
  );
}
