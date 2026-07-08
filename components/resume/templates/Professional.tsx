"use client";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import type { TemplateProps } from "./types";
import { Textarea } from "@/components/ui/textarea";
import DOMPurify from "isomorphic-dompurify";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

import memoizeOne from 'memoize-one';

const processMarkdown = memoizeOne((text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  let inList = false;
  let html = '';

  lines.forEach((line) => {
    // Bold syntax
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const trimmedLine = line.trim();
    const isBullet = trimmedLine.startsWith('- ') ||
      trimmedLine.startsWith('* ') ||
      trimmedLine.startsWith('• ');

    if (isBullet) {
      if (!inList) {
        html += '<ul>'; // Start a standard unordered list
        inList = true;
      }
      const content = trimmedLine.replace(/^[-*•]\s+/, '');
      html += `<li>${content}</li>`;
    } else {
      if (inList) {
        html += '</ul>'; // Close list if we hit a non-bullet line
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

export function ProfessionalTemplate({
  resumeData,
  isEditing,
  updateField,
}: TemplateProps) {



  // --- HELPER: Render Input Fields for Editing ---
  const renderInput = useCallback(
    ({ value, onChange, multiline = false, className = "", type = "", ariaLabel = "", skipMarkdown = false }: any) => {
      if (!isEditing) {
        // PREVIEW MODE: Plain Text or Links
        if (type === "link") {
          return <a href={value} target="_blank" rel="noopener" className={`text-blue-700 hover:underline ${className}`}>{value}</a>;
        }
        if (type === "mail") {
          return <a href={`mailto:${value}`} className={`text-blue-700 hover:underline ${className}`}>{value}</a>;
        }
        if (type === "phone") {
          return <a href={`tel:${value}`} className={`text-blue-700 hover:underline ${className}`}>{value}</a>;
        }
        if (skipMarkdown) return <span className={className}>{value}</span>;
        // Rich Text Content
        return <span className={className} dangerouslySetInnerHTML={{ __html: processMarkdown(value) }} />;
      }

      // EDIT MODE: Inputs
      if (multiline) {
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-h-[50px] border-gray-300 focus:ring-blue-500 ${className}`}
            aria-label={ariaLabel}
          />
        );
      }
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`border-gray-300 focus:ring-blue-500 ${className}`}
          aria-label={ariaLabel}
        />
      );
    },
    [isEditing]
  );

  const hasContent = (section: any) => {
    if (!section) return false;
    if (Array.isArray(section)) return section.length > 0;
    return typeof section === "string" ? section.trim() !== "" : Boolean(section);
  };

  return (
    // 'resume-page' class triggers the PrintPerfect.css margins
    <div className={`resume-page professional-template ${roboto.className}`}>

      {/* --- HEADER --- */}
      <header className="mb-2 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide mb-2 text-gray-900">
          {renderInput({
            value: resumeData.personalDetails.fullName,
            onChange: (v: string) => updateField("personalDetails", null, "fullName", v),
            className: "text-center font-bold uppercase"
          })}
        </h1>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-700 font-medium">
          {resumeData.personalDetails.location && (
            <span>{renderInput({ value: resumeData.personalDetails.location, onChange: (v: string) => updateField("personalDetails", null, "location", v) })}</span>
          )}
          {resumeData.personalDetails.phone && (
            <>
              <span className="text-gray-400">•</span>
              <span>{renderInput({ value: resumeData.personalDetails.phone, type: "phone", onChange: (v: string) => updateField("personalDetails", null, "phone", v) })}</span>
            </>
          )}
          {resumeData.personalDetails.email && (
            <>
              <span className="text-gray-400">•</span>
              <span>{renderInput({ value: resumeData.personalDetails.email, type: "mail", onChange: (v: string) => updateField("personalDetails", null, "email", v) })}</span>
            </>
          )}
          {resumeData.personalDetails.linkedin && (
            <>
              <span className="text-gray-400">•</span>
              <span>{renderInput({ value: resumeData.personalDetails.linkedin, type: "link", onChange: (v: string) => updateField("personalDetails", null, "linkedin", v) })}</span>
            </>
          )}
        </div>
      </header>

      {/* --- PROFESSIONAL SUMMARY --- */}
      {hasContent(resumeData.objective) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-2 tracking-wider text-gray-800">Professional Summary</h2>
          <div className="text-sm text-gray-800 leading-relaxed text-justify">
            {renderInput({
              value: resumeData.objective,
              multiline: true,
              onChange: (v: string) => updateField("objective", null, "objective", v)
            })}
          </div>
        </section>
      )}

      {/* --- EXPERIENCE --- */}
      {hasContent(resumeData.workExperience) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-3 tracking-wider text-gray-800">Professional Experience</h2>

          <div className="space-y-4">
            {resumeData.workExperience.map((job: any, i: number) => (
              // 'work-item' class prevents page breaks inside a job block
              <article key={i} className="work-item">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900 text-base">
                    {renderInput({ value: job.companyName, onChange: (v: string) => updateField("workExperience", i, "companyName", v) })}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                    {renderInput({ value: job.location, onChange: (v: string) => updateField("workExperience", i, "location", v) })}
                  </span>
                </div>

                <div className="flex justify-between items-baseline mb-2">
                  <div className="italic text-gray-800 text-sm font-semibold">
                    {renderInput({ value: job.jobTitle, onChange: (v: string) => updateField("workExperience", i, "jobTitle", v) })}
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap shrink-0">
                    {renderInput({ value: job.startDate, skipMarkdown: true, onChange: (v: string) => updateField("workExperience", i, "startDate", v), className: "w-20 inline-block p-0" })}
                    <span className="mx-1">–</span>
                    {renderInput({ value: job.endDate, skipMarkdown: true, onChange: (v: string) => updateField("workExperience", i, "endDate", v), className: "w-20 inline-block p-0" })}
                  </div>
                </div>

                {/* 
                   CRITICAL FOR ATS: 
                   This renders standard <ul><li> tags which PrintPerfect.css 
                   automatically styles with bullets.
                */}
                <div className="text-sm text-gray-800 pl-2">
                  {renderInput({
                    value: job.description,
                    multiline: true,
                    onChange: (v: string) => updateField("workExperience", i, "description", v)
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* --- EDUCATION --- */}
      {hasContent(resumeData.education) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-3 tracking-wider text-gray-800">Education</h2>

          <div className="space-y-3">
            {resumeData.education.map((edu: any, i: number) => (
              <article key={i} className="education-item">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">
                    {renderInput({ value: edu.institution, onChange: (v: string) => updateField("education", i, "institution", v) })}
                  </h3>
                  <span className="text-sm text-gray-600 shrink-0 whitespace-nowrap">
                    {renderInput({ value: edu.startDate, skipMarkdown: true, onChange: (v: string) => updateField("education", i, "startDate", v), className: "w-16 inline-block p-0" })}
                    <span className="mx-1">–</span>
                    {renderInput({ value: edu.endDate, skipMarkdown: true, onChange: (v: string) => updateField("education", i, "endDate", v), className: "w-16 inline-block p-0" })}
                  </span>
                </div>
                <div className="text-sm text-gray-800">
                  {renderInput({ value: edu.degree, onChange: (v: string) => updateField("education", i, "degree", v) })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* --- SKILLS --- */}
      {hasContent(resumeData.skills) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-2 tracking-wider text-gray-800">Technical Skills</h2>
          <div className="text-sm text-gray-800 space-y-1">
            {resumeData.skills.map((skill: any, i: number) => (
              <div key={i} className="flex">
                <span className="font-bold w-32 flex-shrink-0">
                  {renderInput({ value: skill.category, onChange: (v: string) => updateField("skills", i, "category", v) })}:
                </span>
                <span className="flex-1">
                  {renderInput({ value: skill.skills, onChange: (v: string) => updateField("skills", i, "skills", v) })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- PROJECTS --- */}
      {hasContent(resumeData.projects) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 mb-3 tracking-wider text-gray-800">Projects</h2>
          <div className="space-y-3">
            {resumeData.projects.map((proj: any, i: number) => (
              <article key={i} className="project-item">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900">
                    {renderInput({ value: proj.projectName, onChange: (v: string) => updateField("projects", i, "projectName", v) })}
                  </h3>
                  {proj.link && (
                    <span className="text-xs">
                      {renderInput({ value: proj.link, type: "link", onChange: (v: string) => updateField("projects", i, "link", v) })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-800 pl-2">
                  {renderInput({
                    value: proj.description,
                    multiline: true,
                    onChange: (v: string) => updateField("projects", i, "description", v)
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
