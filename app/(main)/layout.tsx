import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { AnalysisProvider } from '@/contexts/AnalysisContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Your App */}
      <AnalysisProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <Toaster />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
      </AnalysisProvider>
    </>
  );
}
