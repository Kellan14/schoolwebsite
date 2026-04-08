import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const publicAccess = searchParams.get("public") === "true";

  if (publicAccess && subjectId) {
    // Check if subject is public
    const { data: subject } = await supabase
      .from("subjects")
      .select("is_public")
      .eq("id", subjectId)
      .single();

    if (!subject?.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Authenticated access to own cards
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Support bulk import (array) or single card
  const cards = Array.isArray(body) ? body : [body];

  const toInsert = cards.map((card) => ({
    user_id: user.id,
    subject_id: card.subject_id ?? card.subjectId,
    front: card.front,
    back: card.back,
    tags: card.tags ?? [],
  }));

  for (const card of toInsert) {
    if (!card.front || !card.back || !card.subject_id) {
      return NextResponse.json(
        { error: "Each card needs front, back, and subject_id" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("cards")
    .insert(toInsert)
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
