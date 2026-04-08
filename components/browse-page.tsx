"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, BookOpen, Brain, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface PublicSubject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  cardCount: number;
}

export default function BrowsePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<PublicSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublic() {
      try {
        const data = await apiFetch("/api/subjects?public=true");
        setSubjects(data);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    }
    fetchPublic();
  }, []);

  async function flagSubject(id: string) {
    if (!user) {
      toast.error("Sign in to flag content");
      return;
    }
    try {
      await apiFetch(`/api/subjects/${id}/flag`, { method: "POST" });
      toast.success("Flagged for review. Thank you!");
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to flag");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Public Sets</h1>
        <p className="text-muted-foreground mt-1">
          Study flashcard sets shared by other students.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No public sets available yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                </div>
                <CardDescription>{subject.cardCount} cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Link href={`/subjects/${subject.id}/study?public=true`}>
                    <Button variant="outline" size="sm">
                      <Brain className="h-4 w-4 mr-1" />
                      Study
                    </Button>
                  </Link>
                  <Link href={`/subjects/${subject.id}/quiz?public=true`}>
                    <Button variant="outline" size="sm">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Quiz
                    </Button>
                  </Link>
                </div>
                {user && user.id !== subject.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => flagSubject(subject.id)}
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Flag for review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
