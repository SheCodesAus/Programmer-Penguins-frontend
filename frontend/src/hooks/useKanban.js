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
  FOUND: "#F472B6", // pink
  APPLIED: "#60A5FA", // blue
  INTERVIEWING: "#4ADE80", // green
  OFFER: "#FACC15", // yellow
  REJECTED: "#F87171", // red
  WITHDRAWN: "#94A3B8", // slate
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
        const status = application.status;

        if (normalised[status]) {
          normalised[status].push(application);
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
      setGrouped((prev) => {
        const card = prev[toColumnId]?.find((c) => c.id === cardId);
        if (!card) return prev;
        return {
          ...prev,
          [toColumnId]: prev[toColumnId].filter((c) => c.id !== cardId),
          [fromColId]: [...(prev[fromColId] || []), card],
        };
      });
      setError(`Could not move card: ${err.message}`);
    } finally {
      dragCardId.current = null;
      dragFromCol.current = null;
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

  return {
    grouped,
    loading,
    error,
    handleDragStart,
    handleDrop,
    createCard,
    reload: loadBoard,
  };
}
