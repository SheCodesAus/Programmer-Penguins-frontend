import { useState } from "react";
import useKanban, { COLUMNS, COLUMN_ACCENT } from "../../hooks/useKanban";
import KanbanColumn from "./KanbanColumn";
import NewApplicationModal from "./NewApplicationModal";
import MotivationToast from "../MotivationToast";
import { getMotivationMessage } from "../../utils/motivationMessages";
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
    reload,
  } = useKanban();

  const [toastMessage, setToastMessage] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);

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

  return (
    <>
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
    </>
  );
}