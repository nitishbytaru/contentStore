'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIProcessingStep {
  id: string;
  title: string;
  description: string;
}

interface AIProcessingLoaderProps {
  isProcessing: boolean;
  steps: AIProcessingStep[];
  currentStepIndex: number;
}

export function AIProcessingLoader({ isProcessing, steps, currentStepIndex }: AIProcessingLoaderProps) {
  // Prevent rendering if not processing
  if (!isProcessing) return null;

  const completedStepsCount = Math.min(currentStepIndex, steps.length);
  const progressPercentage = (completedStepsCount / steps.length) * 100;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md md:max-w-lg p-6 md:p-8 mx-4 relative bg-card border border-border/50 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)] rounded-3xl overflow-hidden"
      >
        {/* Animated Gradient Background Glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_35%,var(--tw-colors-primary)_50%,transparent_65%,transparent_100%)] blur-[80px]"
          />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 mb-2">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-md"
              />
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary relative z-10" />
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              AI is working
            </h2>
            
            <div className="h-6">
              <AnimatePresence mode="wait">
                {currentStepIndex < steps.length ? (
                  <motion.p
                    key={steps[currentStepIndex].id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm md:text-base text-muted-foreground font-medium"
                  >
                    {steps[currentStepIndex].description}
                  </motion.p>
                ) : (
                  <motion.p
                    key="done"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm md:text-base text-primary font-medium"
                  >
                    All steps complete! Redirecting...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex items-center gap-4 p-3 md:p-4 rounded-xl transition-all duration-500",
                    isActive ? "bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-transparent",
                    isUpcoming && "opacity-40"
                  )}
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </motion.div>
                    ) : isActive ? (
                      <div className="relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                        />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/50" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "text-sm md:text-base font-semibold transition-colors duration-300",
                      isActive ? "text-foreground" : isCompleted ? "text-foreground/70" : "text-muted-foreground/70"
                    )}>
                      {step.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs md:text-sm text-muted-foreground font-medium">
              <span>{completedStepsCount} of {steps.length} steps completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 md:h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
