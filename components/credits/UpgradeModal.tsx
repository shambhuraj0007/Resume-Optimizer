'use client';

import { Check, Sparkles, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleRedirect = () => {
    onOpenChange(false);
    setTimeout(() => {
      const returnTo = encodeURIComponent(pathname);
      router.push(`/pricing?returnTo=${returnTo}`);
    }, 200);
  };

  const benefits = [
    "Detailed ATS Score & Match %",
    "More Resume Scans",
    "Keyword Gap Analysis",
    "Unlimited PDF Downloads",
    "Priority Support"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 border-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950 shadow-2xl">

        {/* Compact Header */}
        <div className="relative h-28 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 overflow-hidden">

          {/* Animated Background */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 right-0 w-48 h-48 bg-purple-400/30 rounded-full blur-3xl"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-slate-950/80 dark:via-slate-950/40" />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-3 rounded-xl border border-white/40 dark:border-slate-700/40 shadow-xl">
              <Sparkles className="h-7 w-7 text-yellow-500 dark:text-yellow-400 fill-yellow-400" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight mb-2 leading-tight">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                UNLOCK FULL
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                POTENTIAL
              </span>
            </DialogTitle>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Upgrade now to remove all restrictions and land your dream job faster.
            </p>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {/* Compact Benefits List */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/80 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-lg">
              <ul className="space-y-3 text-left">
                {benefits.map((benefit, index) => (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.06 }}
                    key={index}
                    className="text-sm font-semibold text-foreground leading-relaxed"
                  >
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>


            {/* Compact CTA Button */}
            <Button
              onClick={handleRedirect}
              className="relative w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] group overflow-hidden"
            >
              {/* Shine Effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />

              <span className="relative flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                View Upgrade Options
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            {/* Maybe Later */}
            <button
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
