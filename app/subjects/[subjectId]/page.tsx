"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pencil, Brain, ClipboardList, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CardItem {
  id: string;
  front: string;
  back: string;
  tags: string[];
  created_at: string;
}

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [user, authLoading, router, subjectId]);

  async function fetchData() {
    try {
      const [cardsData, subjects] = await Promise.all([
        apiFetch(`/api/cards?subjectId=${subjectId}`),
        apiFetch("/api/subjects"),
      ]);
      setCards(cardsData);
      const subject = subjects.find(
        (s: { id: string }) => s.id === subjectId
      );
      if (subject) setSubjectName(subject.name);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(card: CardItem) {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingCard(null);
    setFront("");
    setBack("");
    setDialogOpen(true);
  }

  async function saveCard(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setSaving(true);

    try {
      if (editingCard) {
        await apiFetch(`/api/cards/${editingCard.id}`, {
          method: "PUT",
          body: JSON.stringify({ front: front.trim(), back: back.trim() }),
        });
        toast.success("Card updated");
      } else {
        await apiFetch("/api/cards", {
          method: "POST",
          body: JSON.stringify({
            subject_id: subjectId,
            front: front.trim(),
            back: back.trim(),
          }),
        });
        toast.success("Card created");
      }
      setDialogOpen(false);
      setFront("");
      setBack("");
      setEditingCard(null);
      fetchData();
    } catch {
      toast.error("Failed to save card");
    } finally {
      setSaving(false);
    }
  }

  async function bulkImport(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setSaving(true);

    try {
      // Parse: each line is "front | back" or "front \t back"
      const lines = bulkText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const cards = lines
        .map((line) => {
          const sep = line.includes("|") ? "|" : "\t";
          const parts = line.split(sep).map((p) => p.trim());
          if (parts.length >= 2) {
            return { subject_id: subjectId, front: parts[0], back: parts[1] };
          }
          return null;
        })
        .filter(Boolean);

      if (cards.length === 0) {
        toast.error('No valid cards found. Use "front | back" format, one per line.');
        return;
      }

      await apiFetch("/api/cards", {
        method: "POST",
        body: JSON.stringify(cards),
      });
      toast.success(`Imported ${cards.length} cards!`);
      setBulkDialogOpen(false);
      setBulkText("");
      fetchData();
    } catch {
      toast.error("Failed to import cards");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCard(id: string) {
    try {
      await apiFetch(`/api/cards/${id}`, { method: "DELETE" });
      toast.success("Card deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete card");
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/subjects")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to subjects
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{subjectName || "Subject"}</h1>
        <div className="flex gap-2">
          {cards.length > 0 && (
            <>
              <Link href={`/subjects/${subjectId}/study`}>
                <Button variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Study
                </Button>
              </Link>
              <Link href={`/subjects/${subjectId}/quiz`}>
                <Button variant="outline">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Quiz
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogTrigger >
            <Button variant="outline">Bulk Import</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Import Cards</DialogTitle>
            </DialogHeader>
            <form onSubmit={bulkImport} className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Paste cards (one per line, separated by | or tab)
                </Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"What is DNA? | Deoxyribonucleic acid\nMitosis | Cell division process"}
                  rows={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Importing..." : "Import"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Edit Card" : "New Card"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front (question/term)</Label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Back (answer/definition)</Label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                required
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : editingCard ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Separator className="mb-6" />

      {/* Card list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No cards yet. Add your first flashcard!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            {cards.length} card{cards.length !== 1 ? "s" : ""}
          </p>
          {cards.map((card) => (
            <Card key={card.id} className="group">
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{card.front}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {card.back}
                  </p>
                </div>
                <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(card)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
