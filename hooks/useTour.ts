'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { tourSteps } from '@/lib/config/tourSteps';
import { useSession } from 'next-auth/react';

export const useTour = () => {
    const driverObj = useRef<any>(null);
    const { data: session, status, update } = useSession();

    // Initialize Driver
    useEffect(() => {
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            steps: [...tourSteps],
            onDestroyed: async () => {
                // Save on specific "Finish" or any exit?
                // User said "save it netly... after we clcik finh or skip or clcik outside".
                // So ANY exit should save.
                await markTourAsComplete();
            },
            nextBtnText: 'Next →',
            prevBtnText: '← Back',
            doneBtnText: 'Finish',
        });
    }, []);

    const markTourAsComplete = async () => {
        if (session?.user && !session.user.hasCompletedOnboarding) {
            try {
                await fetch('/api/user/complete-onboarding', { method: 'POST' });
                console.log("Onboarding saved to DB ✅");

                // FORCE SESSION UPDATE so the UI knows immediately
                await update({ hasCompletedOnboarding: true });

            } catch (e) {
                console.error("Failed to mark onboarding complete", e);
            }
        }
    };

    // Auto-start Logic
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const hasSeen = session.user.hasCompletedOnboarding;
            console.log(`[Tour] Checking status for ${session.user.email}: hasSeen=${hasSeen}`);

            if (!hasSeen) {
                // Small delay to ensure UI is rendered
                setTimeout(() => {
                    if (driverObj.current) {
                        console.log("[Tour] Starting tour...");
                        driverObj.current.drive();
                    }
                }, 1500);
            }
        }
    }, [status, session]);

    const startTour = () => {
        if (driverObj.current) {
            driverObj.current.drive();
        }
    };

    return { startTour };
};
