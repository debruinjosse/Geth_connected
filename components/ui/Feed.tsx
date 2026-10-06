import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";

/** Vertical list of rows separated by hairlines. */
export function Feed({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("lp-feed", className)}>{children}</div>;
}

export function FeedItem({
  avatar,
  title,
  note,
  tag,
  meta,
  metaSub,
  children
}: {
  avatar?: string;
  title: ReactNode;
  note?: ReactNode;
  tag?: ReactNode;
  meta?: ReactNode;
  metaSub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="lp-feed-item">
      {avatar ? <Avatar name={avatar} /> : null}
      <div className="lp-feed-main">
        <div className="lp-feed-title">
          {title}
          {tag ? <span className="lp-feed-tag">{tag}</span> : null}
        </div>
        {note ? <p className="lp-feed-note">{note}</p> : null}
        {children}
      </div>
      {meta || metaSub ? (
        <div className="lp-feed-meta">
          {meta ? <b>{meta}</b> : null}
          {metaSub}
        </div>
      ) : null}
    </div>
  );
}
