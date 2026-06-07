import { useEffect, useState } from "react";
import { apiFetch } from "../api/auth";
import "./ContactPage.css";

const MESSAGE_TYPES = [
  { value: "BUG", label: "Bug report" },
  { value: "QUESTION", label: "Question" },
  { value: "ACCOUNT_RECOVERY", label: "Account recovery" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "OTHER", label: "Other" },
];

const RELATED_PAGES = [
  { value: "DASHBOARD", label: "Dashboard" },
  { value: "JOB_APPLICATION", label: "Job Application" },
  { value: "TASKS_EVENTS", label: "Tasks and Events" },
  { value: "PROFILE", label: "Profile" },
  { value: "LOGIN_SIGNUP", label: "Login / Sign up" },
  { value: "ACCOUNT_RECOVERY", label: "Account recovery" },
  { value: "OTHER", label: "Other" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    message_type: "QUESTION",
    related_page: "OTHER",
    page_url: "",
    subject: "",
    message: "",
    consent_given: false,
  });

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) return;

  apiFetch("/api/auth/me/")
    .then((profile) => {
      setForm((prev) => ({
        ...prev,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
      }));
    })
    .catch(() => {
      // If the token is invalid or expired, leave the form empty.
    });
}, []);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (
        name === "message_type" &&
        value !== "BUG" &&
        value !== "SUGGESTION"
      ) {
        updatedForm.related_page = "";
        updatedForm.page_url = "";
      }

       // Hide page URL if related page is not OTHER
      if (name === "related_page" && value !== "OTHER") {
        updatedForm.page_url = "";
      }

      return updatedForm;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setError("");

    if (!form.consent_given) {
      setError("Please provide consent before submitting the form.");
      return;
    }

    try {
      await apiFetch("/api/feedback/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setStatus("Thank you. Your message has been sent successfully.");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        message_type: "BUG",
        related_page: "OTHER",
        page_url: "",
        subject: "",
        message: "",
        consent_given: false,
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-card">
        <h1>Contact us</h1>
        <p>
          Found a bug, have a question, or need help with your account? Send us
          a message and we’ll review it.
        </p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__grid">
            <label>
              First name
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Jane"
              />
            </label>

            <label>
              Last name
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Smith"
              />
            </label>
          </div>

          <label>
            Email address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
            />
          </label>

          <div className="contact-form__grid">
            <label>
              Message type
              <select
                name="message_type"
                value={form.message_type}
                onChange={handleChange}
              >
                {MESSAGE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {(form.message_type === "BUG" ||
              form.message_type === "SUGGESTION") && (
              <label>
                Related page
                <select
                  name="related_page"
                  value={form.related_page}
                  onChange={handleChange}
                >
                  {RELATED_PAGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {(form.message_type === "BUG" ||
            form.message_type === "SUGGESTION") &&
            form.related_page === "OTHER" && (
              <label>
                Page URL
                <input
                  name="page_url"
                  type="url"
                  value={form.page_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>
          )}

          <label>
            Subject
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Briefly describe the issue"
            />
          </label>

          <label>
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              rows="6"
              required
            />
          </label>

          <label className="contact-form__consent">
            <input
              name="consent_given"
              type="checkbox"
              checked={form.consent_given}
              onChange={handleChange}
              required
            />
            <span>
              By submitting this form, I consent to JobTracker collecting,
              processing, and storing my information for the purpose of
              responding to my message.
            </span>
          </label>

          {error && <div className="contact-form__error">{error}</div>}
          {status && <div className="contact-form__success">{status}</div>}

          <button type="submit" disabled={!form.consent_given}>
            Send message
          </button>
        </form>
      </section>
    </main>
  );
}