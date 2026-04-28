import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, loginWithGoogle } from "../api/auth";
import googleLogo from "../assets/GoogleButton.svg";
import "./LoginPage.css";
import logo from "../assets/logo.png";
import useAuth from "../hooks/use-auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMessage("");
      setIsLoading(true);

      try {
        const data = await loginWithGoogle(tokenResponse.access_token);

        localStorage.setItem("token", data.key);
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
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("token", data.key);
      setAuth({ token: data.key, userId: data.userId ?? null });
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
        <img src={logo} className="logo" alt="Job Buddy logo" />

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

        <form className="auth-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

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