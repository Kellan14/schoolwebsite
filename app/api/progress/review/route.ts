import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { sm2 } from "@/lib/sm2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, quality } = await request.json();

  if (!cardId || quality === undefined) {
    return NextResponse.json(
      { error: "cardId and quality are required" },
      { status: 400 }
    );
  }

  // Get existing progress or use defaults
  const { data: existing } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .single();

  const currentEF = existing?.ease_factor ?? 2.5;
  const currentInterval = existing?.interval ?? 0;
  const currentReps = existing?.repetitions ?? 0;

  const result = sm2(quality, currentReps, currentEF, currentInterval);

  const progressData = {
    user_id: user.id,
    card_id: cardId,
    ease_factor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    next_review: result.nextReview.toISOString(),
    last_reviewed: new Date().toISOString(),
  };

  const { data, error } = existing
    ? await supabase
        .from("user_progress")
        .update(progressData)
        .eq("id", existing.id)
        .select()
        .single()
    : await supabase
        .from("user_progress")
        .insert(progressData)
        .select()
        .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
