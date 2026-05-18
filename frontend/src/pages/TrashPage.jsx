import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchDeletedApplications,
  restoreApplication,
} from "../api/applications";
import LoadingState from "../components/common/LoadingState";
import { markApplicationRestored } from "../utils/restoredApplications";
import "./ArchiveTrashPage.css";

export default function TrashPage() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDeletedApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchDeletedApplications();
      setApplications(data);
    } catch (err) {
      setError(err.message || "Could not load deleted applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadDeletedApplications();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function handleRestore(id) {
    try {
      await restoreApplication(id);
      markApplicationRestored(id, "trash");
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      setError(err.message || "Could not restore application.");
    }
  }

  function openApplication(id) {
    navigate(`/job-application/${id}`);
  }

  function handleCardKeyDown(event, id) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openApplication(id);
    }
  }

  return (
    <main className="archive-trash-page">
      <div className="archive-trash-page__header">
        <button
          className="secondary-btn"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ◀ Return to dashboard
        </button>

        <h1>Deleted Applications</h1>
      </div>

      {loading && <LoadingState />}
      {error && <p className="archive-trash-page__error">{error}</p>}

      {!loading && applications.length === 0 && (
        <p className="archive-trash-page__message">
          No deleted applications yet.
        </p>
      )}

      <div className="archive-trash-page__list">
        {applications.map((app) => (
          <article
            className="archive-trash-card"
            key={app.id}
            role="button"
            tabIndex={0}
            onClick={() => openApplication(app.id)}
            onKeyDown={(event) => handleCardKeyDown(event, app.id)}
          >
            <div>
              <h2>{app.job_title}</h2>
              <p>{app.company_name}</p>
              <span>{app.status_display || app.status}</span>
            </div>

            <div className="archive-trash-card__actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openApplication(app.id);
                }}
              >
                View details
              </button>

              <button
                className="primary-btn"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRestore(app.id);
                }}
              >
                Restore
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
