import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const supabase = getServerSupabase(request.headers.get("authorization"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("subjects")
    .update({ flagged: true })
    .eq("id", subjectId)
    .eq("is_public", true);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
