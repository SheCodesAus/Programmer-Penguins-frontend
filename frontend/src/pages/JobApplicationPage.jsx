import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./JobApplicationPage.css";
import { apiFetch } from "../api/auth";

function getFaviconUrl(companyName = "") {
    const slug = companyName.toLowerCase().replace(/\s+/g, "");
    return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=64`;
}

function JobApplicationPage() {
    const [imgError, setImgError] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showContactForm, setShowContactForm] = useState(false);
    const [newContact, setNewContact] = useState({
        first_name: "", last_name: "", email: "", phone: "", note: ""
    });

    const [notes, setNotes] = useState([]);
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [newNotes, setNewNotes] = useState({
        title: "", notes: ""
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [jobData, contactData, notesData] = await Promise.all([
                    apiFetch(`/api/applications/${id}/`),
                    apiFetch(`/api/applications/${id}/contacts/`),
                    apiFetch(`/api/applications/${id}/notes/`)
                ]);
                setJob(jobData);
                setContacts(contactData);
                setNotes(notesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleAddContact = async () => {
        try {
            const created = await apiFetch(`/api/applications/${id}/contacts/`, {
                method: "POST",
                body: JSON.stringify(newContact)
            });
            setContacts([...contacts, created]);
            setNewContact({ first_name: "", last_name: "", email: "", phone: "", note: "" });
            setShowContactForm(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await apiFetch(`/api/applications/contacts/${contactId}/`, {
                method: "DELETE"
            });
            setContacts(contacts.filter(c => c.id !== contactId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddNotes = async () => {
        try {
            const created = await apiFetch(`/api/applications/${id}/notes/`, {
                method: "POST",
                body: JSON.stringify(newNotes)
            });
            setNotes([...notes, created]);
            setNewNotes({ title:"", notes:"" });
            setShowNotesForm(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteNotes = async (notesId) => {
        try {
            await apiFetch(`/api/applications/notes/${notesId}/`, {
                method: "DELETE"
            });
            setNotes(notes.filter(n => n.id !== notesId));
        } catch (err) {
            alert(err.message);
        }
    };

    const STAGES = ["FOUND", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"];
    const STAGE_LABELS = {
        FOUND: "Found", APPLIED: "Applied", INTERVIEWING: "Interviewing",
        OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn"
    };
    const PROGRESS_MILESTONES = [
        { key: "created_at", label: "Found" },
        { key: "date_applied", label: "Applied" },
        { key: "interview_scheduled", label: "Interview scheduled" },
        { key: "interview_completed", label: "Interview completed" },
        { key: "offer_received", label: "Offer received" },
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-AU");
    };

    const currentStageIndex = job ? STAGES.indexOf(job.status) : 0;

    if (isLoading) return <p className="loading">Loading...</p>;
    if (error) return <p className="loading">Error: {error}</p>;


 return (
        <div className="page-container">
            <div className="top-buttons">
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
                    ◀ Return to dashboard
                </button>
                <button className="secondary-btn">Edit</button>
            </div>

            <div className="progress-bar">
                {STAGES.map((stage, i) => (
                    <div
                        key={stage}
                        className={`prog-step ${i <= currentStageIndex ? "active" : ""}`}
                    >
                        {STAGE_LABELS[stage]}
                    </div>
                ))}
            </div>

            <div className="grid-top">
                <div className="logo-box">
                    {!imgError ? (
                        <img
                            src={getFaviconUrl(job.company_name)}
                            alt={job.company_name}
                            className="company-favicon"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="logo-placeholder">
                            {job.company_name?.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                    <div className="info-card">
                    <div className="info-grid">
                        <span className="info-label">Job title</span>
                        <span className="info-value">{job.job_title}</span>
                        <span className="info-label">Company name</span>
                        <span className="info-value">{job.company_name}</span>
                        <span className="info-label">Location</span>
                        <span className="info-value">{job.location || "—"}</span>
                        <span className="info-label">Date posted</span>
                        <span className="info-value">{formatDate(job.date_posted)}</span>
                        <span className="info-label">Date applied</span>
                        <span className="info-value">{formatDate(job.date_applied)}</span>
                        <span className="info-label">Salary</span>
                        <span className="info-value">
                            {job.salary_min && job.salary_max
                                ? `${job.currency} ${job.salary_min} – ${job.salary_max}`
                                : "—"}
                        </span>
                        <span className="info-label">Source</span>
                        <span className="info-value">{job.source_platform}</span>
                        {job.job_url && (
                            <a
                                href={job.job_url}
                                target="_blank"
                                rel="noreferrer"
                                className="source-btn"
                            >
                                Link to advertisement
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid-mid">
    <div className="card">
        <div className="card-header">
            <span className="card-title">Contacts</span>
            <button className="add-btn" onClick={() => setShowContactForm(!showContactForm)}>+</button>
        </div>

        {contacts.map(contact => (
            <div className="contact-item" key={contact.id}>
                <div className="avatar">
                    {contact.first_name?.slice(0, 1)}{contact.last_name?.slice(0, 1)}
                </div>
                <div className="contact-info">
                    <div className="contact-name">{contact.first_name} {contact.last_name}</div>
                    {contact.email && <div className="contact-detail">{contact.email}</div>}
                    {contact.phone && <div className="contact-detail">{contact.phone}</div>}
                    {contact.note && <div className="contact-detail">{contact.note}</div>}
                </div>
                <button className="delete-btn" onClick={() => handleDeleteContact(contact.id)}>×</button>
            </div>
        ))}

        {showContactForm && (
            <div className="contact-form">
                <input placeholder="First name" value={newContact.first_name}
                    onChange={e => setNewContact({...newContact, first_name: e.target.value})} />
                <input placeholder="Last name" value={newContact.last_name}
                    onChange={e => setNewContact({...newContact, last_name: e.target.value})} />
                <input placeholder="Email" value={newContact.email}
                    onChange={e => setNewContact({...newContact, email: e.target.value})} />
                <input placeholder="Phone" value={newContact.phone}
                    onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                <input placeholder="Note" value={newContact.note}
                    onChange={e => setNewContact({...newContact, note: e.target.value})} />
                <div className="form-btns">
                    <button className="secondary-btn" onClick={() => setShowContactForm(false)}>Cancel</button>
                    <button className="primary-btn" onClick={handleAddContact}>Save</button>
                </div>
            </div>
        )}

        {contacts.length === 0 && !showContactForm && (
            <div className="empty-state">No contacts yet</div>
        )}
    </div>

    <div className="card">
        <div className="card-header">
            <span className="card-title">My notes</span>
            <button className="add-btn" onClick={() => setShowNotesForm(!showNotesForm)}>+</button>
        </div>

        {notes.map(note => (
            <div className="notes-item" key={note.id}>
                <div className="note-content">
                    <div className="note-title">{note.title}</div>
                    <div className="note-date">{formatDate(note.created_at)}</div>
                    <div className="note-text">{note.note}</div>
                </div>
                <button className="delete-btn" onClick={() => handleDeleteNotes(note.id)}>×</button>
            </div>
        ))}

        {showNotesForm && (
            <div className="notes-form">
                <input placeholder="Title" value={newNotes.title}
                    onChange={e => setNewNotes({...newNotes, title: e.target.value})} />
                <input
                type="date"
                value={newNotes.date}
                onChange={e => setNewNotes({ ...newNotes, date: e.target.value })}
                />
                <input placeholder="Note" value={newNotes.note}
                    onChange={e => setNewNotes({...newNotes, note: e.target.value})} />
                <div className="form-btns">
                    <button className="secondary-btn" onClick={() => setShowNotesForm(false)}>Cancel</button>
                    <button className="primary-btn" onClick={handleAddNotes}>Save</button>
                </div>
            </div>
        )}

        {notes.length === 0 && !showNotesForm && (
            <div className="empty-state">No notes yet</div>
        )}
    </div>
</div>
        </div>
    );
}

export default JobApplicationPage;