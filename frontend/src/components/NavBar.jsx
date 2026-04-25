import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/logo.png";

function NavBar() {
    const navigate = useNavigate();
    return (
            <div id="navbar"> 
                <nav>
                    <div className="nav-left">
                        <NavLink to="/">
                            <img src={logo} className="logo" alt="Job Buddy logo" />
                        </NavLink>
                        <NavLink to="About">About</NavLink>
                        <NavLink to="Contact">Contact</NavLink>
                        <NavLink to="JobApplicationPage">Job Application</NavLink>
                    </div>
                    <div className="nav-right">
                        <button className="primary-btn" onClick={() => navigate("/login")}>
                            Login
                        </button>
                    </div>
                </nav>
                <Outlet />
            </div>
    );
};

export default NavBar;