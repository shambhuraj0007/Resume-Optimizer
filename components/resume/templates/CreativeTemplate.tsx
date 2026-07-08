"use client";
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import DOMPurify from 'isomorphic-dompurify';
import { Open_Sans } from 'next/font/google';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
});

import memoizeOne from 'memoize-one';

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

export function CreativeTemplate({ resumeData, isEditing, updateField }: TemplateProps) {


  const renderInput = useCallback(
    ({ value, onChange, multiline = false, className = '', type = '', ariaLabel = '', skipMarkdown = false }: any) => {
      if (!isEditing) {
        if (type === 'link' || type === 'mail' || type === 'phone') {
          const href = type === 'mail' ? `mailto:${value}` : type === 'phone' ? `tel:${value}` : value;
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${className}`}
              aria-label={ariaLabel}
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {value}
            </a>
          );
        }
        if (skipMarkdown) return <span className={className}>{value}</span>;
        return <span className={className} dangerouslySetInnerHTML={{ __html: processMarkdown(value) }} />;
      }
      return multiline ? (
        <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className={`w-full min-h-[50px] text-[10pt] ${className}`} aria-label={ariaLabel} />
      ) : (
        <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={`h-8 text-[10pt] focus-visible:ring-2 ${className}`} aria-label={ariaLabel} />
      );
    },
    [isEditing]
  );

  const hasContent = (section: any) => {
    if (!section) return false;
    if (Array.isArray(section)) return section.length > 0;
    return typeof section === 'string' ? section.trim() !== '' : true;
  };

  return (
    <div className={`resume-page creative-template w-full bg-white ${openSans.className}`} style={{ minHeight: 'auto' }}>

      {/* ✅ HEADER - Full Width at Top */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-10 py-10 page-break-inside-avoid print:shadow-none">
        <div className="flex items-end gap-4 max-w-5xl mx-auto">

          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight mb-0.5 leading-none">
              {renderInput({ value: resumeData.personalDetails.fullName, onChange: (v: string) => updateField('personalDetails', null, 'fullName', v), className: "bg-transparent text-white font-black p-0" })}
            </h1>
            <p className="text-lg font-medium text-purple-100/90 leading-tight">
              {renderInput({ value: resumeData.jobTitle, onChange: (v: string) => updateField('jobTitle', null, 'jobTitle', v), className: "bg-transparent text-purple-100 p-0" })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[9pt] text-white/90 font-medium max-w-5xl mx-auto pt-4">
          {resumeData.personalDetails.email && <span className="flex items-center gap-1">📧 {renderInput({ value: resumeData.personalDetails.email, type: 'mail', className: "text-white underline decoration-white/30 p-0" })}</span>}
          {resumeData.personalDetails.phone && <span className="flex items-center gap-1">📞 {renderInput({ value: resumeData.personalDetails.phone, type: 'phone', className: "text-white p-0" })}</span>}
          {resumeData.personalDetails.location && <span className="flex items-center gap-1">📍 {renderInput({ value: resumeData.personalDetails.location, className: "text-white p-0" })}</span>}
          {resumeData.personalDetails.linkedin && <span className="flex items-center gap-1">💼 {renderInput({ value: resumeData.personalDetails.linkedin, type: 'link', className: "text-white underline decoration-white/30 p-0" })}</span>}
          {resumeData.personalDetails.github && <span className="flex items-center gap-1">💻 {renderInput({ value: resumeData.personalDetails.github, type: 'link', className: "text-white underline decoration-white/30 p-0" })}</span>}
        </div>
      </div>

      <div className="grid grid-cols-[33%_67%] gap-0">
        {/* ✅ LEFT SIDEBAR - Blue Column */}
        <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-800 text-white pt-6 pb-4 px-6 space-y-8">

          {/* SKILLS SECTION */}
          {hasContent(resumeData.skills) && (
            <section className="page-break-inside-avoid">
              <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-1">
                <h3 className="text-[10pt] font-black uppercase tracking-widest text-white">Skills</h3>
              </div>
              <div className="space-y-3">
                {resumeData.skills.map((skill: any, i: number) => (
                  <div key={i} className="text-[9pt] leading-tight">
                    {skill.skillType === 'individual' ? (
                      <span className="inline-block bg-white/20 text-white px-2 py-1 rounded text-[8pt] font-semibold border border-white/30 mb-1.5 mr-1.5">
                        {renderInput({ value: skill.skill, p: 0 })}
                      </span>
                    ) : (
                      <div className="leading-relaxed mb-1">
                        <span className="font-bold text-white block text-[8.5pt]">{skill.category}</span>
                        <span className="text-white/85 text-[8.5pt] block">{skill.skills}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CERTIFICATIONS SECTION */}
          {hasContent(resumeData.certifications) && (
            <section className="page-break-inside-avoid">
              <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-1">
                <h3 className="text-[10pt] font-black uppercase tracking-widest text-white">Certifications</h3>
              </div>
              <div className="space-y-2">
                {resumeData.certifications.map((cert: any, i: number) => (
                  <div key={i} className="text-[9pt] leading-relaxed border-b border-white/10 pb-2 last:border-0">
                    <span className="font-semibold text-white block">{cert.certificationName}</span>
                    <span className="text-white/70 text-[8pt]">{cert.issueDate}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LANGUAGES SECTION */}
          {hasContent(resumeData.languages) && (
            <section className="page-break-inside-avoid">
              <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-1">
                <h3 className="text-[10pt] font-black uppercase tracking-widest text-white">Languages</h3>
              </div>
              <div className="space-y-2">
                {resumeData.languages.map((lang: any, i: number) => (
                  <div key={i} className="text-[10pt] flex items-center whitespace-nowrap leading-none">
                    <span className="font-black text-white uppercase tracking-tight">{renderInput({ value: lang.language, className: "p-0", skipMarkdown: true })}</span>
                    <span className="text-white font-medium">-{renderInput({ value: lang.proficiency, className: "p-0", skipMarkdown: true })}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ✅ RIGHT CONTENT COLUMN */}
        <div className="bg-white px-10 pt-6 pb-10">
          {/* ✅ SUMMARY */}
          {hasContent(resumeData.objective) && (
            <section className="mb-6 page-break-inside-avoid">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-purple-600 rounded-sm"></div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">About Me</h2>
              </div>
              <div className="text-gray-800 text-justify leading-relaxed pl-3 border-l-2 border-purple-50">
                {renderInput({ value: resumeData.objective, multiline: true, onChange: (v: string) => updateField('objective', null, 'objective', v) })}
              </div>
            </section>
          )}

          {/* ✅ EXPERIENCE */}
          {hasContent(resumeData.workExperience) && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-purple-600 rounded-sm"></div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Experience</h2>
              </div>
              <div className="space-y-6 pl-3 border-l-2 border-gray-100 ml-1.5">
                {resumeData.workExperience.map((exp: any, i: number) => (
                  <article key={i} className="relative pl-5 work-item">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 bg-white border-[2.5px] border-purple-600 rounded-full z-10"></div>
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <div className="flex-1">
                        <h3 className="text-[11pt] font-bold text-gray-900 leading-tight">{renderInput({ value: exp.jobTitle })}</h3>
                        <div className="text-purple-700 font-semibold text-[9.5pt]">{exp.companyName} {exp.location && `| ${exp.location}`}</div>
                      </div>
                      <div className="text-[9pt] text-gray-500 font-medium whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">
                        {exp.startDate} - {exp.endDate}
                      </div>
                    </div>
                    <div className="text-gray-700 mt-1 text-[9.5pt]">
                      {renderInput({ value: exp.description, multiline: true })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ✅ PROJECTS */}
          {hasContent(resumeData.projects) && (
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-purple-600 rounded-sm"></div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Projects</h2>
              </div>
              <div className="space-y-4 pl-3 border-l-2 border-gray-100 ml-1.5">
                {resumeData.projects.map((proj: any, i: number) => (
                  <article key={i} className="relative pl-5 project-item">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 bg-white border-[2.5px] border-purple-400 rounded-full z-10"></div>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="text-[10.5pt] font-bold text-gray-900">{renderInput({ value: proj.projectName })}</h3>
                      {proj.link && <span className="text-[9pt]">{renderInput({ value: proj.link, type: 'link', className: "text-purple-600" })}</span>}
                    </div>
                    <div className="text-gray-700 text-[9.5pt]">
                      {renderInput({ value: proj.description, multiline: true })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ✅ EDUCATION */}
          {hasContent(resumeData.education) && (
            <section className="mb-6 page-break-inside-avoid">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-purple-600 rounded-sm"></div>
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Education</h2>
              </div>
              <div className="space-y-3 pl-3">
                {resumeData.education.map((edu: any, i: number) => (
                  <article key={i} className="bg-gray-50 px-3 py-2 rounded border border-gray-100/80 education-item">
                    <div className="flex justify-between font-bold text-gray-900 text-[10pt]">
                      <h3>{edu.degree}</h3>
                      <span className="text-[9pt] text-gray-500 font-normal">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <div className="text-purple-700 font-medium text-[9.5pt]">{edu.institution} {edu.location && `| ${edu.location}`}</div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <style jsx>{`
        .resume-page {
          min-height: auto !important;
        }

        /* Ensure content renders ABOVE watermark */
        .resume-page > *:not(.bg-watermark):not(.pro-badge) {
          position: relative !important;
          z-index: 10 !important;
        }

        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
        
        .resume-page, .resume-page * {
          box-sizing: border-box;
        }

        @media print {
          .resume-page {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}