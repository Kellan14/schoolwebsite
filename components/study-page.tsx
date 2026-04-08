"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { Flashcard } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { QUALITY_MAP, type QualityLabel } from "@/lib/sm2";
import { ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";

interface StudyCard {
  id: string;
  front: string;
  back: string;
}

const ratingConfig: { label: QualityLabel; display: string; color: string; key: string }[] = [
  { label: "again", display: "1", color: "bg-red-500 hover:bg-red-600", key: "1" },
  { label: "hard", display: "2", color: "bg-orange-500 hover:bg-orange-600", key: "2" },
  { label: "good", display: "3", color: "bg-green-500 hover:bg-green-600", key: "3" },
  { label: "easy", display: "4", color: "bg-blue-500 hover:bg-blue-600", key: "4" },
];

export default function StudyPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublic = searchParams.get("public") === "true";
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, again: 0, good: 0 });

  useEffect(() => {
    if (!isPublic && authLoading) return;
    if (!isPublic && !user) {
      router.push("/login");
      return;
    }

    async function fetchCards() {
      try {
        const url = isPublic
          ? `/api/cards?subjectId=${subjectId}&public=true`
          : `/api/cards?subjectId=${subjectId}`;
        const data = await apiFetch(url);
        // Shuffle
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setCards(shuffled);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [user, authLoading, router, subjectId, isPublic]);

  const handleRate = useCallback(
    async (label: QualityLabel) => {
      const card = cards[currentIndex];
      if (!card) return;

      const quality = QUALITY_MAP[label];

      // Submit review (only for authenticated users studying their own cards)
      if (user && !isPublic) {
        try {
          await apiFetch("/api/progress/review", {
            method: "POST",
            body: JSON.stringify({ cardId: card.id, quality }),
          });
        } catch {
          // continue anyway
        }
      }

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        again: prev.again + (label === "again" ? 1 : 0),
        good: prev.good + (label === "good" || label === "easy" ? 1 : 0),
      }));

      // Next card
      if (currentIndex + 1 >= cards.length) {
        setDone(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setFlipped(false);
      }
    },
    [cards, currentIndex]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " " && !flipped) {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped) {
        const rating = ratingConfig.find((r) => r.key === e.key);
        if (rating) {
          e.preventDefault();
          handleRate(rating.label);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, handleRate]);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">No cards to study.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="text-center py-8">
          <CardContent className="space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <div className="space-y-1 text-muted-foreground">
              <p>Cards reviewed: {sessionStats.reviewed}</p>
              <p>Got right: {sessionStats.good}</p>
              <p>Need review: {sessionStats.again}</p>
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentIndex(0);
                  setFlipped(false);
                  setDone(false);
                  setSessionStats({ reviewed: 0, again: 0, good: 0 });
                  setCards([...cards].sort(() => Math.random() - 0.5));
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
              <Button onClick={() => router.push(`/subjects/${subjectId}`)}>
                Back to Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push(`/subjects/${subjectId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <Flashcard
        front={current.front}
        back={current.back}
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
      />

      {flipped && (
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            <span>&larr; unknown</span>
            <span>known &rarr;</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ratingConfig.map((rating) => (
              <Button
                key={rating.label}
                className={`text-white ${rating.color}`}
                onClick={() => handleRate(rating.label)}
              >
                {rating.display}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
