"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: string;
  back: string;
  flipped?: boolean;
  onFlip?: () => void;
}

export function Flashcard({ front, back, flipped: controlledFlipped, onFlip }: FlashcardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped ?? internalFlipped;

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  return (
    <div
      className="perspective-[1000px] w-full max-w-lg mx-auto cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full min-h-[250px] transition-transform duration-500",
          "[transform-style:preserve-3d]",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-xl border bg-card p-8 flex items-center justify-center shadow-sm">
          <p className="text-xl text-center font-medium">{front}</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border bg-card p-8 flex items-center justify-center shadow-sm">
          <p className="text-xl text-center">{back}</p>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-3">
        {isFlipped ? "Showing answer" : "Click or press Space to flip"}
      </p>
    </div>
  );
}
