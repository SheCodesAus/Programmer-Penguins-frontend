import { useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "./ProfilePage.css";

// Mock data — swap for real values from your auth/profile API.
// Field names follow what the Django profile endpoint is likely to return.
const MOCK_PROFILE = {
  first_name: "First Name",
  last_name: "Last Name",
  username: "username",
  gender: "Female",
  industry: "Healthcare",
  years_experience: "2 years",
  location: "Sydney, NSW",
  career_goal: "Career Goal",
  linkedin_url: "https://linkedin.com/in/example",
  created_at: "DD/MM/YYYY",
  updated_at: "DD/MM/YYYY",
};

// Pull the first letter of first + last name for the avatar fallback
function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export default function ProfilePage() {
  // Local state holds the profile so we can later wire it to an API
  const [profile] = useState(MOCK_PROFILE);

  const initials = getInitials(profile.first_name, profile.last_name);

  // The 6 detail rows — kept as an array so the JSX stays clean
  // and adding/removing fields is a one-line change.
  const detailRows = [
    { label: "Industry", value: profile.industry },
    { label: "Years of Experience", value: profile.years_experience },
    { label: "Location", value: profile.location },
    { label: "Career Goal", value: profile.career_goal },
    { label: "Created At", value: profile.created_at },
    { label: "Updated At", value: profile.updated_at },
  ];

  function handleEditProfile() {
    // Wire this up to navigate to an edit page or open a modal
    // e.g. navigate("/profile/edit") with React Router
    console.log("Edit profile clicked");
  }

  return (
    <main className="profile-page">
      <Navbar />

      {/* ── Curved hero banner ── */}
      {/* The curve comes from a large border-radius on the bottom */}
      <section className="profile-hero">
        <div className="profile-hero__inner">
          {/* Large avatar on the left */}
          <div className="profile-hero__avatar">{initials || "?"}</div>

          {/* Main details block */}
          <div className="profile-hero__details">
            {/* Name row with LinkedIn icon */}
            <div className="profile-hero__name-row">
              <h1 className="profile-hero__name">
                {profile.first_name} {profile.last_name}
              </h1>

              {/* LinkedIn icon — only render if a URL exists */}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-hero__linkedin"
                  aria-label="View LinkedIn profile"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57z" />
                  </svg>
                </a>
              )}
            </div>

            <p className="profile-hero__username">@{profile.username}</p>
            <p className="profile-hero__gender">{profile.gender}</p>

            {/* Key/value detail list — two columns */}
            <dl className="profile-hero__details-list">
              {detailRows.map((row) => (
                // <dl> uses <dt> for term and <dd> for description.
                // Using semantic tags here gives accessibility for free.
                <div key={row.label} className="profile-hero__row">
                  <dt className="profile-hero__label">{row.label}</dt>
                  <dd className="profile-hero__value">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Edit Profile button — pinned to top right */}
          <button
            className="profile-hero__edit-btn"
            onClick={handleEditProfile}
            type="button"
          >
            Edit Profile
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
