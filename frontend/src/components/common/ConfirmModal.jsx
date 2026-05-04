import "./ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal__backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="confirm-modal__close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="confirm-modal__actions">
            {cancelText && (
                <button type="button" className="secondary-btn" onClick={onCancel}>
                {cancelText}
                </button>
            )}

            <button type="button" className="danger-btn" onClick={onConfirm}>
                {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
}