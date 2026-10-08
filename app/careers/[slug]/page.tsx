import { notFound } from "next/navigation";
import { PageChrome } from "@/components/layout/PageChrome";
import { CoFounderRoleContent } from "@/components/sections/CareersSection";
import { RoleDetail } from "@/components/sections/CareerRoleSection";
import { CAREER_ROLES, getRole } from "@/lib/careers";

export function generateStaticParams() {
  return CAREER_ROLES.map((r) => ({ slug: r.slug }));
}

export default async function CareerRolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  return (
    <PageChrome>{slug === "co-founder" ? <CoFounderRoleContent /> : <RoleDetail role={role} />}</PageChrome>
  );
}
