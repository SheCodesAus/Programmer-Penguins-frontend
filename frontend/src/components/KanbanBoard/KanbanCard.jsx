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
function getFaviconUrl(application) {
  if (!application.job_url) return null;

  try {
    const url = new URL(application.job_url);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=40`;
  } catch {
    return null;
  }
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
  onDeleteRequest,
  onInterestChange,
  interestFilter,
}) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const interestLevel = application.interest_level || 0;
  const isHidden = interestFilter > 0 && interestLevel < interestFilter;

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

  const faviconUrl = getFaviconUrl(application);

return (
  <div
    className={`kanban-card kanban-card--interest-${interestLevel} ${
      isHidden ? "kanban-card--hidden" : ""
    } ${isDragging ? "kanban-card--dragging" : ""}`}
    style={{ "--accent": accentColor }}
    draggable
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onClick={handleClick}
  >

      {/* Company logo */}
      <div className="kanban-card__logo">
        {imgError || !faviconUrl ? (
          <div
            className="kanban-card__logo-fallback"
            style={{ background: accentColor }}
          >
            {initials}
          </div>
        ) : (
          <img
            src={faviconUrl}
            alt={`${application.company_name} logo`}
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

      {/* Interest level hearts */}
      <div
        className="kanban-card__hearts"
        onClick={(e) => e.stopPropagation()}
        aria-label="Application interest level"
      >
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            className={`kanban-card__heart ${
              interestLevel >= level ? "kanban-card__heart--active" : ""
            }`}
            onClick={() =>
              onInterestChange(
                application.id,
                interestLevel === level ? 0 : level
              )
            }
            aria-label={`Set interest level to ${level}`}
          >
            ♥
          </button>
        ))}
      </div>

      <button
        className="kanban-card__delete"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRequest(application);
        }}
        aria-label="Delete application"
      >
        ×
      </button>
    </div>
  );
}
