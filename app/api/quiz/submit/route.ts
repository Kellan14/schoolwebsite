import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subjectId, totalCards, correctCount, quizMode, durationSeconds } =
    await request.json();

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      total_cards: totalCards,
      correct_count: correctCount,
      quiz_mode: quizMode,
      duration_seconds: durationSeconds,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
