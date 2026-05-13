import { useNavigate } from "react-router-dom";
import "./AboutPage.css";

function About() {
  const navigate = useNavigate();

  function handleGetStarted() {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/login");
  }

  return (
    <section id="about">
      <div className="about-container">

        <div className="about-text">
          <h2>Why <span className="highlight">JobTracker</span>?</h2>
          <p>
            Job hunting is tough. Staying organised shouldn't be. Whether you're
            sending out your first application or your fiftieth, our job tracker
            keeps everything in one place so you can focus on what matters —
            <strong> landing the role.</strong>
          </p>
          <p>
            Track applications, monitor progress, and move closer to your next
            opportunity every single day.
          </p>
          <button type="button" className="primary-btn about-btn" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        <div className="about-cards">
          <div className="about-card">
            <span className="card-icon">📋</span>
            <h4>Track Applications</h4>
            <p>Log every job you apply to and never lose track of where you stand.</p>
          </div>
          <div className="about-card">
            <span className="card-icon">📈</span>
            <h4>Monitor Progress</h4>
            <p>See your journey from application to offer in one clear view.</p>
          </div>
          <div className="about-card">
            <span className="card-icon">🎯</span>
            <h4>Land the Role</h4>
            <p>Stay focused and organised so every opportunity gets your best shot.</p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
