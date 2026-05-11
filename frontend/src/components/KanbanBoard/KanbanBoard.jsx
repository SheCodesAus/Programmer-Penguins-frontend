import { useEffect, useState } from "react";
import useKanban, { COLUMNS, COLUMN_ACCENT } from "../../hooks/useKanban";
import KanbanColumn from "./KanbanColumn";
import NewApplicationModal from "./NewApplicationModal";
import MotivationToast from "../MotivationToast";
import { getMotivationMessage } from "../../utils/motivationMessages";
import { getRestoredApplicationBadges } from "../../utils/restoredApplications";
import ConfirmModal from "../common/ConfirmModal";
import { deleteApplication, updateApplicationInterest } from "../../api/applications";
import { Filter } from "lucide-react";
import { Link } from "react-router-dom";
import "./KanbanBoard.css";

export default function KanbanBoard() {
  const isLoggedIn = !!localStorage.getItem("token");

  const {
    grouped,
    loading,
    error,
    handleDragStart,
    handleDrop,
    changeCardStatus,
    createCard,
    updateCardInterestLocally,
    reload,
  } = useKanban();

  const [toastMessage, setToastMessage] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [interestFilter, setInterestFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoredBadges, setRestoredBadges] = useState(() =>
    getRestoredApplicationBadges()
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRestoredBadges(getRestoredApplicationBadges());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  function showToast(messageObject) {
    setToastMessage(messageObject);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleCreateCard(formData) {
    const newCard = await createCard(formData);

    showToast({
      text: getMotivationMessage({
        action: "created",
        toStatus: newCard.status,
      }),
      toStatus: newCard.status,
      action: "created",
    });

    return newCard;
  }

  async function handleStatusChange(cardId, newStatus) {
    await changeCardStatus(cardId, newStatus);

    showToast({
      text: getMotivationMessage({
        toStatus: newStatus,
      }),
      toStatus: newStatus,
    });
  }

  async function handleDropWithToast(toColumnId) {
    await handleDrop(toColumnId);

    showToast({
      text: getMotivationMessage({
        toStatus: toColumnId,
      }),
      toStatus: toColumnId,
    });
  }

  if (loading) {
    return <div className="kanban-board__loading">Loading your applications…</div>;
  }

  if (error) {
    return (
      <div className="kanban-board__error">
        <p>Something went wrong: {error}</p>
        <button onClick={reload}>Try again</button>
      </div>
    );
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    await deleteApplication(deleteTarget.id);
    setDeleteTarget(null);
    reload();
  }

  async function handleInterestChange(cardId, interestLevel) {
    updateCardInterestLocally(cardId, interestLevel);

    try {
      await updateApplicationInterest(cardId, interestLevel);
    } catch {
      reload();
    }
  }

  function filterCardsByInterest(cards) {
    if (interestFilter === 0) return cards;

    return cards.filter((card) => (card.interest_level || 0) === interestFilter);
  }

  function filterCardsBySearch(cards) {
    if (!searchQuery.trim()) return cards;

    const query = searchQuery.toLowerCase();

    return cards.filter((card) => {
      return (
        card.job_title?.toLowerCase().includes(query) ||
        card.company_name?.toLowerCase().includes(query)
      );
    });
  }

  const allApplications = COLUMNS.flatMap((col) => grouped[col.id] || []);

  const totalApplications = allApplications.length;

  const appliedApplications = allApplications.filter((app) =>
    ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"].includes(app.status)
  ).length;

  const interviewingApplications = allApplications.filter(
    (app) => app.status === "INTERVIEWING"
  ).length;

  const offerApplications = allApplications.filter(
    (app) => app.status === "OFFER"
  ).length;

  const interviewRate =
    appliedApplications > 0
      ? Math.round((interviewingApplications / appliedApplications) * 100)
      : 0;

  const offerRate =
    appliedApplications > 0
      ? Math.round((offerApplications / appliedApplications) * 100)
      : 0;

  const statusCounts = COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    count: grouped[col.id]?.length || 0,
  }));

  return (
    <>
      <div className="kanban-board__toolbar">
        <div className="kanban-board__interest-filter">
          <div className="kanban-board__filter-icon-wrapper">
            <Filter className="kanban-board__filter-icon" size={18} />
            <span className="kanban-board__filter-tooltip">Filter by interest</span>
          </div>

          <div className="kanban-board__filter-hearts">
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                className={`kanban-board__filter-heart ${
                  interestFilter === level ? "active" : ""
                }`}
                onClick={() =>
                  setInterestFilter(interestFilter === level ? 0 : level)
                }
                aria-label={`Show applications with ${level} hearts`}
              >
                ♥
              </button>
            ))}
          </div>

          {interestFilter > 0 && (
            <button
              type="button"
              className="kanban-board__filter-clear"
              onClick={() => setInterestFilter(0)}
            >
              Clear
            </button>
          )}

          <input
            type="text"
            className="kanban-board__search"
            placeholder="Search by company or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="kanban-board__actions">
            <Link to="/archive" className="kanban-board__icon-tooltip">
              📦
              <span className="kanban-board__icon-tooltip-text">
                Archived applications
              </span>
            </Link>

            <Link to="/trash" className="kanban-board__icon-tooltip">
              🗑
              <span className="kanban-board__icon-tooltip-text">
                Deleted applications
              </span>
            </Link>
          </div>
        </div>

        <div className="kanban-board__stats-card">
          <div className="kanban-board__stat-tooltip">
            <span className="kanban-board__stats-total">{totalApplications}</span>
            <small>Total</small>
            <span className="kanban-board__icon-tooltip-text">
              Total active applications on your Kanban board
            </span>
          </div>

          <div className="kanban-board__stats-divider" />

          <div className="kanban-board__status-counts">
            {statusCounts.map((status) => (
              <div key={status.id} className="kanban-board__status-count">
                <span>{status.count}</span>
                <small>{status.label}</small>
              </div>
            ))}
          </div>

          <div className="kanban-board__stats-divider" />

          <div className="kanban-board__stat-tooltip">
            <span className="kanban-board__stats-rate">{interviewRate}%</span>
            <small>Interview</small>
            <span className="kanban-board__icon-tooltip-text">
              Interview rate based on applications that moved past Found
            </span>
          </div>

          <div className="kanban-board__stat-tooltip">
            <span className="kanban-board__stats-rate">{offerRate}%</span>
            <small>Offer</small>
            <span className="kanban-board__icon-tooltip-text">
              Offer rate based on applications that moved past Found
            </span>
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={filterCardsBySearch(
              filterCardsByInterest(grouped[col.id] || [])
            )}
            accentColor={COLUMN_ACCENT[col.id]}
            onDragStart={handleDragStart}
            onDrop={handleDropWithToast}
            onAddClick={(columnId) => setAddingToColumn(columnId)}
            isLoggedIn={isLoggedIn}
            onStatusChange={handleStatusChange}
            onDeleteRequest={setDeleteTarget}
            onInterestChange={handleInterestChange}
            interestFilter={interestFilter}
            restoredBadges={restoredBadges}
          />
        ))}
      </div>

      <NewApplicationModal
        isOpen={addingToColumn !== null}
        defaultStatus={addingToColumn}
        onClose={() => setAddingToColumn(null)}
        onCreate={handleCreateCard}
      />

      <MotivationToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Are you sure?"
        message={`Are you sure you want to delete "${deleteTarget?.job_title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
