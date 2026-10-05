import { Eyebrow } from "@/components/ui/Eyebrow";

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  titleId
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  titleId?: string;
}) {
  return (
    <div className={`gt-section-header gt-section-header-${align}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 id={titleId}>{title}</h2>
      {lead ? <p className="gt-section-lead">{lead}</p> : null}
    </div>
  );
}
