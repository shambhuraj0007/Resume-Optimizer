// app/api/pdf/route.ts
import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";

// Imports removed

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;


// Cache implementation removed as per user request


let browserInstance: Browser | null = null;
let isLaunching = false;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000;

async function getBrowser(): Promise<Browser> {
  const now = Date.now();

  if (browserInstance && now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    try {
      const pages = await browserInstance.pages();
      if (pages.length > 10) {
        console.warn('⚠️ Too many pages open, closing extras...');
        for (let i = 1; i < pages.length; i++) {
          await pages[i].close().catch(() => { });
        }
      }
      lastHealthCheck = now;
    } catch (error) {
      console.warn('❌ Browser health check failed, will recreate');
      browserInstance = null;
    }
  }

  if (browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (isLaunching) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getBrowser();
  }

  isLaunching = true;

  try {
    if (browserInstance) {
      await browserInstance.close().catch(() => { });
      browserInstance = null;
    }

    console.log('🚀 Launching new browser...');

    // ✅ FIX 1: Use 'true' instead of 'new' for headless
    browserInstance = await puppeteer.launch({
      headless: true, // ✅ Changed from 'new' to true
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
      ],
      defaultViewport: {
        width: 794,
        height: 1123,
      },
    });

    console.log('✅ Browser launched successfully');

    browserInstance.on('disconnected', () => {
      console.warn('❌ Browser disconnected');
      browserInstance = null;
    });

    lastHealthCheck = now;
    return browserInstance;

  } finally {
    isLaunching = false;
  }
}

async function warmupBrowser() {
  console.log('🔥 Warming up browser...');
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.close();
    console.log('✅ Browser warmed up');
  } catch (error) {
    console.error('❌ Browser warmup failed:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let page = null;

  try {
    const body = await request.json();
    let { data, template, format = 'pdf', isPaidUser = false } = body;

    // SERVER-SIDE SUBSCRIPTION VALIDATION (CRITICAL)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        await connectDB();
        const dbUser = await User.findById(session.user.id);
        if (dbUser) {
          // A user is considered Pro if they have an active subscription OR isPaidUser is true
          const dbIsPaid = dbUser.subscriptionStatus === 'active' || dbUser.isPaidUser === true;

          // Debug check: If client tried to spoof paid status, we log it but move on with correct status
          if (isPaidUser && !dbIsPaid) {
            console.warn(`⚠️ Potential bypass attempt by user ${session.user.id}: Client sent isPaidUser:true but DB says false.`);
          }

          isPaidUser = dbIsPaid;
        }
      } else {
        // No session = free user, always watermarked
        isPaidUser = false;
      }
    } catch (authError) {
      console.error("Auth validation error in PDF API:", authError);
      isPaidUser = false; // Fallback to safe default
    }

    if (!data || !template) {
      return NextResponse.json(
        { message: "Missing required data" },
        { status: 400 }
      );
    }


    // Cache check removed

    console.log(`📄 Generating fresh PDF for template: ${template}`);

    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport to A4 width to match print output exactly
    await page.setViewport({
      width: 794, // 210mm at 96dpi
      height: 1123, // 297mm at 96dpi
      deviceScaleFactor: 1,
    });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8888");

    const url = `${baseUrl}/resume/download`;

    console.log(`📄 Generating PDF for template: ${template}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.background = 'white';
      document.documentElement.style.color = 'black';
      document.body.style.background = 'white';
      document.body.style.color = 'black';
      document.documentElement.style.colorScheme = 'light';
    });

    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' },
    ]);

    const mergedPayload = { ...body, isPaidUser };

    await page.evaluate((payload) => {
      (window as any).__RESUME_DATA__ = payload;
      window.dispatchEvent(new CustomEvent('resumeDataReady', { detail: payload }));
    }, mergedPayload);

    await page.waitForSelector("#resume-content", {
      visible: true,
      timeout: 15000,
    });

    await page.evaluate(() => (document as any).fonts?.ready?.catch(() => { }));
    await new Promise(resolve => setTimeout(resolve, 100));

    // ✅ CRITICAL FIX: Optimize for PDF page breaking
    if (true) {
      await page.evaluate((isPaidUser) => {
        // Remove transform that prevents natural page breaking
        const resumeInner = document.getElementById('resume-content-inner');
        if (resumeInner) {
          resumeInner.style.transform = 'none';
          resumeInner.style.transition = 'none';
        }

        // Allow sections to break naturally
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
          (section as HTMLElement).style.pageBreakInside = 'auto';
        });

        // Keep work items together
        const workItems = document.querySelectorAll('.work-item, .project-item, .education-item');
        workItems.forEach(item => {
          (item as HTMLElement).style.pageBreakInside = 'avoid';
          (item as HTMLElement).style.breakInside = 'avoid';
        });

        // Keep headings with their next sibling
        const headings = document.querySelectorAll('h2');
        headings.forEach(heading => {
          (heading as HTMLElement).style.pageBreakAfter = 'avoid';
        });

        // Keep bullet lists together
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach(list => {
          (list as HTMLElement).style.pageBreakInside = 'avoid';
        });

        if (false) {
          // Manual watermark injection removed as per user request
        }
      }, isPaidUser);
    }

    let resultBuffer: Buffer;
    if (format === 'png') {
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1.5
      });
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
      });
      resultBuffer = Buffer.from(screenshot);
    } else {
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      resultBuffer = Buffer.from(pdfBuffer);
    }

    const generationTime = Date.now() - startTime;
    console.log(`✅ ${format.toUpperCase()} generated in ${generationTime}ms (${resultBuffer.length} bytes)`);

    // Cache set removed
    await page.close();
    page = null;

    const contentType = format === 'png' ? 'image/png' : 'application/pdf';
    const filename = `resume-${template}.${format}`;

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": resultBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Cache": "NONE",
        "X-Response-Time": `${generationTime}ms`,
      },
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error);

    if (page) await page.close().catch(() => { });

    if (error instanceof Error && (
      error.message.includes('socket hang up') ||
      error.message.includes('Target closed') ||
      error.message.includes('Session closed') ||
      error.message.includes('Protocol error')
    )) {
      console.warn('🔄 Resetting browser due to critical error');
      if (browserInstance) {
        await browserInstance.close().catch(() => { });
        browserInstance = null;
      }
    }

    return NextResponse.json(
      {
        message: "Error generating PDF",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get('stats') === 'true') {
    return NextResponse.json({
      browser: {
        connected: browserInstance?.isConnected() ?? false,
        launching: isLaunching,
      },
      uptime: process.uptime(),
    });
  }

  return NextResponse.json({
    message: "Use POST /api/pdf with resume data, or GET /api/pdf?stats=true for statistics"
  });
}
