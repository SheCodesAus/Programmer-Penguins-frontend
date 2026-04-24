import KanbanBoard from "../components/KanbanBoard/KanbanBoard";
import "./DashboardPage.css";

export default function DashboardPage() {
  return (
    // Light blue page background — matches the Figma design
    <main className="dashboard-page">
      <KanbanBoard />
    </main>
  );
}
