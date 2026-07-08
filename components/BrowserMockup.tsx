"use client";

import React from 'react';
import { MousePointer2, Zap, Check } from 'lucide-react';
import Image from 'next/image';

export default function BrowserMockup() {
    return (
        <>
            {/* Custom Animations Style Block */}
            <style jsx>{`
        @keyframes cursor-path {
          0% { top: 110%; left: 90%; transform: scale(1); }
          15% { top: 100px; left: 10px; transform: scale(1); } /* Start of selection */
          40% { top: 320px; left: 95%; transform: scale(1); } /* End of full text block */
          45% { transform: scale(0.9); } /* Right Click press */
          50% { transform: scale(1); } /* Right Click release */
          60% { top: 220px; left: 65%; transform: scale(1); } /* Move to menu button */
          80% { top: 220px; left: 65%; transform: scale(0.9); } /* Click 'Analyze' */
          85% { top: 220px; left: 65%; transform: scale(1); }
          100% { top: 220px; left: 65%; opacity: 0; }
        }

        @keyframes text-highlight {
          0%, 15% { height: 0; width: 0; opacity: 0; }
          16% { opacity: 1; width: 100%; height: 20px; } /* Start selecting first line */
          40%, 100% { height: 100%; width: 100%; opacity: 1; } /* Entire block selected */
        }

        @keyframes menu-appear {
          0%, 45% { opacity: 0; transform: scale(0.95); pointer-events: none; }
          50%, 100% { opacity: 1; transform: scale(1); pointer-events: auto; }
        }

        @keyframes button-active {
          0%, 60% { background-color: transparent; }
          61%, 85% { background-color: #4f46e5; color: white; } 
          100% { background-color: transparent; }
        }
        
        @keyframes image-reveal {
          0%, 80% { opacity: 0; transform: translateY(10px); }
          85%, 100% { opacity: 1; transform: translateY(0); }
        }

        .animate-cursor-complex {
          animation: cursor-path 8s infinite ease-in-out;
        }
        .animate-text-selection {
          animation: text-highlight 8s infinite linear;
        }
        .animate-menu-popup {
          animation: menu-appear 8s infinite cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-menu-item-hover {
          animation: button-active 8s infinite;
        }
        .animate-image-reveal {
          animation: image-reveal 8s infinite ease-out;
          animation-fill-mode: forwards;
        }
      `}</style>

            <div className="relative mx-auto max-w-5xl perspective-1000 group mt-10">
                {/* Glow behind mockup */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>

                <div className="relative bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-left transform transition-transform duration-700 hover:scale-[1.01]">
                    {/* Browser Header */}
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-md h-7 w-full max-w-lg mx-auto shadow-inner flex items-center justify-center text-[11px] text-slate-500 font-mono tracking-tight">
                            linkedin.com/jobs/view/senior-product-designer
                        </div>
                    </div>

                    {/* Browser Content */}
                    <div className="p-8 grid grid-cols-12 gap-8 bg-slate-950 min-h-[500px] relative overflow-hidden">

                        {/* --- ANIMATION LAYER --- */}
                        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden hidden md:block">

                            {/* 1. The Moving Cursor */}
                            <div className="absolute animate-cursor-complex drop-shadow-2xl z-50">
                                <MousePointer2 className="h-6 w-6 text-slate-100 fill-slate-950 stroke-[1.5px]" />
                            </div>

                            {/* 2. The Context Menu (Appears on Right Click) */}
                            <div className="absolute top-[180px] left-[58%] animate-menu-popup z-40">
                                <div className="w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden py-1.5 flex flex-col">
                                    <div className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 cursor-default">Copy</div>
                                    <div className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 cursor-default">Search Google for...</div>
                                    <div className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-700 cursor-default">Print...</div>
                                    <div className="h-px bg-slate-700 my-1 mx-2"></div>

                                    {/* The Target Button */}
                                    <div className="px-4 py-2 text-xs font-semibold text-indigo-400 flex items-center gap-2 animate-menu-item-hover transition-colors">
                                        <div className="p-0.5 bg-indigo-500 rounded text-white">
                                            <Zap className="h-3 w-3" />
                                        </div>
                                        Analyze with ShortlistAI
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Left Side (Job Post Simulation) */}
                        <div className="col-span-12 md:col-span-8 flex flex-col h-full bg-slate-950 p-6 md:border-r border-slate-800 relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">L</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white leading-tight">Senior Product Designer</h3>
                                        <p className="text-slate-400 text-sm">Linear • San Francisco (Remote)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Applied Badge */}
                            <div className="flex gap-2 mb-4">
                                <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs border border-green-500/20 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Applied by 45 people
                                </span>
                            </div>

                            {/* Job Description Text Area - Selection covers this whole block */}
                            <div className="relative z-10">
                                {/* The Blue Selection Overlay */}
                                <div className="absolute top-0 left-0 bg-blue-500/30 animate-text-selection -z-10 rounded"></div>

                                <div className="space-y-4 text-sm text-slate-300">
                                    <p className="leading-relaxed">
                                        We are looking for a <strong className="text-white">Senior Product Designer</strong> to lead design for our core product team. You will be responsible for end-to-end design of new features, working from early concepts to pixel-perfect execution.
                                    </p>

                                    <h4 className="font-bold text-white mt-4">Requirements</h4>
                                    <ul className="list-disc pl-5 space-y-2 marker:text-slate-600">
                                        <li>5+ years of experience in <strong className="text-indigo-300 bg-indigo-500/10 px-1 rounded">Product Design</strong> or UI/UX.</li>
                                        <li>Strong proficiency in <strong className="text-indigo-300 bg-indigo-500/10 px-1 rounded">Figma</strong> and prototyping tools.</li>
                                        <li>Experience with <strong className="text-indigo-300 bg-indigo-500/10 px-1 rounded">Design Systems</strong> and working closely with engineering.</li>
                                        <li>Ability to write <strong className="text-indigo-300 bg-indigo-500/10 px-1 rounded">clean, maintainable code</strong> (React/CSS) is a plus.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Right Side (Extension Overlay Simulation) */}
                        <div className="hidden md:block col-span-4 relative">
                            <div className="absolute -top-4 -right-2 w-[340px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-1000">
                                <div className="relative w-full h-[520px]">
                                    <div className="w-full h-full bg-slate-900 flex flex-col p-4">
                                        <div className="relative w-full h-full animate-image-reveal">
                                            <Image
                                                src="/extensionpage.png"
                                                alt="ShortlistAI Result"
                                                fill
                                                className="object-contain object-top"
                                                priority
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}