export type TeamMemberRow = {
  id: string;
  name: string;
  team: string;
  cardsReceived: number;
  cardsGiven: number;
  trend: number;
  energy: "HOOG" | "GEMIDDELD" | "LAAG";
  topQuality: string;
};

export function TeamTable({
  people
}: {
  people: TeamMemberRow[];
}) {
  return (
    <div className="table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Cards Received</th>
            <th>Cards Given</th>
            <th>Trend</th>
            <th>Energy</th>
            <th>Top Quality</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td>
                <strong>{person.name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--theme-muted)" }}>{person.team}</p>
              </td>
              <td>{person.cardsReceived}</td>
              <td>{person.cardsGiven}</td>
              <td style={{ color: person.trend < 0 ? "var(--theme-red)" : "var(--theme-emerald)", fontWeight: 700 }}>
                {person.trend > 0 ? "+" : ""}
                {person.trend}
              </td>
              <td>
                <span className={`energy ${person.energy === "HOOG" ? "high" : person.energy === "LAAG" ? "low" : "mid"}`}>{person.energy}</span>
              </td>
              <td>{person.topQuality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
