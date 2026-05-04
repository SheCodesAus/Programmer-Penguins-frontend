import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import "./LoginPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await requestPasswordReset(email);
      setMessage(data.detail || "If this email exists, a reset link has been sent.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <h1 className="login-logo">
        Job<span>Tracker</span>
      </h1>

      <section className="login-card">
        <h2>Forgot password?</h2>
        <p className="auth-helper-text">
            Enter your email address and we’ll send you a link to reset your password.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {message && <p className="auth-success">{message}</p>}
          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button className="primary-btn auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </button>

          <div className="auth-secondary-action">
            <Link className="forgot-link" to="/login">
                Back to login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}