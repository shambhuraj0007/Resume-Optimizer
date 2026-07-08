"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function HeroContent() {
    const [isClient, setIsClient] = useState(false);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.7]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="space-y-1 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[0.95] sm:leading-[0.9] pt-10">
                Improve Your Interview Chances to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
                    100%
                </span>
            </h1>

            <p className="lg:hidden text-base pt-2 text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Check ATS score and callback chances instantly
            </p>

            <p className="hidden lg:block text-base pt-6 sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Get your ATS score instantly and fix what's blocking
                callbacks. AI-powered analysis in seconds.
            </p>
        </div>
    );
}
