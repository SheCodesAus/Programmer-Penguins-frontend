import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./NavBar.css";
import useAuth from "../hooks/use-auth.js";
import logo from "../assets/logo.png";
import { useState } from "react";
import Footer from "./Footer";

function NavBar() {
  const { auth, setAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userId");
    setAuth({ token: null, userId: null });
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

          <div className="desktop-links">
            <NavLink className="nav-link" to="/dashboard">
              Dashboard
            </NavLink>
          </div>
        </div>

        <div className="nav-right">
          {isLoggedIn && (
            <NavLink className="nav-link" to={`/profile`}>
              My profile
            </NavLink>
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
            to="/profile"
            onClick={() => setMenuOpen(false)}
          >
            My Profile
          </NavLink>
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