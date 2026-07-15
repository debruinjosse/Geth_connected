import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";

export default function AdminDemoAccountsPage() {
  return (
    <DashboardShell role="admin" title="Demo accounts" subtitle="Demo portals have been disabled for Phase 1 production testing." user={superAdminUser}>
      <article className="panel dashboard-panel">
        <EmptyState
          eyebrow="Demo accounts disabled"
          title="Use real Supabase accounts"
          copy="Password login is now the primary auth path. Create real company admin, manager, and employee accounts through signup and invitations."
        />
      </article>
    </DashboardShell>
  );
}
