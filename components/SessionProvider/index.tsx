"use client";
import React, { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";

function SessionTracker({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        if (session.user.justLoggedIn) {
            const isNewUser = session.user.isNewUser;
            const eventName = isNewUser ? 'signup_done' : 'login_done';
            const storageKey = `tracked_${eventName}_${session.user.id}`;

            if (!sessionStorage.getItem(storageKey)) {
                sessionStorage.setItem(storageKey, 'true');

                if (typeof window !== 'undefined' && (window as any).dataLayer) {
                    (window as any).dataLayer.push({
                        event: eventName,
                        user_id: session.user.id,
                        method: 'google',
                        source: 'oauth_redirect'
                    });
                }
            }
        }
    }, [session]);

    return <>{children}</>;
}

export default function SessionProvider({ children, session }: any) {
    return (
        <NextAuthSessionProvider session={session}>
            <SessionTracker>{children}</SessionTracker>
        </NextAuthSessionProvider>
    );
}