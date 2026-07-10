import { DashboardShell } from "@/components/DashboardShell";
import { managerUser } from "@/lib/demo-data";

export default function ManagerSettingsPage() {
  return (
    <DashboardShell role="manager" title="Manager settings" subtitle="Fine-tune your signal thresholds and reporting defaults." user={managerUser}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <h2>Signal preferences</h2>
          <div className="settings-list">
            <label><input type="checkbox" defaultChecked /> Notify me after 6 weeks without recognition</label>
            <label><input type="checkbox" defaultChecked /> Highlight rising recognition patterns</label>
            <label><input type="checkbox" /> Daily email summaries</label>
          </div>
        </article>
        <article className="panel dashboard-panel">
          <h2>Report defaults</h2>
          <div className="settings-list">
            <label><input type="checkbox" defaultChecked /> Include team comparison</label>
            <label><input type="checkbox" defaultChecked /> Include top qualities</label>
            <label><input type="checkbox" /> Include card deck usage</label>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}
