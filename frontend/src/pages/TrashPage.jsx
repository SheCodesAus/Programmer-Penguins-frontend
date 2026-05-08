import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchDeletedApplications,
  restoreApplication,
} from "../api/applications";
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
    loadDeletedApplications();
  }, []);

  async function handleRestore(id) {
    try {
      await restoreApplication(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      setError(err.message || "Could not restore application.");
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
          ◀ Back to Kanban
        </button>

        <h1>Deleted Applications</h1>
      </div>

      {loading && <p className="archive-trash-page__message">Loading...</p>}
      {error && <p className="archive-trash-page__error">{error}</p>}

      {!loading && applications.length === 0 && (
        <p className="archive-trash-page__message">
          No deleted applications yet.
        </p>
      )}

      <div className="archive-trash-page__list">
        {applications.map((app) => (
          <article className="archive-trash-card" key={app.id}>
            <div>
              <h2>{app.job_title}</h2>
              <p>{app.company_name}</p>
              <span>{app.status_display || app.status}</span>
            </div>

            <button
              className="primary-btn"
              type="button"
              onClick={() => handleRestore(app.id)}
            >
              Restore
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}