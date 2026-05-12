import { useState } from "react";
import "./ContactPage.css";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    if (!formData.consent) newErrors.consent = "You must accept the consent statement.";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="contact-page">
        <div className="contact-container">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h2>Message sent!</h2>
            <p>Thanks for reaching out. We'll get back to you as soon as we can.</p>
            <button
              className="btn-primary"
              onClick={() => {
                setSubmitted(false);
                setFormData({ firstName: "", lastName: "", email: "", message: "", consent: false });
              }}
            >
              Send another message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1>Contact us</h1>
          <p>Have a question or need help? Fill out the form below and we'll be in touch shortly.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jane"
                className={errors.firstName ? "input-error" : ""}
              />
              {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Smith"
                className={errors.lastName ? "input-error" : ""}
              />
              {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              rows={5}
              className={errors.message ? "input-error" : ""}
            />
            {errors.message && <span className="error-msg">{errors.message}</span>}
          </div>

          <div className="form-divider" />

          <div className="consent-group">
            <label className="consent-label">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
              />
              <span>
                By submitting my personal data, I consent to JobTracker collecting, processing, and
                storing my information in accordance with privacy legislation.
              </span>
            </label>
            {errors.consent && <span className="error-msg">{errors.consent}</span>}
          </div>

          <button type="submit" className="btn-primary submit-btn">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
