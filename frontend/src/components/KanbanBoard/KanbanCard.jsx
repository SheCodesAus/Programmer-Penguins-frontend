// ─────────────────────────────────────────────────────────────────────────────
// components/KanbanBoard/KanbanCard.jsx
//
// Renders one job application card.
//
// Design (from Figma):
//   - White card, rounded corners, subtle shadow
//   - Coloured left border accent (colour varies by status column)
//   - Company favicon/logo on the left
//   - Job title (bold), company name, date in a stack
//   - Star icon on the right (bookmark / favourite — visual only for now)
//
// Props:
//   application  – full job application object from the API
//   accentColor  – hex string for the left border (from COLUMN_ACCENT)
//   onDragStart  – fn(cardId, columnId) passed up from KanbanColumn
//   columnId     – which column this card lives in
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLUMNS } from "../../hooks/useKanban";
import "./KanbanCard.css";

// Derive a favicon URL from a company name.
// We use Google's public favicon service as a free, zero-config solution.
// Falls back to a plain coloured initial if the image fails to load.
function getFaviconUrl(companyName) {
  // Simple heuristic: turn "Atlassian" → "atlassian.com"
  // This won't be perfect for all companies but works well for known brands.
  const slug = companyName.toLowerCase().replace(/\s+/g, "");
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=40`;
}

// Format a date string (ISO "2025-04-15") to something readable ("15 Apr 2025").
// Returns an empty string if the date is null/undefined.
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KanbanCard({
  application,
  accentColor,
  onDragStart,
  columnId,
  onStatusChange,
}) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  // `starred` is local UI state only — wire this to an API field if needed later
  const [starred, setStarred] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  function handleDragStart() {
    setIsDragging(true);
    onDragStart(application.id, columnId);
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  // Initials fallback when favicon fails to load
  const initials =
    application.company_name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  function handleClick() {
  navigate(`/job-application/${application.id}`);
  }

  function handleStatusChange(newStatus) {
    onStatusChange(application.id, newStatus);
    setStatusMenuOpen(false);
  }

  return (
    <div
      className={`kanban-card ${isDragging ? "kanban-card--dragging" : ""}`}
      style={{ "--accent": accentColor }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      {/* Left accent border — colour comes from CSS variable --accent */}
      <div className="kanban-card__accent" />

      {/* Company logo */}
      <div className="kanban-card__logo">
        {imgError ? (
          // Fallback: coloured circle with company initials
          <div
            className="kanban-card__logo-fallback"
            style={{ background: accentColor }}
          >
            {initials}
          </div>
        ) : (
          <img
            src={getFaviconUrl(application.company_name)}
            alt={application.company_name}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Text content */}
      <div className="kanban-card__body">
        <p className="kanban-card__title">{application.job_title}</p>
        <p className="kanban-card__company">{application.company_name}</p>
        <p className="kanban-card__date">
          {/* Show date_applied if available, fall back to date_posted */}
          {formatDate(application.date_applied || application.date_posted)}
        </p>
      </div>

      <div
        className="kanban-card__status"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="kanban-card__status-button"
          type="button"
          onClick={() => setStatusMenuOpen((prev) => !prev)}
        >
          <span>
            {COLUMNS.find((col) => col.id === application.status)?.label || "Status"}
          </span>
          <span>▾</span>
        </button>

        {statusMenuOpen && (
          <div className="kanban-card__status-menu">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                className={`kanban-card__status-option ${
                  col.id === application.status ? "active" : ""
                }`}
                onClick={() => handleStatusChange(col.id)}
              >
                {col.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Star toggle */}
      <button
        className={`kanban-card__star ${starred ? "kanban-card__star--active" : ""}`}
        onClick={(e) => {
          e.stopPropagation(); // don't trigger drag
          setStarred((s) => !s);
        }}
        aria-label={starred ? "Unstar application" : "Star application"}
      >
        ★
      </button>
    </div>
  );
}
