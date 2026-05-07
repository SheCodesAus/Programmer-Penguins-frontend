import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from "../api/auth";
import googleLogo from "../assets/GoogleButton.svg";
import "./LoginPage.css";
import useAuth from "../hooks/use-auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMessage("");
      setFormErrors({});
      setIsLoading(true);

      try {
        const data = await loginWithGoogle(tokenResponse.access_token);

        localStorage.setItem("token", data.key);
        if (data.id) localStorage.setItem("userId", data.id);
        if (data.email) localStorage.setItem("email", data.email);

        setAuth({
          token: data.key,
          userId: data.id ?? null,
          email: data.email ?? null,
        });

        navigate("/dashboard");
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setErrorMessage("Google login failed.");
    },
  });

  async function handleLogin(event) {
    event.preventDefault();
    setErrorMessage("");

    const errors = {};

    if (!email.trim()) {
      errors.email = "Please enter your email.";
    }

    if (!password.trim()) {
      errors.password = "Please enter your password.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("token", data.key);
      if (data.id) localStorage.setItem("userId", data.id);
      if (data.email) localStorage.setItem("email", data.email);

      setAuth({
        token: data.key,
        userId: data.id ?? null,
        email: data.email ?? null,
      });

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    googleLogin();
  }

  return (
    <main className="login-page">
      <h1 className="login-logo">
        Job<span>Tracker</span>
      </h1>

      <section className="login-card">
        <div className="auth-tabs">
          <Link className="auth-tab active" to="/login">
            Login
          </Link>
          <Link className="auth-tab" to="/signup">
            Sign Up
          </Link>
        </div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <img src={googleLogo} alt="" className="google-icon" />
          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <label>Email</label>
          <input
            className={formErrors.email ? "input-error" : ""}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFormErrors((prev) => ({ ...prev, email: "" }));
            }}
          />
          {formErrors.email && (
            <p className="form-error">{formErrors.email}</p>
          )}

          <label>Password</label>
          <input
            className={formErrors.password ? "input-error" : ""}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormErrors((prev) => ({ ...prev, password: "" }));
            }}
          />
          {formErrors.password && (
            <p className="form-error">{formErrors.password}</p>
          )}

          <Link className="forgot-link" to="/forgot-password">
            Forgot Password
          </Link>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}