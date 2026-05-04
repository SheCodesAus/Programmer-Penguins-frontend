// ─────────────────────────────────────────────────────────────────────────────
// components/Footer/Footer.jsx
//
// Site footer that shows on every page, regardless of auth state.
// Layout: three columns side-by-side
//   1. Logo (left)
//   2. "Find us in social media" + social icons (middle)
//   3. About + Contact links (right)
// Plus a thin copyright bar at the very bottom.
//
// All social icons are inline SVG so there are no extra dependencies
// or image files to manage. The href values are placeholders ("#") —
// swap them for real URLs when you have them.
// ─────────────────────────────────────────────────────────────────────────────

import "./Footer.css";

export default function Footer() {
  // Build the copyright line dynamically so it's always the current year
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* ── Column 1: logo ── */}
        <div className="footer__col footer__col--logo">
          <div className="footer__logo">
            JOB<span className="footer__logo-blue">TRACKER</span>
          </div>
        </div>

        {/* ── Column 2: socials ── */}
        <div className="footer__col">
          <h4 className="footer__heading">Find us in social media</h4>
          {/* Each link uses aria-label so screen readers announce the platform name */}
          <div className="footer__socials">
            {/* Instagram */}
            <a
              href="#"
              className="footer__social"
              aria-label="Follow JobTracker on Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="#"
              className="footer__social"
              aria-label="Follow JobTracker on Facebook"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M13.5 21.5v-8h2.7l.4-3.1h-3.1V8.4c0-.9.25-1.5 1.55-1.5h1.65V4.1c-.29-.04-1.27-.13-2.4-.13-2.38 0-4 1.45-4 4.12v2.3H7.6v3.1h2.7v8h3.2z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="#"
              className="footer__social"
              aria-label="Follow JobTracker on X"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="#"
              className="footer__social"
              aria-label="Follow JobTracker on LinkedIn"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Column 3: pages ── */}
        <div className="footer__col">
          <h4 className="footer__heading">Pages</h4>
          <nav className="footer__links" aria-label="Footer pages">
            <a href="#about" className="footer__link">
              About
            </a>
            <a href="#contact" className="footer__link">
              Contact
            </a>
          </nav>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer__bottom">
        <p>© {year} JobTracker. All rights reserved.</p>
      </div>
    </footer>
  );
}
