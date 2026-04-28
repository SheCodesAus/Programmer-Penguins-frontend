import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, loginWithGoogle } from "../api/auth";
import googleLogo from "../assets/GoogleButton.svg";
import "./LoginPage.css";
import logo from "../assets/logo.png";

export default function SignupPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
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
      setErrorMessage("Google sign up failed.");
    },
  });

  async function handleSignup(event) {
    event.preventDefault();
    setErrorMessage("");

    if (password1 !== password2) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await signupUser({
        username: email,
        email,
        password1,
        password2,
        first_name: firstName,
        last_name: lastName,
      });

      if (data.key) {
        localStorage.setItem("token", data.key);
      }

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
    <img src={logo} className="logo" alt="Job Buddy logo" />

      <section className="login-card signup-card">
        <div className="auth-tabs">
          <Link className="auth-tab" to="/login">
            Login
          </Link>
          <Link className="auth-tab active" to="/signup">
            Sign Up
          </Link>
        </div>

        <button
          className="google-btn"
          type="button"
          onClick={() => googleLogin()}
          disabled={isLoading}
        >
          <img src={googleLogo} alt="" className="google-icon" />
          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <label>First Name</label>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />

          <label>Last Name</label>
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />

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
            placeholder="Enter a Password"
            value={password1}
            onChange={(event) => setPassword1(event.target.value)}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Retype Password"
            value={password2}
            onChange={(event) => setPassword2(event.target.value)}
            required
          />

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
      </section>
    </main>
  );
}