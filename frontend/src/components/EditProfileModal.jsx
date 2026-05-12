import { useEffect, useState } from "react";
import { apiFetch } from "../api/auth";
import ConfirmModal from "./common/ConfirmModal";

const GENDER_OPTIONS = [
  { value: "", label: "What gender do you identify as?" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "self_describe", label: "Self-describe" },
];

const INDUSTRY_OPTIONS = [
  "",
  "Healthcare",
  "Information Technology",
  "Finance",
  "Education",
  "Engineering",
  "Marketing",
  "Retail",
  "Government",
  "Hospitality",
  "Other",
];

const LOCATION_OPTIONS = [
  "",
  "Sydney, NSW",
  "Melbourne, VIC",
  "Brisbane, QLD",
  "Perth, WA",
  "Adelaide, SA",
  "Hobart, TAS",
  "Canberra, ACT",
  "Darwin, NT",
  "Other",
];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  desired_role: "",
  industry: "",
  industry_other: "",
  years_of_experience: "",
  location: "",
  location_other: "",
  phone: "",
  gender: "",
  gender_self_described: "",
  linkedin_url: "",
  career_goal: "",
};

function getDropdownValue(value, options) {
  if (!value) return "";
  return options.includes(value) ? value : "Other";
}

function getOtherValue(value, options) {
  if (!value) return "";
  return options.includes(value) ? "" : value;
}

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        desired_role: profile.desired_role || "",
        industry: getDropdownValue(profile.industry, INDUSTRY_OPTIONS),
        industry_other: getOtherValue(profile.industry, INDUSTRY_OPTIONS),
        years_of_experience: profile.years_of_experience ?? "",
        location: getDropdownValue(profile.location, LOCATION_OPTIONS),
        location_other: getOtherValue(profile.location, LOCATION_OPTIONS),
        phone: profile.phone || "",
        gender: profile.gender || "",
        gender_self_described: profile.gender_self_described || "",
        linkedin_url: profile.linkedin_url || "",
        career_goal: profile.career_goal || "",
      });
    }
  }, [profile]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "industry" && value !== "Other") {
        next.industry_other = "";
      }

      if (name === "location" && value !== "Other") {
        next.location_other = "";
      }

      if (name === "gender" && value !== "self_describe") {
        next.gender_self_described = "";
      }

      return next;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    const payload = { ...form };

    if (payload.industry === "Other") {
      payload.industry = payload.industry_other.trim();
    }

    if (payload.location === "Other") {
      payload.location = payload.location_other.trim();
    }

    delete payload.industry_other;
    delete payload.location_other;

    if (
      payload.years_of_experience === "" ||
      payload.years_of_experience === null
    ) {
      delete payload.years_of_experience;
    } else {
      payload.years_of_experience = Number(payload.years_of_experience);
    }

    if (payload.gender !== "self_describe") {
      payload.gender_self_described = "";
    }

    try {
      const updated = await apiFetch("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      onSaved(updated);
      onClose();
    } catch (err) {
      const parsed = tryParseDrfError(err.message);

      if (parsed && typeof parsed === "object") {
        setFieldErrors(parsed);
        setError(parsed.detail || "Please check the form and try again.");
      } else {
        setError(err.message || "Failed to save changes.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    setSaving(true);
    setError(null);

    try {
      await apiFetch("/api/auth/me/", { method: "DELETE" });
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to delete profile.");
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <>
      <div
        className="new-app-modal__backdrop"
        onMouseDown={handleBackdropClick}
      >
        <div
          className="new-app-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
        >
          <div className="new-app-modal__header">
            <h2 id="edit-profile-modal-title">Edit Profile</h2>
            <button
              className="new-app-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form className="new-app-modal__form" onSubmit={handleSubmit}>
            <label>
              First Name
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First name"
              />
              <ErrorMessage error={fieldErrors.first_name} />
            </label>

            <label>
              Last Name
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last name"
              />
              <ErrorMessage error={fieldErrors.last_name} />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />
              <ErrorMessage error={fieldErrors.email} />
            </label>

            <div className="new-app-modal__inline-link">
              <a href="/forgot-password">Change Password</a>
            </div>

            <label>
              Desired Role
              <input
                name="desired_role"
                value={form.desired_role}
                onChange={handleChange}
                placeholder="What role are you looking for?"
              />
              <ErrorMessage error={fieldErrors.desired_role} />
            </label>

            <label>
              Industry
              <select
                name="industry"
                value={form.industry}
                onChange={handleChange}
              >
                <option value="" disabled hidden>
                  What industry are you working in?
                </option>
                {INDUSTRY_OPTIONS.filter(Boolean).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ErrorMessage error={fieldErrors.industry} />
            </label>

            {form.industry === "Other" && (
              <label>
                Please specify your industry
                <input
                  name="industry_other"
                  value={form.industry_other}
                  onChange={handleChange}
                  placeholder="Enter your industry"
                />
              </label>
            )}

            <label>
              Years of Experience
              <input
                name="years_of_experience"
                type="number"
                min="0"
                max="80"
                value={form.years_of_experience}
                onChange={handleChange}
                placeholder="How many years have you been in the industry?"
              />
              <ErrorMessage error={fieldErrors.years_of_experience} />
            </label>

            <label>
              Location
              <select
                name="location"
                value={form.location}
                onChange={handleChange}
              >
                <option value="" disabled hidden>
                  Where are you located?
                </option>
                {LOCATION_OPTIONS.filter(Boolean).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ErrorMessage error={fieldErrors.location} />
            </label>

            {form.location === "Other" && (
              <label>
                Please specify your location
                <input
                  name="location_other"
                  value={form.location_other}
                  onChange={handleChange}
                  placeholder="Enter your location"
                />
              </label>
            )}

            <label>
              Phone
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+61..."
              />
              <ErrorMessage error={fieldErrors.phone} />
            </label>

            <label>
              Gender
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="" disabled hidden>
                  What gender do you identify as?
                </option>
                {GENDER_OPTIONS.filter((option) => option.value).map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
              <ErrorMessage error={fieldErrors.gender} />
            </label>

            {form.gender === "self_describe" && (
              <label>
                Describe your gender
                <input
                  name="gender_self_described"
                  value={form.gender_self_described}
                  onChange={handleChange}
                  placeholder="Enter your gender"
                />
                <ErrorMessage error={fieldErrors.gender_self_described} />
              </label>
            )}

            <label>
              LinkedIn
              <input
                name="linkedin_url"
                type="url"
                value={form.linkedin_url}
                onChange={handleChange}
                placeholder="Link to LinkedIn profile"
              />
              <ErrorMessage error={fieldErrors.linkedin_url} />
            </label>

            <label>
              Career Goal
              <textarea
                name="career_goal"
                value={form.career_goal}
                onChange={handleChange}
                placeholder="What is your career goal?"
                rows="4"
              />
              <ErrorMessage error={fieldErrors.career_goal} />
            </label>

            {error && <div className="new-app-modal__error">{error}</div>}

            <div className="new-app-modal__actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                Delete Profile
              </button>

              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete profile?"
        message="Are you sure you want to delete your profile? This will deactivate your account."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <span className="new-app-modal__field-error">{formatError(error)}</span>
  );
}

function formatError(err) {
  if (Array.isArray(err)) return err.join(" ");
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}

function tryParseDrfError(message) {
  const dashIndex = message.indexOf("–");
  if (dashIndex === -1) return null;
  const jsonPart = message.slice(dashIndex + 1).trim();

  try {
    return JSON.parse(jsonPart);
  } catch {
    return null;
  }
}
