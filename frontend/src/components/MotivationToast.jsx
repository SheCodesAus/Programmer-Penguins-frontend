import Confetti from "react-confetti";
import "./MotivationToast.css";

function getEmoji(toStatus, action) {
  if (action === "created") return "🚀";
  if (toStatus === "APPLIED") return "📩";
  if (toStatus === "INTERVIEWING") return "🎯";
  if (toStatus === "OFFER") return "🎉";
  if (toStatus === "REJECTED") return "💪";
  if (toStatus === "WITHDRAWN") return "🧭";
  return "✨";
}

function getToneClass(toStatus, action) {
  if (action === "created") return "motivation-modal--created";
  if (toStatus === "APPLIED") return "motivation-modal--applied";
  if (toStatus === "INTERVIEWING") return "motivation-modal--interviewing";
  if (toStatus === "OFFER") return "motivation-modal--offer";
  if (toStatus === "REJECTED") return "motivation-modal--rejected";
  if (toStatus === "WITHDRAWN") return "motivation-modal--withdrawn";
  return "";
}

export default function MotivationToast({ message, onClose }) {
  if (!message) return null;

  const emoji = getEmoji(message.toStatus, message.action);
  const toneClass = getToneClass(message.toStatus, message.action);
  const showConfetti =
    message.toStatus !== "REJECTED" && message.toStatus !== "WITHDRAWN";

  return (
    <div className="motivation-overlay" onClick={onClose}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={220}
          recycle={false}
          gravity={0.25}
        />
      )}

      <div
        className={`motivation-modal ${toneClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="motivation-emoji">{emoji}</div>
        <p>{message.text}</p>

        <button onClick={onClose} className="primary-btn">
          Nice!
        </button>
      </div>
    </div>
  );
}
