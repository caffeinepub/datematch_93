import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSetQuizAnswers, useMyQuizAnswers } from "../../hooks/useQueries";
import { QUIZ_QUESTIONS } from "../../utils/constants";

interface QuizViewProps {
  onBack: () => void;
}

export function QuizView({ onBack }: QuizViewProps) {
  const { data: existing } = useMyQuizAnswers();
  const { mutate: saveAnswers, isPending } = useSetQuizAnswers();

  const initialAnswers = existing?.answers
    ? Array.from(existing.answers).map(Number)
    : new Array(QUIZ_QUESTIONS.length).fill(-1);

  const [answers, setAnswers] = useState<number[]>(initialAnswers);
  const [step, setStep] = useState(0);

  const current = QUIZ_QUESTIONS[step];
  const selectedAnswer = answers[step];
  const isAnswered = selectedAnswer !== -1;
  const isLastStep = step === QUIZ_QUESTIONS.length - 1;
  const allAnswered = answers.every((a) => a !== -1);

  const handleSelect = (idx: number) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (isLastStep) {
      saveAnswers(answers, {
        onSuccess: () => {
          toast.success("Quiz saved!");
          onBack();
        },
        onError: (err) => toast.error(err.message || "Failed to save quiz."),
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const OPTION_LABELS = ["A", "B", "C", "D"];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b border-border bg-background">
        <button
          onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {QUIZ_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step
                  ? "w-5 bg-primary"
                  : answers[i] !== -1
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <div className="w-9 text-right">
          <span className="text-xs text-muted-foreground">
            {step + 1}/{QUIZ_QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="px-6 pt-2 pb-6 shrink-0 animate-fade-in">
        <h1 className="text-[22px] font-bold tracking-tight leading-snug">
          {current.question}
        </h1>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="flex flex-col gap-3 animate-slide-up">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full rounded-2xl border-2 px-4 py-4 text-left transition-all active:scale-[0.98]",
                "flex items-start gap-3",
                selectedAnswer === idx
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  selectedAnswer === idx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {OPTION_LABELS[idx]}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="px-6 pb-10 pt-3 shrink-0">
        <Button
          onClick={handleNext}
          disabled={!isAnswered || isPending}
          className="w-full h-14 text-base font-semibold rounded-2xl"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isLastStep ? (
            "Submit Quiz"
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
