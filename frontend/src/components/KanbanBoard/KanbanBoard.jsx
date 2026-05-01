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

  const [toastMessage, setToastMessage] = useState("");
  const [addingToColumn, setAddingToColumn] = useState(null);

  async function handleCreateCard(formData) {
    const newCard = await createCard(formData);

    setToastMessage(
      getMotivationMessage({
        action: "created",
        toStatus: newCard.status,
      })
    );

    return newCard;
  }

  async function handleStatusChange(cardId, newStatus) {
    await changeCardStatus(cardId, newStatus);

    setToastMessage(
      getMotivationMessage({
        toStatus: newStatus,
      })
    );
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
            onDrop={handleDrop}
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
        onClose={() => setToastMessage("")}
      />
    </>
  );
}