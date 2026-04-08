"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizCard {
  id: string;
  front: string;
  back: string;
}

interface QuizQuestion {
  card: QuizCard;
  options?: string[];
  correctAnswer: string;
  pairedAnswer?: string; // for true/false
  isTruePair?: boolean;
}

type QuizMode = "multiple-choice" | "typed" | "true-false";

interface QuizAnswer {
  cardId: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  question: string;
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublic = searchParams.get("public") === "true";

  // Setup state
  const [mode, setMode] = useState<QuizMode>("multiple-choice");
  const [cardCount, setCardCount] = useState("10");
  const [started, setStarted] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPublic && authLoading) return;
    if (!isPublic && !user) router.push("/login");
  }, [user, authLoading, router, isPublic]);

  function generateQuestions(
    cards: QuizCard[],
    allCards: QuizCard[],
    quizMode: QuizMode
  ): QuizQuestion[] {
    return cards.map((card) => {
      if (quizMode === "multiple-choice") {
        const otherBacks = allCards
          .filter((c) => c.id !== card.id)
          .map((c) => c.back);
        const shuffledOthers = otherBacks.sort(() => Math.random() - 0.5);
        const distractors = shuffledOthers.slice(0, 3);
        const options = [...distractors, card.back].sort(
          () => Math.random() - 0.5
        );
        return { card, options, correctAnswer: card.back };
      } else if (quizMode === "true-false") {
        const isTrue = Math.random() > 0.5;
        if (isTrue) {
          return {
            card,
            correctAnswer: "true",
            pairedAnswer: card.back,
            isTruePair: true,
          };
        } else {
          const otherBacks = allCards
            .filter((c) => c.id !== card.id)
            .map((c) => c.back);
          const wrongAnswer =
            otherBacks[Math.floor(Math.random() * otherBacks.length)] ||
            card.back;
          return {
            card,
            correctAnswer: "false",
            pairedAnswer: wrongAnswer,
            isTruePair: false,
          };
        }
      } else {
        return { card, correctAnswer: card.back };
      }
    });
  }

  async function startQuiz() {
    setLoading(true);
    try {
      let quizCards: QuizCard[];
      let allCards: QuizCard[];
      let effectiveMode = mode;

      if (isPublic) {
        // Fetch public cards directly
        const cards = await apiFetch(`/api/cards?subjectId=${subjectId}&public=true`);
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        const count = Math.min(parseInt(cardCount), cards.length);
        quizCards = shuffled.slice(0, count);
        allCards = cards;
        if (mode === "multiple-choice" && cards.length < 4) effectiveMode = "typed";
      } else {
        const data = await apiFetch("/api/quiz/start", {
          method: "POST",
          body: JSON.stringify({
            subjectId,
            mode,
            count: parseInt(cardCount),
          }),
        });
        quizCards = data.cards;
        allCards = data.allCards;
        effectiveMode = data.mode;
      }

      const qs = generateQuestions(quizCards, allCards, effectiveMode);
      setQuestions(qs);
      setStarted(true);
      setStartTime(Date.now());
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }

  const submitAnswer = useCallback(
    (userAnswer: string) => {
      const question = questions[currentIndex];
      if (!question) return;

      let correct = false;
      if (mode === "typed") {
        correct =
          userAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
      } else {
        correct = userAnswer === question.correctAnswer;
      }

      const answer: QuizAnswer = {
        cardId: question.card.id,
        correct,
        userAnswer,
        correctAnswer:
          mode === "true-false"
            ? `${question.correctAnswer} (${question.card.back})`
            : question.correctAnswer,
        question: question.card.front,
      };

      setAnswers((prev) => [...prev, answer]);
      setSelectedAnswer(userAnswer);
      setShowFeedback(true);
    },
    [questions, currentIndex, mode]
  );

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTypedAnswer("");
    }
  }

  async function finishQuiz() {
    setFinished(true);
    const correctCount = answers.filter((a) => a.correct).length;
    const duration = Math.round((Date.now() - startTime) / 1000);

    if (user && !isPublic) {
      try {
        await apiFetch("/api/quiz/submit", {
          method: "POST",
          body: JSON.stringify({
            subjectId,
            totalCards: questions.length,
            correctCount,
            quizMode: mode,
            durationSeconds: duration,
          }),
        });
      } catch {
        // save failed, not critical
      }
    }
  }

  if (authLoading || !user) return null;

  // Setup screen
  if (!started) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push(`/subjects/${subjectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Start a Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quiz mode</Label>
              <Select
                value={mode}
                onValueChange={(v) => v && setMode(v as QuizMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">
                    Multiple Choice
                  </SelectItem>
                  <SelectItem value="typed">Typed Answer</SelectItem>
                  <SelectItem value="true-false">True / False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of questions</Label>
              <Select value={cardCount} onValueChange={(v) => v && setCardCount(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={startQuiz}
              disabled={loading}
            >
              {loading ? "Loading..." : "Start Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (finished) {
    const correctCount = answers.filter((a) => a.correct).length;
    const percentage = Math.round((correctCount / answers.length) * 100);
    const duration = Math.round((Date.now() - startTime) / 1000);

    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="text-center py-8">
          <CardContent className="space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <div className="text-4xl font-bold">{percentage}%</div>
            <p className="text-muted-foreground">
              {correctCount} / {answers.length} correct in{" "}
              {Math.floor(duration / 60)}m {duration % 60}s
            </p>

            <div className="space-y-2 text-left max-h-64 overflow-y-auto">
              {answers.map((answer, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-md text-sm",
                    answer.correct
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {answer.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{answer.question}</p>
                      {!answer.correct && (
                        <p className="text-muted-foreground">
                          Correct: {answer.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStarted(false);
                  setFinished(false);
                  setAnswers([]);
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                  setShowFeedback(false);
                  setTypedAnswer("");
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => router.push(`/subjects/${subjectId}`)}
              >
                Back to Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz question screen
  const question = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Badge variant="outline">{mode.replace("-", " ")}</Badge>
        </div>
        <Progress value={progressPercent} />
      </div>

      <Card className="mb-6">
        <CardContent className="py-8">
          {mode === "true-false" ? (
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">{question.card.front}</p>
              <p className="text-muted-foreground">=</p>
              <p className="text-lg">{question.pairedAnswer}</p>
            </div>
          ) : (
            <p className="text-xl text-center font-medium">
              {question.card.front}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Answer area */}
      {mode === "multiple-choice" && question.options && (
        <div className="space-y-2">
          {question.options.map((option, i) => (
            <Button
              key={i}
              variant="outline"
              className={cn(
                "w-full justify-start text-left h-auto py-3 px-4",
                showFeedback &&
                  option === question.correctAnswer &&
                  "border-green-500 bg-green-500/10",
                showFeedback &&
                  selectedAnswer === option &&
                  option !== question.correctAnswer &&
                  "border-red-500 bg-red-500/10"
              )}
              disabled={showFeedback}
              onClick={() => submitAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {mode === "typed" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!showFeedback) submitAnswer(typedAnswer);
          }}
          className="space-y-3"
        >
          <Input
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={showFeedback}
            autoFocus
          />
          {!showFeedback && (
            <Button type="submit" className="w-full">
              Submit
            </Button>
          )}
          {showFeedback && (
            <div
              className={cn(
                "p-3 rounded-md text-sm",
                answers[answers.length - 1]?.correct
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              )}
            >
              {answers[answers.length - 1]?.correct ? (
                <p className="text-green-600 font-medium">Correct!</p>
              ) : (
                <p>
                  <span className="text-red-600 font-medium">Incorrect.</span>{" "}
                  Answer: {question.correctAnswer}
                </p>
              )}
            </div>
          )}
        </form>
      )}

      {mode === "true-false" && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className={cn(
              "h-16 text-lg",
              showFeedback &&
                question.correctAnswer === "true" &&
                "border-green-500 bg-green-500/10",
              showFeedback &&
                selectedAnswer === "true" &&
                question.correctAnswer !== "true" &&
                "border-red-500 bg-red-500/10"
            )}
            disabled={showFeedback}
            onClick={() => submitAnswer("true")}
          >
            True
          </Button>
          <Button
            variant="outline"
            className={cn(
              "h-16 text-lg",
              showFeedback &&
                question.correctAnswer === "false" &&
                "border-green-500 bg-green-500/10",
              showFeedback &&
                selectedAnswer === "false" &&
                question.correctAnswer !== "false" &&
                "border-red-500 bg-red-500/10"
            )}
            disabled={showFeedback}
            onClick={() => submitAnswer("false")}
          >
            False
          </Button>
        </div>
      )}

      {showFeedback && (
        <Button className="w-full mt-4" onClick={nextQuestion}>
          {currentIndex + 1 >= questions.length ? "See Results" : "Next"}
        </Button>
      )}
    </div>
  );
}
