import { useState } from "react";
import KanbanCard from "./KanbanCard";
import "./KanbanColumn.css";

export default function KanbanColumn({
  column,
  cards,
  accentColor,
  onDragStart,
  onDrop,
  onAddClick,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Drop target handlers ───────────────────────────────────────────────
  // preventDefault() on dragover is REQUIRED to allow drop events to fire.
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    // Only clear the highlight if the cursor actually left the column
    // (not just moved to a child element inside it)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(column.id);
  }

  return (
    <div
      className={`kanban-column ${isDragOver ? "kanban-column--drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Header ── */}
      <div className="kanban-column__header">
        <h2 className="kanban-column__label">{column.label}</h2>
        <button
          className="kanban-column__add"
          onClick={() => onAddClick(column.id)}
          aria-label={`Add application to ${column.label}`}
        >
          +
        </button>
      </div>

      {/* ── Cards ── */}
      <div className="kanban-column__cards">
        {cards.map((app) => (
          <KanbanCard
            key={app.id}
            application={app}
            accentColor={accentColor}
            columnId={column.id}
            onDragStart={onDragStart}
          />
        ))}

        {/* Empty state — shown when the column has no cards */}
        {cards.length === 0 && (
          <div className="kanban-column__empty">No applications yet</div>
        )}
      </div>
    </div>
  );
}
