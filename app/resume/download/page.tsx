"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UniversalResume } from '@/components/resume/UniversalResume';
import { DM_Sans, Roboto, Lato, Open_Sans, Inter } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-dm-sans', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto', display: 'swap' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-open-sans', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-inter', display: 'swap' });

const DownloadPage = () => {
  const searchParams = useSearchParams();
  const [resumeData, setResumeData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isWatermarked, setIsWatermarked] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check for data already injected in window (Puppeteer direct injection)
    if ((window as any).__RESUME_DATA__) {
      const payload = (window as any).__RESUME_DATA__;
      applyPayload(payload);
      return;
    }

    // 2. Listen for custom event
    const handleDataReady = (e: any) => {
      applyPayload(e.detail);
    };
    window.addEventListener('resumeDataReady', handleDataReady);

    // 3. Fallback to query parameters
    const data = searchParams.get('data');
    const template = searchParams.get('template');
    if (data && template) {
      applyPayload({
        data: JSON.parse(data),
        template,
        watermark: searchParams.get('watermark') === 'true',
      });
    }

    return () => window.removeEventListener('resumeDataReady', handleDataReady);
  }, [searchParams]);

  const applyPayload = (payload: any) => {
    const { data, template, watermark } = payload;
    if (data) setResumeData(typeof data === 'string' ? JSON.parse(data) : data);
    if (template) setSelectedTemplate(template);
    setIsWatermarked(watermark === true);
  };

  if (!resumeData || !selectedTemplate) {
    return <div style={{ background: 'white', height: '100vh', width: '100vw' }}>Loading...</div>;
  }

  return (
    <div className={`download-root ${dmSans.variable} ${roboto.variable} ${lato.variable} ${openSans.variable} ${inter.variable}`}>
      {/* Backup Google Fonts Link for High Fidelity */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&display=block" rel="stylesheet" />

      <div id="resume-content" className="resume-print-container">

        <UniversalResume
          resumeData={resumeData}
          template={selectedTemplate}
          isEditing={false}
        />
      </div>

      <style jsx global>{`
                /* CRITICAL: Force white background and reset for Puppeteer */
                :root {
                    background: white !important;
                    color-scheme: light !important;
                }
                
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    color: black !important;
                    width: 210mm !important; 
                    -webkit-print-color-adjust: exact;
                }

                .download-root {
                    background: white !important;
                    color: black !important;
                    width: 210mm;
                }

                .resume-print-container {
                    position: relative;
                    background: white !important;
                    width: 210mm;
                }

                /* Standardize Multi-page margins using @page in global CSS */
                .resume-wrapper {
                    padding: 0 !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    background: white !important;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 0 !important;
                    }
                }

                .watermark-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(5, 1fr);
                    pointer-events: none;
                    z-index: 1000;
                    overflow: hidden;
                    opacity: 0.1;
                    user-select: none;
                }

                .watermark-text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                    font-weight: bold;
                    color: #000;
                    transform: rotate(-30deg);
                    white-space: nowrap;
                }

                /* Remove any screen-only elements if present */
                .resume-pagination-controls, .no-print {
                    display: none !important;
                }
            `}</style>
    </div>
  );
};

export default DownloadPage;
