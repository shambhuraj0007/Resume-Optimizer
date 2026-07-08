"use client";
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { TemplateProps } from './types';
import { Textarea } from '@/components/ui/textarea';
import DOMPurify from 'isomorphic-dompurify';
import { Inter } from 'next/font/google';

const inter = Inter({
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

export function MinimalTemplate({ resumeData, isEditing, updateField }: TemplateProps) {




  const renderInput = useCallback(
    ({ value, onChange, multiline = false, className = '', type = '', ariaLabel = '' }: any) => {
      if (!isEditing) {
        if (type === 'link' || type === 'mail' || type === 'phone') {
          const href = type === 'mail' ? `mailto:${value}` : type === 'phone' ? `tel:${value}` : value;
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`transition-colors ${className}`} style={{ wordBreak: 'break-word' }}>
              {value}
            </a>
          );
        }
        // The original line 66 '}' is removed here.
        // The following line is added as per the provided 'Code Edit' context.
        if (type === 'text') return <span className={className}>{value}</span>;
        return <span className={className} dangerouslySetInnerHTML={{ __html: processMarkdown(value) }} />;
      } // This closing brace now correctly closes the 'if (!isEditing)' block.
      return multiline ? (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-h-[60px] text-[10.5pt] ${className}`}
          aria-label={ariaLabel}
        />
      ) : (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`h-8 text-[10.5pt] focus-visible:ring-2 ${className}`}
          aria-label={ariaLabel}
        />
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
    <div className="resume-page minimal-template">
      <div className={`mx-auto w-full ${inter.className}`}>

        {/* ✅ HEADER SECTION */}


        {/* ✅ SUMMARY SECTION - No margin-top here */}
        {hasContent(resumeData.objective) && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-[12pt] font-bold text-[#1e40af] uppercase tracking-wide">Professional Summary</h2>
              <div className="flex-1 h-[1px] bg-[#1e40af]/20"></div>
            </div>
            <div className="text-gray-800 text-justify">
              {renderInput({
                value: resumeData.objective,
                multiline: true,
                onChange: (v: string) => updateField('objective', null, 'objective', v)
              })}
            </div>
          </section>
        )}

        {/* ✅ WORK EXPERIENCE */}
        {hasContent(resumeData.workExperience) && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[12pt] font-bold text-[#1e40af] uppercase tracking-wide">Work Experience</h2>
              <div className="flex-1 h-[1px] bg-[#1e40af]/20"></div>
            </div>
            <div className="space-y-4">
              {resumeData.workExperience.map((exp: any, i: number) => (
                <article key={i} className="work-item">
                  <div className="flex justify-between items-baseline font-bold text-[#0f172a]">
                    <h3 className="text-[11pt]">{renderInput({ value: exp.jobTitle, onChange: (v: string) => updateField('workExperience', i, 'jobTitle', v) })}</h3>
                    <span className="text-[9.5pt] text-gray-600">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-[#1e40af] font-semibold text-[10pt] mb-1">
                    {exp.companyName} {exp.location && `| ${exp.location}`}
                  </div>
                  <div className="text-gray-700">
                    {renderInput({
                      value: exp.description,
                      multiline: true,
                      onChange: (v: string) => updateField('workExperience', i, 'description', v)
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ✅ EDUCATION */}
        {hasContent(resumeData.education) && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[12pt] font-bold text-[#1e40af] uppercase tracking-wide">Education</h2>
              <div className="flex-1 h-[1px] bg-[#1e40af]/20"></div>
            </div>
            <div className="space-y-3">
              {resumeData.education.map((edu: any, i: number) => (
                <article key={i} className="education-item">
                  <div className="flex justify-between items-baseline font-bold text-[#0f172a]">
                    <h3 className="text-[11pt]">{edu.degree}</h3>
                    <span className="text-[9.5pt] text-gray-600">{edu.endDate}</span>
                  </div>
                  <div className="text-[#1e40af] font-medium">{edu.institution} {edu.location && `| ${edu.location}`}</div>
                  {edu.description && <div className="text-gray-600 text-[9.5pt] italic mt-0.5">{edu.description}</div>}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ✅ SKILLS SECTION */}
        {hasContent(resumeData.skills) && (
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[12pt] font-bold text-[#1e40af] uppercase tracking-wide">Technical Skills</h2>
              <div className="flex-1 h-[1px] bg-[#1e40af]/20"></div>
            </div>
            <div className="grid grid-cols-1 gap-y-1">
              {resumeData.skills.map((skill: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="font-bold text-[#0f172a] min-w-[100px]">{skill.category}:</span>
                  <span className="text-gray-700">{skill.skills}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
