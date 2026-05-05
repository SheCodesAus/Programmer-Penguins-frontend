import { useState, useEffect } from "react";
import { COLUMNS } from "../../hooks/useKanban";
import { extractJobFromUrl } from "../../api/applications";
import { WandSparkles } from "lucide-react";
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
  source_platform: "OTHER",
  source_details: "",
  job_url: "",
  location: "",
  status: "",
  date_posted: "",
  date_applied: "",
  salary_min: "",
  salary_max: "",
  currency: "AUD",
};

function cleanFormData(form) {
  return {
    ...form,

    status: form.status || "FOUND",

    date_posted: form.date_posted || null,
    date_applied: form.date_applied || null,

    salary_min: form.salary_min === "" ? null : form.salary_min,
    salary_max: form.salary_max === "" ? null : form.salary_max,

    source_platform: form.source_platform || "",
    source_details:
      form.source_platform === "OTHER" ? form.source_details : "",
  };
}

export default function NewApplicationModal({
  isOpen,
  defaultStatus,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [jobLink, setJobLink] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, status: defaultStatus || "FOUND" });
      setError(null);
      setJobLink("");
      setSubmitting(false);
      setExtracting(false);
    }
  }, [isOpen, defaultStatus]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleJobLinkDrop(e) {
    e.preventDefault();
    const droppedText = e.dataTransfer.getData("text/plain");

    if (droppedText) {
      setJobLink(droppedText);
      setForm((prev) => ({
        ...prev,
        job_url: droppedText,
      }));
    }
  }

  function handleJobLinkDragOver(e) {
    e.preventDefault();
  }

  async function handleExtractJobDetails() {
    setExtracting(true);
    setError(null);

    try {
      const data = await extractJobFromUrl(jobLink);

      setForm((prev) => ({
        ...prev,
        job_url: data.job_url || jobLink,
        job_title: data.job_title || prev.job_title,
        company_name: data.company_name || prev.company_name,
        source_platform: data.source_platform || prev.source_platform,
        source_details: data.source_details || prev.source_details,
        date_posted: data.date_posted || prev.date_posted,
        date_applied: data.date_applied || prev.date_applied,
        salary_min: data.salary_min ?? prev.salary_min,
        salary_max: data.salary_max ?? prev.salary_max,
        currency: data.currency || prev.currency,
        location: data.location || prev.location,
      }));
    } catch {
      setError("Could not extract job details from this link.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = cleanFormData(form);

      await onCreate(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Could not create application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="new-app-modal__backdrop" onClick={onClose}>
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
          <div
            className="new-app-modal__link-drop"
            onDrop={handleJobLinkDrop}
            onDragOver={handleJobLinkDragOver}
          >
            <span className="new-app-modal__link-title">Add a job link</span>

            <p>
              Paste or drag a job advertisement link here to help auto-fill this
              application.
            </p>

            <input
              type="url"
              value={jobLink}
              onChange={(e) => {
                setJobLink(e.target.value);
                setForm((prev) => ({
                  ...prev,
                  job_url: e.target.value,
                }));
              }}
              placeholder="https://www.seek.com.au/job/..."
            />

            <button
              type="button"
              className="new-app-modal__autofill-btn"
              disabled={!jobLink || extracting}
              onClick={handleExtractJobDetails}
            >
              {extracting ? (
                "Extracting..."
              ) : (
                <>
                  <WandSparkles size={14} className="spin" />
                  Auto-fill
                </>
              )}
            </button>
          </div>

          <label>
            <span>Job title *</span>
            <input
              name="job_title"
              value={form.job_title || ""}
              onChange={handleChange}
              required
              autoFocus
            />
          </label>

          <label>
            <span>Company *</span>
            <input
              name="company_name"
              value={form.company_name || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Source</span>
            <select
              name="source_platform"
              value={form.source_platform || ""}
              onChange={handleChange}
            >
              <option value="">Select source</option>
              {SOURCE_PLATFORMS.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>

          {form.source_platform === "OTHER" && (
            <label>
              <span>Specify source</span>
              <input
                name="source_details"
                value={form.source_details || ""}
                onChange={handleChange}
                placeholder="e.g. referral, company site"
              />
            </label>
          )}

          <label>
            <span>Job URL</span>
            <input
              type="url"
              name="job_url"
              value={form.job_url || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Location</span>
            <input
              name="location"
              value={form.location || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Status</span>
            <select
              name="status"
              value={form.status || ""}
              onChange={handleChange}
            >
              {COLUMNS.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date posted</span>
            <input
              type="date"
              name="date_posted"
              value={form.date_posted || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Date applied</span>
            <input
              type="date"
              name="date_applied"
              value={form.date_applied || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Salary min</span>
            <input
              type="number"
              name="salary_min"
              value={form.salary_min ?? ""}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g. 70000"
            />
          </label>

          <label>
            <span>Salary max</span>
            <input
              type="number"
              name="salary_max"
              value={form.salary_max ?? ""}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g. 90000"
            />
          </label>

          <label>
            <span>Currency</span>
            <input
              name="currency"
              value={form.currency || ""}
              onChange={handleChange}
              placeholder="AUD"
              maxLength="10"
            />
          </label>

          {error && <div className="new-app-modal__error">{error}</div>}

          <div className="new-app-modal__actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Saving…" : "Add application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}