import "./MotivationToast.css";

export default function MotivationToast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="motivation-toast">
      <p>{message}</p>
      <button onClick={onClose} aria-label="Close message">
        ×
      </button>
    </div>
  );
}