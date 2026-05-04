import { useEffect, useState } from "react";
import { apiFetch } from "../api/auth";
import "./ProfilePage.css";

function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-AU");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/auth/me/")
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="profile-page__message">Error: {error}</main>;
  if (!profile) return <main className="profile-page__message">Loading profile...</main>;

  const initials = getInitials(profile.first_name, profile.last_name);

  const detailRows = [
    { label: "Desired Role", value: profile.desired_role },
    { label: "Industry", value: profile.industry },
    { label: "Years of Experience", value: profile.years_of_experience },
    { label: "Location", value: profile.location },
    { label: "Phone", value: profile.phone },
    { label: "Career Goal", value: profile.career_goal },
    { label: "Created At", value: formatDate(profile.created_at) },
    { label: "Updated At", value: formatDate(profile.updated_at) },
  ];

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero__inner">
          <div className="profile-hero__avatar">{initials || "?"}</div>

          <div className="profile-hero__details">
            <div className="profile-hero__name-row">
              <h1 className="profile-hero__name">
                {profile.first_name || "First Name"} {profile.last_name || "Last Name"}
              </h1>

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-hero__linkedin"
                  aria-label="View LinkedIn profile"
                >
                  in
                </a>
              )}
            </div>

            <p className="profile-hero__username">
              @{profile.username || profile.email || "username"}
            </p>

            <p className="profile-hero__gender">
              {profile.gender_self_described || profile.gender}
            </p>

            <dl className="profile-hero__details-list">
              {detailRows.map((row) => (
                <div key={row.label} className="profile-hero__row">
                  <dt className="profile-hero__label">{row.label}</dt>
                  <dd className="profile-hero__value">{row.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <button className="profile-hero__edit-btn" type="button">
            Edit Profile
          </button>
        </div>
      </section>
    </main>
  );
}