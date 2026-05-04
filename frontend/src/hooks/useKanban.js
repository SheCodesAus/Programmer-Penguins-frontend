import { useState, useEffect, useRef } from "react";
import {
  fetchKanbanApplications,
  updateApplicationStatus,
  createApplication,
} from "../api/applications";

export const COLUMNS = [
  { id: "FOUND", label: "Found" },
  { id: "APPLIED", label: "Applied" },
  { id: "INTERVIEWING", label: "Interviewing" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
  { id: "WITHDRAWN", label: "Withdrawn" },
];

export const COLUMN_ACCENT = {
  FOUND: "#F472B6",
  APPLIED: "#60A5FA",
  INTERVIEWING: "#4ADE80",
  OFFER: "#FACC15",
  REJECTED: "#F87171",
  WITHDRAWN: "#94A3B8",
};

export default function useKanban() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dragCardId = useRef(null);
  const dragFromCol = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    loadBoard({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  async function loadBoard({ signal } = {}) {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchKanbanApplications({ signal });

      const normalised = {};
      COLUMNS.forEach((col) => {
        normalised[col.id] = [];
      });

      data.forEach((application) => {
        if (normalised[application.status]) {
          normalised[application.status].push(application);
        }
      });

      setGrouped(normalised);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  function handleDragStart(cardId, fromColumnId) {
    dragCardId.current = cardId;
    dragFromCol.current = fromColumnId;
  }

  async function handleDrop(toColumnId) {
    const cardId = dragCardId.current;
    const fromColId = dragFromCol.current;

    if (!cardId || fromColId === toColumnId) return;

    setGrouped((prev) => {
      const card = prev[fromColId]?.find((c) => c.id === cardId);
      if (!card) return prev;

      return {
        ...prev,
        [fromColId]: prev[fromColId].filter((c) => c.id !== cardId),
        [toColumnId]: [
          ...(prev[toColumnId] || []),
          { ...card, status: toColumnId },
        ],
      };
    });

    try {
      await updateApplicationStatus(cardId, toColumnId);
    } catch (err) {
      setError(`Could not move card: ${err.message}`);
      loadBoard();
    } finally {
      dragCardId.current = null;
      dragFromCol.current = null;
    }
  }

  async function changeCardStatus(cardId, newStatus) {
    setGrouped((prev) => {
      let movedCard = null;
      const next = { ...prev };

      for (const columnId of Object.keys(next)) {
        const card = next[columnId]?.find((c) => c.id === cardId);

        if (card) {
          movedCard = { ...card, status: newStatus };
          next[columnId] = next[columnId].filter((c) => c.id !== cardId);
          break;
        }
      }

      if (movedCard) {
        next[newStatus] = [...(next[newStatus] || []), movedCard];
      }

      return next;
    });

    try {
      await updateApplicationStatus(cardId, newStatus);
    } catch (err) {
      setError(`Could not update status: ${err.message}`);
      loadBoard();
    }
  }

  async function createCard(formData) {
    const newCard = await createApplication(formData);

    setGrouped((prev) => ({
      ...prev,
      [newCard.status]: [...(prev[newCard.status] || []), newCard],
    }));

    return newCard;
  }

  function updateCardInterestLocally(cardId, interestLevel) {
    setGrouped((prev) => {
      const next = {};

      for (const columnId of Object.keys(prev)) {
        next[columnId] = prev[columnId].map((card) =>
          card.id === cardId
            ? { ...card, interest_level: interestLevel }
            : card
        );
      }

      return next;
    });
  }

  return {
    grouped,
    loading,
    error,
    handleDragStart,
    handleDrop,
    changeCardStatus,
    createCard,
    updateCardInterestLocally,
    reload: loadBoard,
  };
}