import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApplicationContacts } from "../api/applications";
import "./ContactsPage.css";

function getContactName(contact) {
  const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
  return fullName || contact.email || contact.phone || "Unnamed contact";
}

function getApplicationLabel(contact) {
  if (!contact.application_is_active) return "Deleted application";
  if (contact.application_is_archived) return "Archived application";
  return contact.application_status_display || contact.application_status || "Active application";
}

export default function ContactsPage() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchApplicationContacts();
        setContacts(data);
      } catch (err) {
        setError(err.message || "Could not load contacts.");
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return contacts;

    return contacts.filter((contact) => {
      return [
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.phone,
        contact.company_name,
        contact.job_title,
        contact.note,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [contacts, searchQuery]);

  return (
    <main className="contacts-page">
      <div className="contacts-page__header">
        <button
          className="secondary-btn"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ◀ Back to Kanban
        </button>

        <div>
          <h1>Contacts</h1>
          <p>People connected to your applications, interviews, and follow-ups.</p>
        </div>
      </div>

      <section className="contacts-page__toolbar">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, company, email, phone..."
        />
        <span>{filteredContacts.length} contacts</span>
      </section>

      {loading && <p className="contacts-page__message">Loading...</p>}
      {error && <p className="contacts-page__error">{error}</p>}

      {!loading && filteredContacts.length === 0 && (
        <p className="contacts-page__message">No contacts found.</p>
      )}

      {!loading && filteredContacts.length > 0 && (
        <section className="contacts-table-wrapper">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Application</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td data-label="Name">
                    <strong>{getContactName(contact)}</strong>
                    {contact.note && <small>{contact.note}</small>}
                  </td>
                  <td data-label="Company">{contact.company_name || "—"}</td>
                  <td data-label="Application">
                    <Link to={`/job-application/${contact.job_application}`}>
                      {contact.job_title || "View application"}
                    </Link>
                  </td>
                  <td data-label="Email">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label="Phone">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label="Status">
                    <span
                      className={`contacts-table__status ${
                        !contact.application_is_active
                          ? "contacts-table__status--deleted"
                          : contact.application_is_archived
                            ? "contacts-table__status--archived"
                            : ""
                      }`}
                    >
                      {getApplicationLabel(contact)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
