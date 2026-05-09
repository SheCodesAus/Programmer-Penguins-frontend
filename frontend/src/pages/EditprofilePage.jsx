import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/auth";
import "./EditprofilePage.css";

// ── Dropdown options ─────────────────────────────────────────────────────────
// Gender values match GenderChoices in accounts/models.py
const GENDER_OPTIONS = [
  { value: "", label: "What gender do you identify as?" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "self_describe", label: "Self-describe" },
];

// Industry list — pick whatever set makes sense for your users.
// Backend stores this as a free-form CharField, so adding/removing here
// doesn't require a migration.
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

// Australian states/territories — same idea as industry, just for Location dropdown
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

// Empty form state — used while the initial fetch is in flight,
// so React doesn't complain about controlled-input value flipping
// from undefined → string.
const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  industry: "",
  years_of_experience: "",
  location: "",
  gender: "",
  gender_self_described: "",
  linkedin_url: "",
  career_goal: "",
};

export default function EditProfilePage() {
  const navigate = useNavigate();

  // ── Form + UI state ──────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // fieldErrors holds per-field validation errors from DRF, e.g.
  // { email: ["This email is already registered."] }
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Load current profile on mount ────────────────────────────────────────
  useEffect(() => {
    apiFetch("/api/auth/me/")
      .then((profile) => {
        // Convert null/undefined backend values to empty strings so
        // the inputs stay controlled.
        setForm({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          industry: profile.industry || "",
          // years_of_experience comes back as integer or null
          years_of_experience: profile.years_of_experience ?? "",
          location: profile.location || "",
          gender: profile.gender || "",
          gender_self_described: profile.gender_self_described || "",
          linkedin_url: profile.linkedin_url || "",
          career_goal: profile.career_goal || "",
        });
      })
      .catch((err) => setTopError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Single change handler for every input ────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as the user types — friendlier than
    // leaving stale errors visible after the user has fixed something
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  // ── Save: PATCH /api/auth/me/ ────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setTopError("");
    setFieldErrors({});
    setSuccessMsg("");

    // Build the payload. Send years_of_experience as a number (or omit it
    // entirely if blank) — the backend expects a PositiveIntegerField.
    const payload = { ...form };
    if (
      payload.years_of_experience === "" ||
      payload.years_of_experience === null
    ) {
      delete payload.years_of_experience;
    } else {
      payload.years_of_experience = Number(payload.years_of_experience);
    }
    // If gender isn't "self_describe", don't send the self-described value
    if (payload.gender !== "self_describe") {
      payload.gender_self_described = "";
    }

    try {
      await apiFetch("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSuccessMsg("Profile updated successfully.");
      // Brief moment to show the success state, then back to profile
      setTimeout(() => navigate("/profile"), 800);
    } catch (err) {
      // DRF returns validation errors as JSON in the error body.
      // The apiFetch wrapper attaches that body string to err.message.
      // We try to parse it; if it's not JSON (e.g. 500), show the raw text.
      const parsed = tryParseDrfError(err.message);
      if (parsed && typeof parsed === "object") {
        setFieldErrors(parsed);
        if (parsed.detail) setTopError(parsed.detail);
      } else {
        setTopError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete profile (deactivates the account) ─────────────────────────────
  // Your backend's MyProfileView.destroy soft-deactivates the user
  // (sets is_active=False). That means logging back in won't work after this.
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your profile? This will deactivate your account.",
    );
    if (!confirmed) return;

    try {
      await apiFetch("/api/auth/me/", { method: "DELETE" });
      // Clear auth and bounce to login
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/login");
    } catch (err) {
      setTopError(err.message);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return <main className="edit-profile-page__message">Loading profile…</main>;
  }

  return (
    <main className="edit-profile-page">
      <form className="edit-profile-form" onSubmit={handleSubmit} noValidate>
        <h1 className="edit-profile-form__title">Edit Profile</h1>

        {topError && (
          <div className="edit-profile-form__top-error">{topError}</div>
        )}
        {successMsg && (
          <div className="edit-profile-form__success">{successMsg}</div>
        )}

        {/* ── Two-column grid layout ── */}
        <div className="edit-profile-form__grid">
          {/* ── Left column ── */}
          <Field
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={fieldErrors.first_name}
          />

          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          <Field
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            error={fieldErrors.last_name}
          />

          {/* "Change Password" — link, not a regular field */}
          {/* Routes to your existing forgot-password flow */}
          <div className="edit-profile-form__field edit-profile-form__field--link">
            <a
              href="/forgot-password"
              className="edit-profile-form__change-password"
            >
              Change Password
            </a>
          </div>

          <SelectField
            label="Industry"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="What industry are you working in?"
            options={INDUSTRY_OPTIONS}
            error={fieldErrors.industry}
          />

          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            // Gender uses a different shape (value/label objects) so
            // we pass options directly rather than mapping strings
            options={GENDER_OPTIONS}
            rawOptions
            error={fieldErrors.gender}
          />

          <Field
            label="Years of Experience"
            name="years_of_experience"
            type="number"
            min="0"
            max="80"
            value={form.years_of_experience}
            onChange={handleChange}
            placeholder="Years have you been in the industry"
            error={fieldErrors.years_of_experience}
          />

          <Field
            label="LinkedIn"
            name="linkedin_url"
            type="url"
            value={form.linkedin_url}
            onChange={handleChange}
            placeholder="Link to LinkedIn profile"
            error={fieldErrors.linkedin_url}
          />

          <SelectField
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Where are you located"
            options={LOCATION_OPTIONS}
            error={fieldErrors.location}
          />

          <Field
            label="Desired career goal"
            name="career_goal"
            value={form.career_goal}
            onChange={handleChange}
            placeholder="What is your career goal?"
            error={fieldErrors.career_goal}
          />

          {/* Conditional self-describe field — only renders when
                        the user picks "Self-describe" in the gender dropdown,
                        matching the backend serializer's validation rule */}
          {form.gender === "self_describe" && (
            <Field
              label="Describe your gender"
              name="gender_self_described"
              value={form.gender_self_described}
              onChange={handleChange}
              error={fieldErrors.gender_self_described}
            />
          )}
        </div>

        {/* ── Action buttons (stacked, centered) ── */}
        <div className="edit-profile-form__actions">
          <button
            type="submit"
            className="edit-profile-form__save"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>

          <button
            type="button"
            className="edit-profile-form__delete"
            onClick={handleDelete}
            disabled={submitting}
          >
            Delete Profile
          </button>
        </div>
      </form>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field components — kept inside the file because they're tiny
// and tightly coupled to the form's styling.
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, name, error, ...inputProps }) {
  return (
    <div className="edit-profile-form__field">
      <label htmlFor={name} className="edit-profile-form__label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`edit-profile-form__input ${error ? "is-error" : ""}`}
        {...inputProps}
      />
      {error && (
        <span className="edit-profile-form__error">{formatError(error)}</span>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  placeholder,
  options,
  rawOptions,
  error,
}) {
  return (
    <div className="edit-profile-form__field">
      <label htmlFor={name} className="edit-profile-form__label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`edit-profile-form__input edit-profile-form__select ${error ? "is-error" : ""}`}
      >
        {/* Placeholder option — disabled so users can't re-select it */}
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options.map((opt) => {
          // Two option shapes are supported:
          //   1. plain strings ["Healthcare", "Finance"]
          //   2. {value, label} objects (rawOptions=true)
          if (rawOptions) {
            // First entry is always the placeholder — we already
            // rendered our own, so skip the empty-value one.
            if (opt.value === "") return null;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          }
          if (opt === "") return null;
          return (
            <option key={opt} value={opt}>
              {opt}
            </option>
          );
        })}
      </select>
      {error && (
        <span className="edit-profile-form__error">{formatError(error)}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// DRF returns errors as either { field: ["msg"] } or "non_field_errors": [...]
// or just a string. Normalize to a single readable string.
function formatError(err) {
  if (Array.isArray(err)) return err.join(" ");
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}

// Tries to extract the JSON body from an apiFetch error message.
// apiFetch throws errors in the form: "400 Bad Request – {json body}"
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
