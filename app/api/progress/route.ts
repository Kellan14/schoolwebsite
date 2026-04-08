import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  // Get quiz results
  let quizQuery = supabase
    .from("quiz_results")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (subjectId) quizQuery = quizQuery.eq("subject_id", subjectId);

  const { data: quizResults } = await quizQuery;

  // Get progress stats
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("*, cards(subject_id)")
    .eq("user_id", user.id);

  // Count due cards
  const now = new Date().toISOString();
  const dueCards =
    progressData?.filter((p) => p.next_review <= now).length ?? 0;
  const totalReviewed = progressData?.length ?? 0;
  const mastered =
    progressData?.filter((p) => p.repetitions >= 5).length ?? 0;

  return NextResponse.json({
    quizResults: quizResults ?? [],
    stats: { dueCards, totalReviewed, mastered },
    progressData: progressData ?? [],
  });
}
