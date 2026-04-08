export const dynamic = "force-dynamic";
import StudyPage from "@/components/study-page";
export default function Page(props: { params: Promise<{ subjectId: string }> }) {
  return <StudyPage params={props.params} />;
}
