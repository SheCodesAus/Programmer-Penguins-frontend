import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./NavBar.css";
import useAuth from "../hooks/use-auth.js";
import logo from "../assets/logo.png";
import { useState } from "react";

function NavBar() {
  const {auth, setAuth} = useAuth();
  const[menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userId");
    setAuth({ token: null, userId: null });
  };

  const isLoggedIn = !!auth.token;
  const navigate = useNavigate();

  return (
    <div id="navbar">
      <nav>
        <div className="nav-left">
          <NavLink className="nav-link" to="/">
            <img src={logo} className="logo" alt="Job Buddy logo" />
          </NavLink>

          <NavLink className="nav-link" to="/about">About</NavLink>
          <NavLink className="nav-link" to="/contact">Contact</NavLink>
          <NavLink className="nav-link" to="/job-application">Job Application</NavLink>
          <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
        </div>

        <div className="nav-right">
          {isLoggedIn && (
            <NavLink to={`/profile/${auth.userId}`}>My profile</NavLink>
          )}
          {auth.token ? (
            <button className="link-btn" onClick={handleLogout}>Log Out</button>
          ) : (
          <button className="primary-btn" onClick={() => navigate("/login")}>
            Login
          </button>
          )}
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
          </button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
        <NavLink to="/job-application" onClick={() => setMenuOpen(false)}>Create Job Application</NavLink>
        <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
        <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          {isLoggedIn && (
            <NavLink to={`/profile/${auth.userId}`} onClick={() => setMenuOpen(false)}>My Profile</NavLink>
          )}
          {auth.token ? (
            <NavLink to="/login" onClick={() => {handleLogout (); setMenuOpen(false);}}>Log Out</NavLink>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
          )}
      </div>
      <Outlet />
    </div>
  );
}

export default NavBar;