import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = getServerSupabase(
    request.headers.get("authorization")
  );

  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    // Browse public subjects — no auth required
    const { data: subjects, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("is_public", true)
      .eq("flagged", false)
      .order("name");

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = await Promise.all(
      (subjects ?? []).map(async (subject) => {
        const { count: cardCount } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id);
        return { ...subject, cardCount: cardCount ?? 0, dueCount: 0 };
      })
    );

    return NextResponse.json(enriched);
  }

  // User's own subjects — auth required
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Get card counts and due counts per subject
  const enriched = await Promise.all(
    (subjects ?? []).map(async (subject) => {
      const { count: cardCount } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id);

      const { count: dueCount } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review", new Date().toISOString());

      return { ...subject, cardCount: cardCount ?? 0, dueCount: dueCount ?? 0 };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const supabase = getServerSupabase(
    request.headers.get("authorization")
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, color, icon } = body;

  if (!name)
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("subjects")
    .insert({ user_id: user.id, name, color, icon })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
