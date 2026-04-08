"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, BookOpen, Trophy, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface QuizResult {
  id: string;
  subject_id: string;
  total_cards: number;
  correct_count: number;
  quiz_mode: string;
  duration_seconds: number | null;
  completed_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  cardCount: number;
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [stats, setStats] = useState({
    dueCards: 0,
    totalReviewed: 0,
    mastered: 0,
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        const [progressData, subjectsData] = await Promise.all([
          apiFetch("/api/progress"),
          apiFetch("/api/subjects"),
        ]);
        setQuizResults(progressData.quizResults);
        setStats(progressData.stats);
        setSubjects(subjectsData);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  // Build chart data from quiz results
  const quizChartData = quizResults
    .slice()
    .reverse()
    .slice(-20)
    .map((r, i) => ({
      name: `Q${i + 1}`,
      score: Math.round((r.correct_count / r.total_cards) * 100),
      date: new Date(r.completed_at).toLocaleDateString(),
    }));

  // Per-subject stats
  const subjectStats = subjects.map((subject) => {
    const subjectQuizzes = quizResults.filter(
      (r) => r.subject_id === subject.id
    );
    const avgScore =
      subjectQuizzes.length > 0
        ? Math.round(
            subjectQuizzes.reduce(
              (sum, r) => sum + (r.correct_count / r.total_cards) * 100,
              0
            ) / subjectQuizzes.length
          )
        : 0;
    return {
      name: subject.name,
      cards: subject.cardCount,
      quizzes: subjectQuizzes.length,
      avgScore,
      color: subject.color,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Dashboard
      </Button>

      <h1 className="text-3xl font-bold mb-6">Progress</h1>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Due Now</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.dueCards}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reviewed
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReviewed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mastered</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mastered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Quizzes Taken
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizResults.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz score trend */}
          {quizChartData.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quiz Scores</CardTitle>
                <CardDescription>Your recent quiz performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={quizChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-subject breakdown */}
          {subjectStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Breakdown</CardTitle>
                <CardDescription>
                  Average quiz score per subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "avgScore" ? `${value}%` : value,
                        name === "avgScore" ? "Avg Score" : name,
                      ]}
                    />
                    <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Subject detail list */}
                <div className="mt-6 space-y-3">
                  {subjectStats.map((subject) => (
                    <div
                      key={subject.name}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{subject.cards} cards</span>
                        <span>{subject.quizzes} quizzes</span>
                        <span className="font-medium text-foreground">
                          {subject.avgScore}% avg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {quizResults.length === 0 && subjects.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  No progress data yet. Start studying to see your stats!
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
