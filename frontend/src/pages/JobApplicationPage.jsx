import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/common/ConfirmModal";
import "./JobApplicationPage.css";
import { apiFetch } from "../api/auth";

const STAGES = ["FOUND", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"];

const STAGE_LABELS = {
    FOUND: "Found",
    APPLIED: "Applied",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn"
};

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
    const [notes, setNotes] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showContactForm, setShowContactForm] = useState(false);
    const [newContact, setNewContact] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        note: ""
    });

    const [showNotesForm, setShowNotesForm] = useState(false);
    const [newNotes, setNewNotes] = useState({
        title: "",
        note: ""
    });

    const [contactErrors, setContactErrors] = useState({});
    const [notesErrors, setNotesErrors] = useState({});

    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: ""
    });

    const closeModal = () => {
        setModal({
            isOpen: false,
            title: "",
            message: ""
        });
    };

    const showErrorModal = (message) => {
        setModal({
            isOpen: true,
            title: "Something went wrong",
            message
        });
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                const [jobData, contactData, notesData] = await Promise.all([
                    apiFetch(`/api/applications/${id}/`),
                    apiFetch(`/api/applications/${id}/contacts/`),
                    apiFetch(`/api/applications/${id}/notes/`)
                ]);

                setJob(jobData);
                setContacts(contactData);
                setNotes(notesData);
            } catch (err) {
                setError(err.message || "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [id]);

    useEffect(() => {
        setImgError(false);
    }, [job?.company_name]);

    const handleAddContact = async () => {
        const errors = {};

        if (!newContact.first_name.trim()) {
            errors.first_name = "Please enter a first name";
        }

        if (newContact.email && !/\S+@\S+\.\S+/.test(newContact.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (Object.keys(errors).length > 0) {
            setContactErrors(errors);
            return;
        }

        try {
            setContactErrors({});

            const created = await apiFetch(`/api/applications/${id}/contacts/`, {
                method: "POST",
                body: JSON.stringify(newContact)
            });

            setContacts(prevContacts => [...prevContacts, created]);
            setNewContact({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                note: ""
            });
            setShowContactForm(false);
        } catch {
            showErrorModal("Could not save the contact. Please try again.");
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await apiFetch(`/api/applications/contacts/${contactId}/`, {
                method: "DELETE"
            });

            setContacts(prevContacts =>
                prevContacts.filter(contact => contact.id !== contactId)
            );
        } catch {
            showErrorModal("Failed to delete contact. Please try again.");
        }
    };

    const handleAddNotes = async () => {
        const errors = {};

        if (!newNotes.note.trim()) {
            errors.note = "Please enter a note";
        }

        if (Object.keys(errors).length > 0) {
            setNotesErrors(errors);
            return;
        }

        try {
            setNotesErrors({});

            const created = await apiFetch(`/api/applications/${id}/notes/`, {
                method: "POST",
                body: JSON.stringify(newNotes)
            });

            setNotes(prevNotes => [...prevNotes, created]);
            setNewNotes({ title: "", note: "" });
            setShowNotesForm(false);
        } catch {
            setNotesErrors({
                general: "Could not save the note. Please try again."
            });
        }
    };

    const handleDeleteNotes = async (notesId) => {
        try {
            await apiFetch(`/api/applications/notes/${notesId}/`, {
                method: "DELETE"
            });

            setNotes(prevNotes =>
                prevNotes.filter(note => note.id !== notesId)
            );
        } catch {
            showErrorModal("Failed to delete note. Please try again.");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-AU");
    };

    if (isLoading) return <p className="loading">Loading...</p>;
    if (error) return <p className="loading">Error: {error}</p>;
    if (!job) return <p className="loading">Application not found</p>;

    const currentStageIndex = STAGES.indexOf(job.status);

    return (
        <div className="page-container">
            <div className="top-buttons">
                <button
                    className="secondary-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ◀ Return to dashboard
                </button>

                <button className="secondary-btn">Edit</button>
            </div>

            <div className="progress-bar">
                {STAGES.map((stage, index) => (
                    <div
                        key={stage}
                        className={`prog-step ${
                            index <= currentStageIndex ? "active" : ""
                        }`}
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
                        <button
                            className="add-btn"
                            onClick={() => {
                                setContactErrors({});
                                setShowContactForm(prev => !prev);
                            }}
                        >
                            +
                        </button>
                    </div>

                    {contacts.map(contact => (
                        <div className="contact-item" key={contact.id}>
                            <div className="avatar">
                                {contact.first_name?.slice(0, 1)}
                                {contact.last_name?.slice(0, 1)}
                            </div>

                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.first_name} {contact.last_name}
                                </div>

                                {contact.email && (
                                    <div className="contact-detail">{contact.email}</div>
                                )}

                                {contact.phone && (
                                    <div className="contact-detail">{contact.phone}</div>
                                )}

                                {contact.note && (
                                    <div className="contact-detail">{contact.note}</div>
                                )}
                            </div>

                            <button
                                className="delete-btn"
                                onClick={() => handleDeleteContact(contact.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {showContactForm && (
                        <div className="contact-form">
                            <input
                                className={contactErrors.first_name ? "input-error" : ""}
                                placeholder="First name"
                                value={newContact.first_name}
                                onChange={e => {
                                    setNewContact({
                                        ...newContact,
                                        first_name: e.target.value
                                    });
                                    setContactErrors(prev => ({
                                        ...prev,
                                        first_name: ""
                                    }));
                                }}
                            />
                            {contactErrors.first_name && (
                                <div className="form-error">{contactErrors.first_name}</div>
                            )}

                            <input
                                placeholder="Last name"
                                value={newContact.last_name}
                                onChange={e =>
                                    setNewContact({
                                        ...newContact,
                                        last_name: e.target.value
                                    })
                                }
                            />

                            <input
                                className={contactErrors.email ? "input-error" : ""}
                                placeholder="Email"
                                value={newContact.email}
                                onChange={e => {
                                    setNewContact({
                                        ...newContact,
                                        email: e.target.value
                                    });
                                    setContactErrors(prev => ({
                                        ...prev,
                                        email: ""
                                    }));
                                }}
                            />
                            {contactErrors.email && (
                                <div className="form-error">{contactErrors.email}</div>
                            )}

                            <input
                                placeholder="Phone"
                                value={newContact.phone}
                                onChange={e =>
                                    setNewContact({
                                        ...newContact,
                                        phone: e.target.value
                                    })
                                }
                            />

                            <input
                                placeholder="Note"
                                value={newContact.note}
                                onChange={e =>
                                    setNewContact({
                                        ...newContact,
                                        note: e.target.value
                                    })
                                }
                            />

                            <div className="form-btns">
                                <button
                                    className="secondary-btn"
                                    onClick={() => {
                                        setContactErrors({});
                                        setShowContactForm(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-btn"
                                    onClick={handleAddContact}
                                >
                                    Save
                                </button>
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
                        <button
                            className="add-btn"
                            onClick={() => {
                                setNotesErrors({});
                                setShowNotesForm(prev => !prev);
                            }}
                        >
                            +
                        </button>
                    </div>

                    {notes.map(note => (
                        <div className="notes-item" key={note.id}>
                            <div className="note-content">
                                <div className="note-title">{note.title}</div>
                                <div className="note-date">
                                    {formatDate(note.created_at)}
                                </div>
                                <div className="note-text">{note.note}</div>
                            </div>

                            <button
                                className="delete-btn"
                                onClick={() => handleDeleteNotes(note.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {showNotesForm && (
                        <div className="notes-form">
                            <input
                                placeholder="Title"
                                value={newNotes.title}
                                onChange={e =>
                                    setNewNotes({
                                        ...newNotes,
                                        title: e.target.value
                                    })
                                }
                            />

                            <textarea
                                className={notesErrors.note ? "input-error" : ""}
                                placeholder="Note"
                                value={newNotes.note}
                                onChange={e => {
                                    setNewNotes({
                                        ...newNotes,
                                        note: e.target.value
                                    });
                                    setNotesErrors(prev => ({
                                        ...prev,
                                        note: ""
                                    }));
                                }}
                            />
                            {notesErrors.note && (
                                <div className="form-error">{notesErrors.note}</div>
                            )}

                            {notesErrors.general && (
                                <div className="form-error">{notesErrors.general}</div>
                            )}

                            <div className="form-btns">
                                <button
                                    className="secondary-btn"
                                    onClick={() => {
                                        setNotesErrors({});
                                        setShowNotesForm(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-btn"
                                    onClick={handleAddNotes}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {notes.length === 0 && !showNotesForm && (
                        <div className="empty-state">No notes yet</div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                confirmText="OK"
                cancelText=""
                onConfirm={closeModal}
                onCancel={closeModal}
            />
        </div>
    );
}

export default JobApplicationPage;