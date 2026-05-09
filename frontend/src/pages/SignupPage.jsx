import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { signupUser, loginWithGoogle } from "../api/auth";
import googleLogo from "../assets/GoogleButton.svg";
import "./LoginPage.css";

export default function SignupPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
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

        if (data.id) {
          localStorage.setItem("userId", data.id);
        }

        if (data.email) {
          localStorage.setItem("email", data.email);
        }

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

    const errors = {};

    if (!firstName.trim()) {
      errors.firstName = "Please enter your first name.";
    }

    if (!lastName.trim()) {
      errors.lastName = "Please enter your last name.";
    }

    if (!email.trim()) {
      errors.email = "Please enter your email.";
    }

    if (!password1.trim()) {
      errors.password1 = "Please enter a password.";
    }

    if (!password2.trim()) {
      errors.password2 = "Please confirm your password.";
    }

    if (password1 && password2 && password1 !== password2) {
      errors.password2 = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsLoading(true);

    try {
      const signupPayload = {
        username: email,
        email,
        password1,
        password2,
        first_name: firstName,
        last_name: lastName,
      };

      console.log("SIGNUP PAYLOAD:", signupPayload);

      const data = await signupUser(signupPayload);

      if (data.key) {
        localStorage.setItem("token", data.key);

        if (data.id) {
          localStorage.setItem("userId", data.id);
        }

        if (data.email) {
          localStorage.setItem("email", data.email);
        }
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
      <h1 className="login-logo">
        Job<span>Tracker</span>
      </h1>

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
          <img
            src={googleLogo}
            alt=""
            className="google-icon"
          />

          <span>Continue with Google</span>
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSignup}
          noValidate
        >
          <label>First Name</label>

          <input
            className={formErrors.firstName ? "input-error" : ""}
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);

              setFormErrors((prev) => ({
                ...prev,
                firstName: "",
              }));
            }}
          />

          {formErrors.firstName && (
            <p className="form-error">
              {formErrors.firstName}
            </p>
          )}

          <label>Last Name</label>

          <input
            className={formErrors.lastName ? "input-error" : ""}
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);

              setFormErrors((prev) => ({
                ...prev,
                lastName: "",
              }));
            }}
          />

          {formErrors.lastName && (
            <p className="form-error">
              {formErrors.lastName}
            </p>
          )}

          <label>Email</label>

          <input
            className={formErrors.email ? "input-error" : ""}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              setFormErrors((prev) => ({
                ...prev,
                email: "",
              }));
            }}
          />

          {formErrors.email && (
            <p className="form-error">
              {formErrors.email}
            </p>
          )}

          <label>Password</label>

          <input
            className={formErrors.password1 ? "input-error" : ""}
            type="password"
            placeholder="Enter a Password"
            value={password1}
            onChange={(event) => {
              setPassword1(event.target.value);

              setFormErrors((prev) => ({
                ...prev,
                password1: "",
              }));
            }}
          />

          {formErrors.password1 && (
            <p className="form-error">
              {formErrors.password1}
            </p>
          )}

          <label>Confirm Password</label>

          <input
            className={formErrors.password2 ? "input-error" : ""}
            type="password"
            placeholder="Retype Password"
            value={password2}
            onChange={(event) => {
              setPassword2(event.target.value);

              setFormErrors((prev) => ({
                ...prev,
                password2: "",
              }));
            }}
          />

          {formErrors.password2 && (
            <p className="form-error">
              {formErrors.password2}
            </p>
          )}

          {errorMessage && (
            <p className="auth-error">
              {errorMessage}
            </p>
          )}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Creating account..."
              : "Sign Up"}
          </button>
        </form>
      </section>
    </main>
  );
}