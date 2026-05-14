"use client";

import React, { useState, useEffect } from "react";
import { FaBrain, FaSearch, FaStar, FaMagic } from "react-icons/fa";

interface ProgressBarProps {
  className?: string;
  onComplete?: () => void;
  isApiCallComplete?: boolean;
}

const PROGRESS_STEPS = [
  { id: 1, icon: FaSearch, label: "Analyzing your profile", duration: 2000 },
  { id: 2, icon: FaBrain, label: "Processing preferences", duration: 2000 },
  { id: 3, icon: FaStar, label: "Scoring candidates", duration: 2500 },
  { id: 4, icon: FaMagic, label: "Finalizing recommendations", duration: 1500 }
];

export function ProgressBar({ className = "", onComplete, isApiCallComplete = false }: ProgressBarProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    const runStep = (stepIndex: number) => {
      if (stepIndex >= PROGRESS_STEPS.length) {
        // Complete the progress bar regardless of API status
        setProgress(100);
        if (onComplete) {
          setTimeout(onComplete, 500); // Small delay before calling onComplete
        }
        return;
      }

      setCurrentStep(stepIndex);
      const step = PROGRESS_STEPS[stepIndex];
      if (!step) return;
      
      const stepProgress = (stepIndex / PROGRESS_STEPS.length) * 100;
      
      // Animate progress for this step
      let currentProgress = stepProgress;
      const targetProgress = ((stepIndex + 1) / PROGRESS_STEPS.length) * 100;
      const progressIncrement = (targetProgress - stepProgress) / (step.duration / 50);
      
      progressInterval = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      if (stepTimeout) clearTimeout(stepTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [onComplete]);


  const currentStepData = PROGRESS_STEPS[currentStep] || PROGRESS_STEPS[PROGRESS_STEPS.length - 1];
  const IconComponent = currentStepData?.icon;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-700/30 rounded-full overflow-hidden mb-6">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>

      {/* Current Step */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-3">
          {IconComponent && <IconComponent className="w-6 h-6 text-purple-400 animate-pulse" />}
        </div>
        <h3 className="text-lg font-medium text-white light:text-gray-900 mb-2">
          {currentStepData?.label || 'Processing...'}
        </h3>
        <p className="text-sm text-purple-200/70 light:text-gray-500">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center space-x-2 mt-6">
        {PROGRESS_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentStep
                ? 'bg-purple-400'
                : 'bg-gray-600/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}