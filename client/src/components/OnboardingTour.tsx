import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingTour({ steps, isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
    }
  }, [isOpen]);

  const updateTargetPosition = useCallback(() => {
    if (!step?.target) return;
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step?.target]);

  useEffect(() => {
    if (!isOpen || !step?.target) return;

    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = 100;

    const checkForElement = () => {
      const element = document.querySelector(step.target);
      if (element) {
        updateTargetPosition();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkForElement, checkInterval);
      }
    };

    const timer = setTimeout(checkForElement, 50);
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isOpen, step?.target, updateTargetPosition, currentStep]);

  useEffect(() => {
    if (step?.action) {
      step.action();
    }
  }, [currentStep, step?.action]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const placement = step?.placement || "bottom";
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
    }

    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        data-testid="onboarding-overlay"
      >
        <div
          className="absolute inset-0"
          onClick={handleSkip}
          style={{
            background: targetRect
              ? `radial-gradient(ellipse ${targetRect.width + 80}px ${targetRect.height + 80}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, rgba(0, 0, 0, 0.7) 100%)`
              : "rgba(0, 0, 0, 0.7)",
          }}
        />

        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute rounded-xl ring-4 ring-primary ring-offset-4 ring-offset-background"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              pointerEvents: "none",
            }}
            data-testid="tour-highlight"
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-10"
          style={getTooltipPosition()}
          data-testid="tour-tooltip"
        >
          <Card className="w-80 rounded-2xl border-primary/20 bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {currentStep + 1}
                </div>
                <span className="text-xs text-muted-foreground">
                  of {steps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleSkip}
                data-testid="tour-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3
              className="mt-3 font-serif text-lg font-semibold tracking-tight"
              data-testid="tour-step-title"
            >
              {step?.title}
            </h3>
            <p
              className="mt-2 text-sm leading-relaxed text-muted-foreground"
              data-testid="tour-step-content"
            >
              {step?.content}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                data-testid="tour-skip"
              >
                Skip tour
              </Button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    data-testid="tour-prev"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  data-testid="tour-next"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    idx === currentStep
                      ? "bg-primary"
                      : idx < currentStep
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const TOUR_STORAGE_KEY = "tco-onboarding-completed";

export function useTourState() {
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  });
  const [isTourOpen, setIsTourOpen] = useState(false);

  const startTour = useCallback(() => {
    setIsTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setHasCompletedTour(true);
    setIsTourOpen(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    hasCompletedTour,
    isTourOpen,
    startTour,
    closeTour,
    completeTour,
    resetTour,
  };
}
