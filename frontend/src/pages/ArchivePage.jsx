import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchArchivedApplications,
  restoreApplication,
} from "../api/applications";
import { apiFetch } from "../api/auth";
import { markApplicationRestored } from "../utils/restoredApplications";
import "./ArchiveTrashPage.css";

export default function ArchivePage() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  async function loadArchivedApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await fetchArchivedApplications();
      setApplications(data);
    } catch (err) {
      setError(err.message || "Could not load archived applications.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    try {
      const data = await apiFetch("/api/auth/me/");
      setProfile(data);
    } catch (err) {
      setError(err.message || "Could not load archive settings.");
    }
  }

  useEffect(() => {
    loadArchivedApplications();
    loadProfile();
  }, []);

  async function handleAutoArchiveChange(event) {
    const value = Number(event.target.value);

    try {
      const updatedProfile = await apiFetch("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify({
          auto_archive_days: value,
        }),
      });

      setProfile(updatedProfile);
    } catch (err) {
      setError(err.message || "Could not update archive settings.");
    }
  }

  async function handleRestore(id) {
    try {
      await restoreApplication(id);
      markApplicationRestored(id, "archive");
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
          ◀ Back to Kanban
        </button>

        <h1>Archived Applications</h1>

        {profile && (
          <div className="archive-trash-page__setting">
            <label htmlFor="auto-archive">Auto archive after</label>

            <select
              id="auto-archive"
              value={profile.auto_archive_days ?? 30}
              onChange={handleAutoArchiveChange}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        )}
      </div>

      {loading && <p className="archive-trash-page__message">Loading...</p>}
      {error && <p className="archive-trash-page__error">{error}</p>}

      {!loading && applications.length === 0 && (
        <p className="archive-trash-page__message">
          No archived applications yet.
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
