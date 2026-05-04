import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { confirmPasswordReset } from "../api/auth";
import "./LoginPage.css";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== passwordConfirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset({ uid, token, password });
      navigate("/login");
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
        <h2>Reset password</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>New password</label>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label>Confirm new password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            required
          />

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button className="primary-btn auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Reset password"}
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