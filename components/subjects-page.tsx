"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  cardCount: number;
  dueCount: number;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function SubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchSubjects();
  }, [user, authLoading, router]);

  async function fetchSubjects() {
    try {
      const data = await apiFetch("/api/subjects");
      setSubjects(data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      await apiFetch("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      setNewName("");
      setNewColor(COLORS[0]);
      setDialogOpen(false);
      toast.success("Subject created!");
      fetchSubjects();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSubject(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its cards?`)) return;

    try {
      await apiFetch(`/api/subjects/${id}`, { method: "DELETE" });
      toast.success("Subject deleted");
      fetchSubjects();
    } catch {
      toast.error("Failed to delete subject");
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Subjects</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subject</DialogTitle>
            </DialogHeader>
            <form onSubmit={createSubject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Biology, History"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className="h-8 w-8 rounded-full border-2 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          newColor === color ? "white" : "transparent",
                        transform: newColor === color ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No subjects yet. Create one to start adding flashcards!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="group relative">
              <Link href={`/subjects/${subject.id}`}>
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
                <CardContent>
                  {subject.dueCount > 0 ? (
                    <span className="text-sm font-medium text-orange-500">
                      {subject.dueCount} due for review
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      All caught up!
                    </span>
                  )}
                </CardContent>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  deleteSubject(subject.id, subject.name);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
