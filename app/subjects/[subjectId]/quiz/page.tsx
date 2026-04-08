export const dynamic = "force-dynamic";
import QuizPage from "@/components/quiz-page";
export default function Page(props: { params: Promise<{ subjectId: string }> }) {
  return <QuizPage params={props.params} />;
}
