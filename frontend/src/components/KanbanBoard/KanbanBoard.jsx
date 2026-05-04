import { useState } from "react";
import useKanban, { COLUMNS, COLUMN_ACCENT } from "../../hooks/useKanban";
import KanbanColumn from "./KanbanColumn";
import NewApplicationModal from "./NewApplicationModal";
import MotivationToast from "../MotivationToast";
import { getMotivationMessage } from "../../utils/motivationMessages";
import ConfirmModal from "../common/ConfirmModal";
import { deleteApplication,  updateApplicationInterest } from "../../api/applications";
import { Filter } from "lucide-react";
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
    return (
      <div className="kanban-board__loading">Loading your applications…</div>
    );
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
    } catch (err) {
      reload();
    }
  }

  function filterCardsByInterest(cards) {
    if (interestFilter === 0) return cards;

    return cards.filter(
      (card) => (card.interest_level || 0) >= interestFilter
    );
  }

  return (
    <>
    <div className="kanban-board__interest-filter">
      <div className="kanban-board__filter-icon-wrapper">
        <Filter className="kanban-board__filter-icon" size={18} />
        <span className="kanban-board__tooltip">Filter by interest</span>
      </div>

      <div className="kanban-board__filter-hearts">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            className={`kanban-board__filter-heart ${
              interestFilter >= level ? "active" : ""
            }`}
            onClick={() =>
              setInterestFilter(interestFilter === level ? 0 : level)
            }
            aria-label={`Show applications with at least ${level} hearts`}
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
    </div>

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={grouped[col.id] || []}
            accentColor={COLUMN_ACCENT[col.id]}
            onDragStart={handleDragStart}
            onDrop={handleDropWithToast}
            onAddClick={(columnId) => setAddingToColumn(columnId)}
            isLoggedIn={isLoggedIn}
            onStatusChange={handleStatusChange}
            onDeleteRequest={setDeleteTarget}
            onInterestChange={handleInterestChange}
            interestFilter={interestFilter}
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