"use client";

import { useEffect, useState } from "react";
import HomeResumeUploader from "@/app/(main)/HomeResumeUploader";
import { useSession } from "next-auth/react";

export default function ExtensionPage() {
    const [jdFromExtension, setJdFromExtension] = useState("");
    const { status } = useSession();

    const isLoaded = status !== "loading";
    const isSignedIn = status === "authenticated";

    // --- MESSAGE LISTENER ---
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Listen for the specific message type from sidepanel.js
            if (event.data?.type === "SET_JD") {
                setJdFromExtension(event.data.text);
                // Acknowledge receipt to the parent window
                window.parent.postMessage({ type: "JD_RECEIVED" }, "*");
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    if (!isLoaded) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );

    // --- LANDING / LOGIN SCREEN ---
    if (!isSignedIn) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-900 p-6 text-center text-white">
                <h1 className="mb-2 text-2xl font-bold text-blue-500 font-outfit">ShortlistAI</h1>
                <p className="mb-6 text-sm text-gray-400">
                    Please log in to analyze job descriptions.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        // Fixed: Added https:// to ensure it opens the live site
                        onClick={() => window.open("https://shortlistai.cv/signin", "_blank")}
                        className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-3 font-semibold text-white hover:scale-105 transition-all shadow-lg"
                    >
                        Login in New Tab
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs text-blue-400 hover:underline"
                    >
                        I've logged in, refresh this panel
                    </button>
                </div>
                <p className="mt-4 text-xs text-gray-500 text-center max-w-xs">
                    After logging in, click the refresh link above.
                </p>
            </div>
        );
    }

    // --- MAIN APP ---
    return (
        <div className="min-h-screen bg-gray-900 overflow-y-auto">
            {/* Pass the data down to your uploader */}
            <HomeResumeUploader initialJd={jdFromExtension} isExtension={true} />
        </div>
    );
}