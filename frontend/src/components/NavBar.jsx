import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./NavBar.css";
import useAuth from "../hooks/use-auth.js";
import logo from "../assets/logo.png";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import { apiFetch } from "../api/auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

function NavBar() {
  const { setAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const canOpenAdmin = !!currentUser?.is_superuser;
  const adminUrl = `${API_BASE_URL}/admin/`;

  useEffect(() => {
    let isCurrent = true;

    if (!isLoggedIn) {
      return () => {
        isCurrent = false;
      };
    }

    apiFetch("/api/auth/me/")
      .then((profile) => {
        if (isCurrent) {
          setCurrentUser(profile);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setCurrentUser(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isLoggedIn, token]);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("email");
    setCurrentUser(null);
    setAuth({ token: null, userId: null, email: null });
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <div id="navbar">
      <nav>
        <div className="nav-left">
          <NavLink className="nav-link logo-link" to="/">
            <img src={logo} className="logo" alt="Job Buddy logo" />
          </NavLink>
        </div>



        <div className="nav-right">
          {isLoggedIn && (
            <NavLink className="nav-link" to="/calendar">
              Calendar
            </NavLink>
          )}
          {isLoggedIn && (
            <NavLink className="nav-link" to="/dashboard">
              Dashboard
            </NavLink>
          )}
          {isLoggedIn && (
            <NavLink className="nav-link" to="/contacts">
              Contacts
            </NavLink>
          )}
          {isLoggedIn && (
            <NavLink className="nav-link" to={`/profile`}>
              My profile
            </NavLink>
          )}
          {isLoggedIn && canOpenAdmin && (
            <a className="nav-link" href={adminUrl} target="_blank" rel="noreferrer">
              Admin
            </a>
          )}

          {isLoggedIn ? (
            <button className="logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <button className="primary-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* 📱 Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
          Dashboard
        </NavLink>

        {isLoggedIn && (
          <NavLink
            to="/contacts"
            onClick={() => setMenuOpen(false)}
          >
            Contacts
          </NavLink>
        )}

        {isLoggedIn && (
          <NavLink
            to="/profile"
            onClick={() => setMenuOpen(false)}
          >
            My Profile
          </NavLink>
        )}

        {isLoggedIn && canOpenAdmin && (
          <a
            href={adminUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </a>
        )}

        {isLoggedIn ? (
          <button className="mobile-menu__logout" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <NavLink to="/login" onClick={() => setMenuOpen(false)}>
            Login
          </NavLink>
        )}
      </div>

      <main className="site-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default NavBar;
