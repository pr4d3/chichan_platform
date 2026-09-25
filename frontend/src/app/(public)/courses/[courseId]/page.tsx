import { redirect } from "next/navigation";

export default async function CourseRootRedirectPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/courses/${courseId}/intro`);
}
