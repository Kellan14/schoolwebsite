export const dynamic = "force-dynamic";
import SubjectDetailPage from "@/components/subject-detail-page";
export default function Page(props: { params: Promise<{ subjectId: string }> }) {
  return <SubjectDetailPage params={props.params} />;
}
