import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subjectId, mode, count = 10 } = await request.json();

  if (!subjectId || !mode) {
    return NextResponse.json(
      { error: "subjectId and mode are required" },
      { status: 400 }
    );
  }

  // Get all cards for the subject
  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!cards || cards.length === 0) {
    return NextResponse.json(
      { error: "No cards in this subject" },
      { status: 400 }
    );
  }

  // Shuffle and limit
  const shuffled = cards.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, cards.length));

  // For multiple choice, we need at least 4 cards, otherwise fall back
  const effectiveMode =
    mode === "multiple-choice" && cards.length < 4 ? "typed" : mode;

  return NextResponse.json({
    cards: selected,
    allCards: cards, // needed for generating distractors
    mode: effectiveMode,
    totalCount: selected.length,
  });
}
