import { useState, useEffect } from "react";
import { updateApplication } from "../api/applications.js";

const STATUS_CHOICES = [
  { value: "bookmarked", label: "Bookmarked" },
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "accepted", label: "Accepted" },
];

const SOURCE_PLATFORM_CHOICES = [
  { value: "", label: "— None —" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "company_website", label: "Company Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

const INTEREST_LEVEL_CHOICES = [
  { value: 1, label: "1 – Low" },
  { value: 2, label: "2 – Medium" },
  { value: 3, label: "3 – High" },
];

function toDateInputValue(val) {
  if (!val) return "";
  return val.slice(0, 10);
}

export default function EditApplicationModal({ application, onClose, onSaved }) {
  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    source_platform: "",
    source_details: "",
    job_url: "",
    date_posted: "",
    date_applied: "",
    salary_min: "",
    salary_max: "",
    currency: "AUD",
    location: "",
    status: "applied",
    interest_level: 3,
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (application) {
      setForm({
        job_title: application.job_title || "",
        company_name: application.company_name || "",
        source_platform: application.source_platform || "",
        source_details: application.source_details || "",
        job_url: application.job_url || "",
        date_posted: toDateInputValue(application.date_posted),
        date_applied: toDateInputValue(application.date_applied),
        salary_min: application.salary_min ?? "",
        salary_max: application.salary_max ?? "",
        currency: application.currency || "AUD",
        location: application.location || "",
        status: application.status || "applied",
        interest_level: application.interest_level ?? 3,
        is_active: application.is_active ?? true,
      });
    }
  }, [application]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min === "" ? null : Number(form.salary_min),
        salary_max: form.salary_max === "" ? null : Number(form.salary_max),
        interest_level: Number(form.interest_level),
        date_posted: form.date_posted || null,
        date_applied: form.date_applied || null,
      };
      const updated = await updateApplication(application.id, payload);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="new-app-modal__backdrop" onMouseDown={handleBackdropClick}>
      <div className="new-app-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
        {/* Header */}
        <div className="new-app-modal__header">
          <h2 id="edit-modal-title">Edit Application</h2>
          <button className="new-app-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Form */}
        <form className="new-app-modal__form" onSubmit={handleSubmit}>

          {/* Job title */}
          <label>
            Job Title
            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              placeholder="e.g. Frontend Engineer"
              required
            />
          </label>

          {/* Company */}
          <label>
            Company Name
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="e.g. She Codes"
              required
            />
          </label>

          {/* Status */}
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {/* Source platform */}
          <label>
            Source Platform
            <select name="source_platform" value={form.source_platform} onChange={handleChange}>
              {SOURCE_PLATFORM_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {/* Source details */}
          <label>
            Source Details
            <input
              name="source_details"
              value={form.source_details}
              onChange={handleChange}
              placeholder="e.g. Referred by Jane"
            />
          </label>

          {/* Job URL */}
          <label>
            Job URL
            <input
              name="job_url"
              type="url"
              value={form.job_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <label>
              Date Posted
              <input
                name="date_posted"
                type="date"
                value={form.date_posted}
                onChange={handleChange}
              />
            </label>
            <label>
              Date Applied
              <input
                name="date_applied"
                type="date"
                value={form.date_applied}
                onChange={handleChange}
              />
            </label>
          </div>

          {/* Salary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <label>
              Salary Min
              <input
                name="salary_min"
                type="number"
                min="0"
                value={form.salary_min}
                onChange={handleChange}
                placeholder="0"
              />
            </label>
            <label>
              Salary Max
              <input
                name="salary_max"
                type="number"
                min="0"
                value={form.salary_max}
                onChange={handleChange}
                placeholder="0"
              />
            </label>
            <label>
              Currency
              <input
                name="currency"
                value={form.currency || ""}
                onChange={handleChange}
                placeholder="AUD"
                maxLength="10"
              />
            </label>
          </div>

          {/* Location */}
          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Remote, Sydney"
            />
          </label>

          {/* Interest level */}
          <label>
            Interest Level
            <select name="interest_level" value={form.interest_level} onChange={handleChange}>
              {INTEREST_LEVEL_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          {/* Error */}
          {error && <div className="new-app-modal__error">{error}</div>}

          {/* Actions */}
          <div className="new-app-modal__actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}