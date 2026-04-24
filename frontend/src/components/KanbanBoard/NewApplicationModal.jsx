import { useState, useEffect } from "react";
import { COLUMNS } from "../../hooks/useKanban";
import "./NewApplicationModal.css";

const SOURCE_PLATFORMS = [
  { value: "SEEK", label: "Seek" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INDEED", label: "Indeed" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
  job_title: "",
  company_name: "",
  source_platform: "SEEK",
  source_details: "",
  job_url: "",
  location: "",
  status: "FOUND",
};

export default function NewApplicationModal({
  isOpen,
  defaultStatus,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // When the modal opens, reset the form and pre-select the column's status
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, status: defaultStatus || "FOUND" });
      setError(null);
    }
  }, [isOpen, defaultStatus]);

  // Don't render anything when closed — this is cheaper than display:none
  if (!isOpen) return null;

  // Single handler for every text/select input
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // If source isn't "OTHER", backend will blank source_details anyway,
      // but sending empty string is safe and explicit.
      await onCreate(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Backdrop: clicking it closes the modal
    <div className="new-app-modal__backdrop" onClick={onClose}>
      {/* stopPropagation so clicks INSIDE the modal don't close it */}
      <div className="new-app-modal" onClick={(e) => e.stopPropagation()}>
        <div className="new-app-modal__header">
          <h2>New application</h2>
          <button
            className="new-app-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-app-modal__form">
          {/* Required: job_title */}
          <label>
            <span>Job title *</span>
            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              required
              autoFocus
            />
          </label>

          {/* Required: company_name */}
          <label>
            <span>Company *</span>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
            />
          </label>

          {/* Source platform dropdown */}
          <label>
            <span>Source</span>
            <select
              name="source_platform"
              value={form.source_platform}
              onChange={handleChange}
            >
              {SOURCE_PLATFORMS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* Only show "specify" field when source is OTHER,
                        matching the backend validator in the serializer */}
          {form.source_platform === "OTHER" && (
            <label>
              <span>Specify source *</span>
              <input
                name="source_details"
                value={form.source_details}
                onChange={handleChange}
                required
                placeholder="e.g. Referred by a friend"
              />
            </label>
          )}

          <label>
            <span>Job URL</span>
            <input
              type="url"
              name="job_url"
              value={form.job_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          <label>
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Sydney, NSW"
            />
          </label>

          {/* Status dropdown — lets user override the pre-selected column */}
          <label>
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
          </label>

          {/* Error message from the API (serializer errors land here) */}
          {error && <div className="new-app-modal__error">{error}</div>}

          <div className="new-app-modal__actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="primary">
              {submitting ? "Saving…" : "Add application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
