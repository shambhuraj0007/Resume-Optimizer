"use client";

import { useEffect } from "react";

export default function HomeViewTracker() {
    useEffect(() => {
        // Track Home Page View
        const hasTracked = sessionStorage.getItem("tracked_home_view");
        if (!hasTracked) {
            fetch("/api/loops/event", {
                method: "POST",
                body: JSON.stringify({ eventName: "viewed_home_page" }),
            }).catch((err) => console.error("Tracking error:", err));
            sessionStorage.setItem("tracked_home_view", "true");
        }
    }, []);

    return null;
}
