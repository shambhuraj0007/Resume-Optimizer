import { ResumeData } from '@/components/resume/templates/types';

export function mapToJsonResume(resume: ResumeData) {
    return {
        basics: {
            name: resume.personalDetails.fullName,
            label: resume.jobTitle,
            email: resume.personalDetails.email,
            phone: resume.personalDetails.phone,
            url: resume.personalDetails.website,
            summary: resume.objective,
            location: {
                address: resume.personalDetails.location || '',
            },
            profiles: [
                ...(resume.personalDetails.linkedin
                    ? [
                        {
                            network: 'LinkedIn',
                            username: resume.personalDetails.linkedin.split('/').pop() || '',
                            url: resume.personalDetails.linkedin,
                        },
                    ]
                    : []),
                ...(resume.personalDetails.github
                    ? [
                        {
                            network: 'GitHub',
                            username: resume.personalDetails.github.split('/').pop() || '',
                            url: resume.personalDetails.github,
                        },
                    ]
                    : []),
            ],
        },
        work: resume.workExperience.map((exp) => ({
            name: exp.companyName,
            position: exp.jobTitle,
            startDate: exp.startDate,
            endDate: exp.endDate,
            summary: exp.description,
            location: exp.location,
            highlights: exp.description ? [exp.description] : [],
        })),
        education: resume.education.map((edu) => ({
            institution: edu.institution,
            studyType: edu.degree,
            area: edu.degree,
            startDate: edu.startDate,
            endDate: edu.endDate,
        })),
        skills: resume.skills.map((skill) => ({
            name: skill.category || 'Skills',
            keywords: (skill.skills?.split(',') || []).map((s) => s.trim()),
        })),
        projects: resume.projects.map((proj) => ({
            name: proj.projectName,
            description: proj.description,
            url: proj.link,
            keywords: [],
        })),
        languages: resume.languages.map((lang) => ({
            language: lang.language,
            fluency: lang.proficiency,
        })),
        certificates: resume.certifications.map((cert) => ({
            name: cert.certificationName,
            date: cert.issueDate,
            issuer: cert.issuingOrganization,
        })),
    };
}
