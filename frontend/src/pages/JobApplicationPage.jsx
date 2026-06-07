import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./JobApplicationPage.css";
import { apiFetch } from "../api/auth";
import {
    completeApplicationTask,
    createApplicationEvent,
    createApplicationTask,
    deleteApplicationEvent,
    deleteApplicationTask,
    fetchApplicationEvents,
    fetchApplicationTasks,
    reopenApplicationTask,
    updateApplicationEvent,
    updateApplicationTask
} from "../api/applications";
import { getCompanyInitials, getCompanyLogoUrl } from "../utils/companyLogo";
import EditApplicationModal from "../components/EditApplicationModal";
import ConfirmModal from "../components/common/ConfirmModal";
import LoadingState from "../components/common/LoadingState";
import EventScheduleFields from "../components/EventScheduleFields";
import { toDateTimeLocalValue } from "../utils/dateTimeLocal";
import { FaEdit } from "react-icons/fa";

const EMPTY_TASK_FORM = {
    title: "",
    description: "",
    due_at: "",
    is_required: false
};

const EMPTY_TASK_EDIT_FORM = {
    title: "",
    description: "",
    due_at: "",
    is_required: false
};

const EMPTY_EVENT_FORM = {
    title: "",
    event_type: "INTERVIEW",
    starts_at: "",
    ends_at: "",
    location: "",
    meeting_link: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: ""
};

function JobApplicationPage() {
    const [failedLogoUrl, setFailedLogoUrl] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [job, setJob] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    const [showContactForm, setShowContactForm] = useState(false);
    const [newContact, setNewContact] = useState({
        first_name: "", last_name: "", email: "", phone: "", note: ""
    });
    const [editingContactId, setEditingContactId] = useState(null);

    const [notes, setNotes] = useState([]);
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [newNotes, setNewNotes] = useState({
        title: "", note: ""
    });
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState(EMPTY_TASK_FORM);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [taskEditForm, setTaskEditForm] = useState(EMPTY_TASK_EDIT_FORM);
    const [taskError, setTaskError] = useState("");
    const [taskNotice, setTaskNotice] = useState("");
    const [showEventForm, setShowEventForm] = useState(false);
    const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
    const [editingEventId, setEditingEventId] = useState(null);
    const [eventEditForm, setEventEditForm] = useState(EMPTY_EVENT_FORM);
    const [eventError, setEventError] = useState("");
    const [submittingEvent, setSubmittingEvent] = useState(false);
    const [eventTimeConflict, setEventTimeConflict] = useState(null);
    const [pendingEventPayload, setPendingEventPayload] = useState(null);
    const [deletePlannerTarget, setDeletePlannerTarget] = useState(null);
    const [deleteContentTarget, setDeleteContentTarget] = useState(null);
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        title: "",
        message: ""
    });

    const companyLogoUrl = getCompanyLogoUrl(job);
    const companyInitials = getCompanyInitials(job?.company_name);
    const showCompanyLogo = companyLogoUrl && companyLogoUrl !== failedLogoUrl;

    const fetchPageData = useCallback(async () => {
        const [jobData, contactData, notesData, taskData, eventData] = await Promise.all([
            apiFetch(`/api/applications/${id}/`),
            apiFetch(`/api/applications/${id}/contacts/`),
            apiFetch(`/api/applications/${id}/notes/`),
            fetchApplicationTasks({ applicationId: id }),
            fetchApplicationEvents({ applicationId: id })
        ]);

        setJob(jobData);
        setContacts(contactData);
        setNotes(notesData);
        setTasks(taskData);
        setEvents(eventData);
    }, [id]);

    useEffect(() => {
        async function loadPageData() {
            try {
                setIsLoading(true);
                setError(null);
                await fetchPageData();
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        loadPageData();
    }, [fetchPageData]);

    useEffect(() => {
        if (isLoading) return;

        const targetId = {
            "#tasks": "application-tasks",
            "#events": "application-events"
        }[location.hash];

        if (!targetId) return;

        document.getElementById(targetId)?.scrollIntoView({
            block: "start"
        });
    }, [isLoading, location.hash]);

    const refreshApplicationPlanner = async () => {
        const [jobData, taskData, eventData] = await Promise.all([
            apiFetch(`/api/applications/${id}/`),
            fetchApplicationTasks({ applicationId: id }),
            fetchApplicationEvents({ applicationId: id })
        ]);

        setJob(jobData);
        setTasks(taskData);
        setEvents(eventData);
    };

    const refreshApplicationContacts = async () => {
        const contactData = await apiFetch(`/api/applications/${id}/contacts/`);
        setContacts(contactData);
    };

    const handleToggleTask = async (task) => {
        try {
            setTaskError("");

            if (task.completed_at) {
                await reopenApplicationTask(task.id);
            } else {
                await completeApplicationTask(task.id);
            }

            await refreshApplicationPlanner();
        } catch (err) {
            setTaskError(err.message || "Could not update task.");
        }
    };

    const getTaskTimeSlot = (dateStr) => {
        if (!dateStr) return "";

        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const findTaskTimeConflict = async (dueAt) => {
        if (!dueAt) return null;

        const allTasks = await fetchApplicationTasks();
        const newTaskSlot = getTaskTimeSlot(dueAt);

        return allTasks.find(task =>
            !task.completed_at &&
            task.due_at &&
            getTaskTimeSlot(task.due_at) === newTaskSlot
        ) || null;
    };

    const createTaskFromPayload = async (payload) => {
        await createApplicationTask(payload);

        setNewTask(EMPTY_TASK_FORM);
        setShowTaskForm(false);
        await refreshApplicationPlanner();
    };

    const buildNewTaskPayload = () => ({
        job_application: Number(id),
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        due_at: newTask.due_at || null,
        is_required: newTask.is_required,
        task_type: "CUSTOM",
        source_status: job?.status || ""
    });

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            setTaskError("Please enter a task title.");
            return;
        }

        try {
            setTaskError("");
            setTaskNotice("");
            const payload = buildNewTaskPayload();
            const conflictTask = await findTaskTimeConflict(payload.due_at);

            await createTaskFromPayload(payload);

            if (conflictTask) {
                setTaskNotice(
                    `Heads up: this task is scheduled at the same time as "${conflictTask.title}" on ${formatDateTime(conflictTask.due_at)}.`
                );
            }
        } catch (err) {
            setTaskError(err.message || "Could not create task.");
        }
    };

    const handleTaskFormChange = (event) => {
        const { name, value, checked, type } = event.target;

        setNewTask(prevTask => ({
            ...prevTask,
            [name]: type === "checkbox" ? checked : value
        }));
        setTaskError("");
        setTaskNotice("");
    };

    const startEditingTask = (task) => {
        setEditingTaskId(task.id);
        setTaskEditForm({
            title: task.title || "",
            description: task.description || "",
            due_at: toDateTimeLocalValue(task.due_at),
            is_required: !!task.is_required
        });
        setTaskError("");
        setTaskNotice("");
    };

    const handleTaskEditFormChange = (event) => {
        const { name, value, checked, type } = event.target;

        setTaskEditForm(prevTask => ({
            ...prevTask,
            [name]: type === "checkbox" ? checked : value
        }));
        setTaskError("");
        setTaskNotice("");
    };

    const cancelEditingTask = () => {
        setEditingTaskId(null);
        setTaskEditForm(EMPTY_TASK_EDIT_FORM);
    };

    const handleSaveTaskEdit = async (task) => {
        if (!taskEditForm.title.trim()) {
            setTaskError("Please enter a task title.");
            return;
        }

        try {
            setTaskError("");
            await updateApplicationTask(task.id, {
                title: taskEditForm.title.trim(),
                description: taskEditForm.description.trim(),
                due_at: taskEditForm.due_at || null,
                is_required: taskEditForm.is_required
            });
            cancelEditingTask();
            await refreshApplicationPlanner();
        } catch (err) {
            setTaskError(err.message || "Could not update task.");
        }
    };

    const getEventRange = (eventData) => {
        const startsAt = new Date(eventData.starts_at);
        const endsAt = eventData.ends_at
            ? new Date(eventData.ends_at)
            : new Date(startsAt.getTime() + 60 * 60 * 1000);

        return { startsAt, endsAt };
    };

    const findEventTimeConflict = async (eventData, ignoredEventId = null) => {
        if (!eventData.starts_at) return null;

        const allEvents = await fetchApplicationEvents();
        const { startsAt, endsAt } = getEventRange(eventData);

        return allEvents.find(existingEvent => {
            if (ignoredEventId && existingEvent.id === ignoredEventId) return false;

            const existingStartsAt = new Date(existingEvent.starts_at);
            const existingEndsAt = existingEvent.ends_at
                ? new Date(existingEvent.ends_at)
                : new Date(existingStartsAt.getTime() + 60 * 60 * 1000);

            return existingStartsAt < endsAt && existingEndsAt > startsAt;
        }) || null;
    };

    const createEventFromPayload = async (payload) => {
        await createApplicationEvent(payload);

        setEventForm(EMPTY_EVENT_FORM);
        setShowEventForm(false);
        setEventTimeConflict(null);
        setPendingEventPayload(null);
        await Promise.all([
            refreshApplicationPlanner(),
            refreshApplicationContacts()
        ]);
    };

    const handleEventFormChange = (event) => {
        const { name, value } = event.target;

        setEventForm(prevEventForm => ({
            ...prevEventForm,
            [name]: value
        }));
        setEventError("");
    };

    const handleEventScheduleChange = (updates) => {
        setEventForm(prevEventForm => ({
            ...prevEventForm,
            ...updates
        }));
        setEventError("");
    };

    const startEditingEvent = (event) => {
        setEditingEventId(event.id);
        setEventEditForm({
            title: event.title || "",
            event_type: event.event_type || "INTERVIEW",
            starts_at: toDateTimeLocalValue(event.starts_at),
            ends_at: toDateTimeLocalValue(event.ends_at),
            location: event.location || "",
            meeting_link: event.meeting_link || "",
            contact_name: event.contact_name || "",
            contact_email: event.contact_email || "",
            contact_phone: event.contact_phone || "",
            notes: event.notes || ""
        });
        setEventError("");
    };

    const handleEventEditFormChange = (event) => {
        const { name, value } = event.target;

        setEventEditForm(prevEventForm => ({
            ...prevEventForm,
            [name]: value
        }));
        setEventError("");
    };

    const handleEventEditScheduleChange = (updates) => {
        setEventEditForm(prevEventForm => ({
            ...prevEventForm,
            ...updates
        }));
        setEventError("");
    };

    const cancelEditingEvent = () => {
        setEditingEventId(null);
        setEventEditForm(EMPTY_EVENT_FORM);
    };

    const handleSaveEventEdit = async (event) => {
        if (!eventEditForm.title.trim() || !eventEditForm.starts_at) {
            setEventError("Please enter an event title and start time.");
            return;
        }

        try {
            setSubmittingEvent(true);
            setEventError("");

            const payload = {
                ...eventEditForm,
                title: eventEditForm.title.trim(),
                ends_at: eventEditForm.ends_at || null
            };
            const conflictEvent = await findEventTimeConflict(payload, event.id);

            if (conflictEvent) {
                setPendingEventPayload({
                    ...payload,
                    id: event.id,
                    mode: "update"
                });
                setEventTimeConflict(conflictEvent);
                return;
            }

            await updateApplicationEvent(event.id, payload);
            cancelEditingEvent();
            await Promise.all([
                refreshApplicationPlanner(),
                refreshApplicationContacts()
            ]);
        } catch (err) {
            setEventError(err.message || "Could not update event.");
        } finally {
            setSubmittingEvent(false);
        }
    };

    const handleAddEvent = async () => {
        if (!eventForm.title.trim() || !eventForm.starts_at) {
            setEventError("Please enter an event title and start time.");
            return;
        }

        try {
            setSubmittingEvent(true);
            setEventError("");

            const payload = {
                ...eventForm,
                job_application: Number(id),
                title: eventForm.title.trim(),
                ends_at: eventForm.ends_at || null
            };
            const conflictEvent = await findEventTimeConflict(payload);

            if (conflictEvent) {
                setPendingEventPayload(payload);
                setEventTimeConflict(conflictEvent);
                return;
            }

            await createEventFromPayload(payload);
        } catch (err) {
            setEventError(err.message || "Could not create event.");
        } finally {
            setSubmittingEvent(false);
        }
    };

    const handleConfirmEventConflict = async () => {
        if (!pendingEventPayload) return;

        try {
            setSubmittingEvent(true);
            setEventError("");
            if (pendingEventPayload.mode === "update") {
                const { id: eventId, ...payload } = pendingEventPayload;
                delete payload.mode;
                await updateApplicationEvent(eventId, payload);
                cancelEditingEvent();
                setEventTimeConflict(null);
                setPendingEventPayload(null);
                await Promise.all([
                    refreshApplicationPlanner(),
                    refreshApplicationContacts()
                ]);
            } else {
                await createEventFromPayload(pendingEventPayload);
            }
        } catch (err) {
            setEventError(err.message || "Could not create event.");
            setEventTimeConflict(null);
            setPendingEventPayload(null);
        } finally {
            setSubmittingEvent(false);
        }
    };

    const handleCancelEventConflict = () => {
        setEventTimeConflict(null);
        setPendingEventPayload(null);
    };

    const handleConfirmPlannerDelete = async () => {
        if (!deletePlannerTarget) return;

        try {
            if (deletePlannerTarget.type === "task") {
                await deleteApplicationTask(deletePlannerTarget.item.id);
                if (editingTaskId === deletePlannerTarget.item.id) {
                    cancelEditingTask();
                }
            } else {
                await deleteApplicationEvent(deletePlannerTarget.item.id);
                if (editingEventId === deletePlannerTarget.item.id) {
                    cancelEditingEvent();
                }
            }

            setDeletePlannerTarget(null);
            await refreshApplicationPlanner();
        } catch (err) {
            if (deletePlannerTarget.type === "task") {
                setTaskError(err.message || "Could not delete task.");
            } else {
                setEventError(err.message || "Could not delete event.");
            }
        }
    };

    const showMessageModal = (message, title = "Something went wrong") => {
        setMessageModal({
            isOpen: true,
            title,
            message
        });
    };

    const closeMessageModal = () => {
        setMessageModal({
            isOpen: false,
            title: "",
            message: ""
        });
    };

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
            showMessageModal(err.message || "Could not save the contact.");
        }
    };

    const handleEditContact = async () => {
        try {
            const updatedContact = await apiFetch(`/api/applications/contacts/${editingContactId}/`, {
                method: "PATCH",
                body: JSON.stringify(newContact)
            });
            setContacts(contacts.map(c => c.id === editingContactId ? updatedContact : c));
            setEditingContactId(null);
            setNewContact({ first_name: "", last_name: "", email: "", phone: "", note: "" });
        } catch (err) {
            showMessageModal(err.message || "Could not update the contact.");
        }
    };

    const handleDeleteContact = (contact) => {
        setDeleteContentTarget({
            type: "contact",
            item: contact
        });
    };

    const handleConfirmContentDelete = async () => {
        if (!deleteContentTarget) return;

        try {
            if (deleteContentTarget.type === "contact") {
                await apiFetch(`/api/applications/contacts/${deleteContentTarget.item.id}/`, {
                    method: "DELETE"
                });
                setContacts(contacts.filter(c => c.id !== deleteContentTarget.item.id));
            } else {
                await apiFetch(`/api/applications/notes/${deleteContentTarget.item.id}/`, {
                    method: "DELETE"
                });
                setNotes(notes.filter(n => n.id !== deleteContentTarget.item.id));
            }

            setDeleteContentTarget(null);
        } catch (err) {
            showMessageModal(
                err.message ||
                    `Could not delete the ${deleteContentTarget.type}.`
            );
        }
    };

    const handleAddNotes = async () => {
        try {
            const created = await apiFetch(`/api/applications/${id}/notes/`, {
                method: "POST",
                body: JSON.stringify(newNotes)
            });
            setNotes([...notes, created]);
            setNewNotes({ title: "", note: "" });
            setShowNotesForm(false);
        } catch (err) {
            showMessageModal(err.message || "Could not save the note.");
        }
    };

    const handleEditNotes = async () => {
        try {
            const updatedNote = await apiFetch(`/api/applications/notes/${editingNoteId}/`, {
                method: "PATCH",
                body: JSON.stringify(newNotes)
            });
            setNotes(notes.map(n => n.id === editingNoteId ? updatedNote : n));
            setEditingNoteId(null);
            setNewNotes({ title: "", note: "" });
        } catch (err) {
            showMessageModal(err.message || "Could not update the note.");
        }
    };

    const handleDeleteNotes = (note) => {
        setDeleteContentTarget({
            type: "note",
            item: note
        });
    };

    const getDeleteContentLabel = () => {
        if (!deleteContentTarget) return "";

        if (deleteContentTarget.type === "contact") {
            const contact = deleteContentTarget.item;
            return (
                `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
                contact.email ||
                contact.phone ||
                "this contact"
            );
        }

        return (
            deleteContentTarget.item.title ||
            deleteContentTarget.item.note ||
            "this note"
        );
    };

    const STAGES = ["FOUND", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "WITHDRAWN"];
    const STAGE_LABELS = {
        FOUND: "Found", APPLIED: "Applied", INTERVIEWING: "Interviewing",
        OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn"
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-AU");
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "No due date";

        return new Date(dateStr).toLocaleString("en-AU", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const currentStageIndex = job ? STAGES.indexOf(job.status) : 0;
    const openTasks = tasks.filter(task => !task.completed_at);
    const completedTasks = tasks.filter(task => task.completed_at);
    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.starts_at) >= now);
    const pastEvents = events.filter(event => new Date(event.starts_at) < now);

    if (isLoading) return <LoadingState />;
    if (error) return <p className="loading">Error: {error}</p>;

    return (
        <div className="page-container">
            <div className="top-buttons">
                <button className="secondary-btn" onClick={() => navigate("/dashboard")}>
                    ◀ Return to dashboard
                </button>
                <button className="secondary-btn" onClick={() => setIsEditing(true)}>
                    Edit
                </button>
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

            {isEditing && (
                <EditApplicationModal
                    application={job}
                    onClose={() => setIsEditing(false)}
                    onSaved={(updated) => setJob(updated)}
                />
            )}

            <div className="grid-top">
                <div className="logo-box">
                    {showCompanyLogo ? (
                        <img
                            src={companyLogoUrl}
                            alt={job.company_name}
                            className="company-favicon"
                            onError={() => setFailedLogoUrl(companyLogoUrl)}
                        />
                    ) : (
                        <div className="logo-placeholder">
                            {companyInitials}
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

            <div className="card tasks-card" id="application-tasks">
                <div className="card-header">
                    <div>
                        <span className="card-title">Tasks</span>
                        <div className="tasks-card__summary">
                            {openTasks.length} open / {completedTasks.length} completed
                        </div>
                    </div>
                    <button
                        className="add-btn"
                        type="button"
                        onClick={() => {
                            setShowTaskForm(!showTaskForm);
                            setNewTask(EMPTY_TASK_FORM);
                            setTaskError("");
                        }}
                    >
                        +
                    </button>
                </div>

                {taskError && <div className="form-error">{taskError}</div>}
                {taskNotice && <div className="form-warning">{taskNotice}</div>}

                {showTaskForm && (
                    <div className="task-form">
                        <input
                            name="title"
                            placeholder="Task title"
                            value={newTask.title}
                            onChange={handleTaskFormChange}
                        />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={newTask.description}
                            onChange={handleTaskFormChange}
                        />
                        <div className="task-form__row">
                            <label>
                                <span>Due</span>
                                <input
                                    type="datetime-local"
                                    name="due_at"
                                    value={newTask.due_at}
                                    onChange={handleTaskFormChange}
                                />
                            </label>
                            <label className="task-form__checkbox">
                                <input
                                    type="checkbox"
                                    name="is_required"
                                    checked={newTask.is_required}
                                    onChange={handleTaskFormChange}
                                />
                                <span>Required</span>
                            </label>
                        </div>
                        <div className="form-btns">
                            <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => {
                                    setShowTaskForm(false);
                                    setNewTask(EMPTY_TASK_FORM);
                                    setTaskError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                type="button"
                                onClick={handleAddTask}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}

                {openTasks.length === 0 && completedTasks.length === 0 && !showTaskForm && (
                    <div className="empty-state">No tasks yet</div>
                )}

                {openTasks.length > 0 && (
                    <div className="application-tasks">
                        <div className="task-section-title">To do</div>
                        {openTasks.map(task => (
                            <div className="application-task" key={task.id}>
                                <label className="application-task__check">
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => handleToggleTask(task)}
                                    />
                                    <span />
                                </label>
                                <div className="application-task__body">
                                    <div className="application-task__title-row">
                                        <span className="application-task__title">{task.title}</span>
                                        {task.is_required && (
                                            <span className="application-task__badge">Required</span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <div className="application-task__description">
                                            {task.description}
                                        </div>
                                    )}
                                    <div className="application-task__meta">
                                        {formatDateTime(task.due_at)}
                                    </div>
                                    <div className="application-item__actions">
                                        <button
                                            type="button"
                                            className="application-item__edit"
                                            onClick={() => startEditingTask(task)}
                                            aria-label={`Edit ${task.title}`}
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            type="button"
                                            className="application-item__delete"
                                            onClick={() => setDeletePlannerTarget({ type: "task", item: task })}
                                            aria-label={`Delete ${task.title}`}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    {editingTaskId === task.id && (
                                        <div className="application-inline-form">
                                            <input
                                                name="title"
                                                placeholder="Task title"
                                                value={taskEditForm.title}
                                                onChange={handleTaskEditFormChange}
                                            />
                                            <textarea
                                                name="description"
                                                placeholder="Description"
                                                value={taskEditForm.description}
                                                onChange={handleTaskEditFormChange}
                                            />
                                            <div className="task-form__row">
                                                <label>
                                                    <span>Due</span>
                                                    <input
                                                        type="datetime-local"
                                                        name="due_at"
                                                        value={taskEditForm.due_at}
                                                        onChange={handleTaskEditFormChange}
                                                    />
                                                </label>
                                                <label className="task-form__checkbox">
                                                    <input
                                                        type="checkbox"
                                                        name="is_required"
                                                        checked={taskEditForm.is_required}
                                                        onChange={handleTaskEditFormChange}
                                                    />
                                                    <span>Required</span>
                                                </label>
                                            </div>
                                            <div className="form-btns">
                                                <button className="secondary-btn" type="button" onClick={cancelEditingTask}>
                                                    Cancel
                                                </button>
                                                <button className="primary-btn" type="button" onClick={() => handleSaveTaskEdit(task)}>
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className="application-tasks application-tasks--completed">
                        <div className="task-section-title">Completed</div>
                        {completedTasks.map(task => (
                            <div
                                className="application-task application-task--completed"
                                key={task.id}
                            >
                                <label className="application-task__check">
                                    <input
                                        type="checkbox"
                                        checked
                                        onChange={() => handleToggleTask(task)}
                                    />
                                    <span />
                                </label>
                                <div className="application-task__body">
                                    <div className="application-task__title-row">
                                        <span className="application-task__title">{task.title}</span>
                                    </div>
                                    <div className="application-task__meta">
                                        Completed {formatDateTime(task.completed_at)}
                                    </div>
                                    <div className="application-item__actions">
                                        <button
                                            type="button"
                                            className="application-item__edit"
                                            onClick={() => startEditingTask(task)}
                                            aria-label={`Edit ${task.title}`}
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            type="button"
                                            className="application-item__delete"
                                            onClick={() => setDeletePlannerTarget({ type: "task", item: task })}
                                            aria-label={`Delete ${task.title}`}
                                            title="Delete"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    {editingTaskId === task.id && (
                                        <div className="application-inline-form">
                                            <input
                                                name="title"
                                                placeholder="Task title"
                                                value={taskEditForm.title}
                                                onChange={handleTaskEditFormChange}
                                            />
                                            <textarea
                                                name="description"
                                                placeholder="Description"
                                                value={taskEditForm.description}
                                                onChange={handleTaskEditFormChange}
                                            />
                                            <div className="task-form__row">
                                                <label>
                                                    <span>Due</span>
                                                    <input
                                                        type="datetime-local"
                                                        name="due_at"
                                                        value={taskEditForm.due_at}
                                                        onChange={handleTaskEditFormChange}
                                                    />
                                                </label>
                                                <label className="task-form__checkbox">
                                                    <input
                                                        type="checkbox"
                                                        name="is_required"
                                                        checked={taskEditForm.is_required}
                                                        onChange={handleTaskEditFormChange}
                                                    />
                                                    <span>Required</span>
                                                </label>
                                            </div>
                                            <div className="form-btns">
                                                <button className="secondary-btn" type="button" onClick={cancelEditingTask}>
                                                    Cancel
                                                </button>
                                                <button className="primary-btn" type="button" onClick={() => handleSaveTaskEdit(task)}>
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card events-card" id="application-events">
                <div className="card-header">
                    <div>
                        <span className="card-title">Events</span>
                        <div className="tasks-card__summary">
                            {upcomingEvents.length} upcoming / {pastEvents.length} past
                        </div>
                    </div>
                    <button
                        className="add-btn"
                        type="button"
                        onClick={() => {
                            setShowEventForm(!showEventForm);
                            setEventForm(EMPTY_EVENT_FORM);
                            setEventError("");
                        }}
                    >
                        +
                    </button>
                </div>

                {eventError && <div className="form-error">{eventError}</div>}

                {showEventForm && (
                    <div className="application-event-form">
                        <input
                            name="title"
                            placeholder="Event title"
                            value={eventForm.title}
                            onChange={handleEventFormChange}
                        />

                        <select
                            name="event_type"
                            value={eventForm.event_type}
                            onChange={handleEventFormChange}
                        >
                            <option value="INTERVIEW">Interview</option>
                            <option value="CALL">Call</option>
                            <option value="DEADLINE">Deadline</option>
                            <option value="OTHER">Other</option>
                        </select>

                        <EventScheduleFields
                            startsAt={eventForm.starts_at}
                            endsAt={eventForm.ends_at}
                            onChange={handleEventScheduleChange}
                        />

                        <input
                            name="location"
                            placeholder="Location"
                            value={eventForm.location}
                            onChange={handleEventFormChange}
                        />

                        <input
                            name="meeting_link"
                            placeholder="Meeting link"
                            value={eventForm.meeting_link}
                            onChange={handleEventFormChange}
                        />

                        <div className="application-event-form__time-grid">
                            <input
                                name="contact_name"
                                placeholder="Contact name"
                                value={eventForm.contact_name}
                                onChange={handleEventFormChange}
                            />
                            <input
                                name="contact_email"
                                placeholder="Contact email"
                                value={eventForm.contact_email}
                                onChange={handleEventFormChange}
                            />
                        </div>

                        <input
                            name="contact_phone"
                            placeholder="Contact phone"
                            value={eventForm.contact_phone}
                            onChange={handleEventFormChange}
                        />

                        <textarea
                            name="notes"
                            placeholder="Notes"
                            value={eventForm.notes}
                            onChange={handleEventFormChange}
                        />

                        <div className="form-btns">
                            <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => {
                                    setShowEventForm(false);
                                    setEventForm(EMPTY_EVENT_FORM);
                                    setEventError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-btn"
                                type="button"
                                onClick={handleAddEvent}
                                disabled={submittingEvent}
                            >
                                {submittingEvent ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}

                {events.length === 0 && !showEventForm && (
                    <div className="empty-state">No events yet</div>
                )}

                {upcomingEvents.length > 0 && (
                    <div className="application-events">
                        <div className="task-section-title">Upcoming</div>
                        {upcomingEvents.map(event => (
                            <div className="application-event" key={event.id}>
                                <div className="application-event__header">
                                    <span className="application-event__title">{event.title}</span>
                                    <span className="application-event__badge">
                                        {event.event_type_display || event.event_type}
                                    </span>
                                </div>
                                <div className="application-event__meta">
                                    {formatDateTime(event.starts_at)}
                                    {event.ends_at ? ` - ${formatDateTime(event.ends_at)}` : ""}
                                </div>
                                {event.location && (
                                    <div className="application-event__detail">{event.location}</div>
                                )}
                                {event.meeting_link && (
                                    <a
                                        className="application-event__link"
                                        href={event.meeting_link}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Meeting link
                                    </a>
                                )}
                                {(event.contact_name || event.contact_email || event.contact_phone) && (
                                    <div className="application-event__detail">
                                        {[event.contact_name, event.contact_email, event.contact_phone]
                                            .filter(Boolean)
                                            .join(" / ")}
                                    </div>
                                )}
                                {event.notes && (
                                    <div className="application-event__notes">{event.notes}</div>
                                )}
                                {event.overlap_warning && (
                                    <div className="application-event__warning">
                                        {event.overlap_warning}
                                    </div>
                                )}
                                <div className="application-item__actions">
                                    <button
                                        type="button"
                                        className="application-item__edit"
                                        onClick={() => startEditingEvent(event)}
                                        aria-label={`Edit ${event.title}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        type="button"
                                        className="application-item__delete"
                                        onClick={() => setDeletePlannerTarget({ type: "event", item: event })}
                                        aria-label={`Delete ${event.title}`}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                                {editingEventId === event.id && (
                                    <div className="application-inline-form">
                                        <input
                                            name="title"
                                            placeholder="Event title"
                                            value={eventEditForm.title}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <select
                                            name="event_type"
                                            value={eventEditForm.event_type}
                                            onChange={handleEventEditFormChange}
                                        >
                                            <option value="INTERVIEW">Interview</option>
                                            <option value="CALL">Call</option>
                                            <option value="DEADLINE">Deadline</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                        <EventScheduleFields
                                            startsAt={eventEditForm.starts_at}
                                            endsAt={eventEditForm.ends_at}
                                            onChange={handleEventEditScheduleChange}
                                        />
                                        <input
                                            name="location"
                                            placeholder="Location"
                                            value={eventEditForm.location}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <input
                                            name="meeting_link"
                                            placeholder="Meeting link"
                                            value={eventEditForm.meeting_link}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <div className="application-event-form__time-grid">
                                            <input
                                                name="contact_name"
                                                placeholder="Contact name"
                                                value={eventEditForm.contact_name}
                                                onChange={handleEventEditFormChange}
                                            />
                                            <input
                                                name="contact_email"
                                                placeholder="Contact email"
                                                value={eventEditForm.contact_email}
                                                onChange={handleEventEditFormChange}
                                            />
                                        </div>
                                        <input
                                            name="contact_phone"
                                            placeholder="Contact phone"
                                            value={eventEditForm.contact_phone}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <textarea
                                            name="notes"
                                            placeholder="Notes"
                                            value={eventEditForm.notes}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <div className="form-btns">
                                            <button className="secondary-btn" type="button" onClick={cancelEditingEvent}>
                                                Cancel
                                            </button>
                                            <button
                                                className="primary-btn"
                                                type="button"
                                                onClick={() => handleSaveEventEdit(event)}
                                                disabled={submittingEvent}
                                            >
                                                {submittingEvent ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {pastEvents.length > 0 && (
                    <div className="application-events application-events--past">
                        <div className="task-section-title">Past</div>
                        {pastEvents.map(event => (
                            <div className="application-event application-event--past" key={event.id}>
                                <div className="application-event__header">
                                    <span className="application-event__title">{event.title}</span>
                                    <span className="application-event__badge">
                                        {event.event_type_display || event.event_type}
                                    </span>
                                </div>
                                <div className="application-event__meta">
                                    {formatDateTime(event.starts_at)}
                                </div>
                                <div className="application-item__actions">
                                    <button
                                        type="button"
                                        className="application-item__edit"
                                        onClick={() => startEditingEvent(event)}
                                        aria-label={`Edit ${event.title}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        type="button"
                                        className="application-item__delete"
                                        onClick={() => setDeletePlannerTarget({ type: "event", item: event })}
                                        aria-label={`Delete ${event.title}`}
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                                {editingEventId === event.id && (
                                    <div className="application-inline-form">
                                        <input
                                            name="title"
                                            placeholder="Event title"
                                            value={eventEditForm.title}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <select
                                            name="event_type"
                                            value={eventEditForm.event_type}
                                            onChange={handleEventEditFormChange}
                                        >
                                            <option value="INTERVIEW">Interview</option>
                                            <option value="CALL">Call</option>
                                            <option value="DEADLINE">Deadline</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                        <EventScheduleFields
                                            startsAt={eventEditForm.starts_at}
                                            endsAt={eventEditForm.ends_at}
                                            onChange={handleEventEditScheduleChange}
                                        />
                                        <input
                                            name="location"
                                            placeholder="Location"
                                            value={eventEditForm.location}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <input
                                            name="meeting_link"
                                            placeholder="Meeting link"
                                            value={eventEditForm.meeting_link}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <textarea
                                            name="notes"
                                            placeholder="Notes"
                                            value={eventEditForm.notes}
                                            onChange={handleEventEditFormChange}
                                        />
                                        <div className="form-btns">
                                            <button className="secondary-btn" type="button" onClick={cancelEditingEvent}>
                                                Cancel
                                            </button>
                                            <button
                                                className="primary-btn"
                                                type="button"
                                                onClick={() => handleSaveEventEdit(event)}
                                                disabled={submittingEvent}
                                            >
                                                {submittingEvent ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid-mid">
                {/* Contacts card */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Contacts</span>
                        <button className="add-btn" onClick={() => {
                            setShowContactForm(!showContactForm);
                            setEditingContactId(null);
                            setNewContact({ first_name: "", last_name: "", email: "", phone: "", note: "" });
                        }}>+</button>
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
                            <button className="edit-btn" onClick={() => {
                                setNewContact({ ...contact });
                                setEditingContactId(contact.id);
                                setShowContactForm(false);
                            }}><FaEdit /></button>
                            <button className="delete-btn" onClick={() => handleDeleteContact(contact)}>×</button>
                        </div>
                    ))}

                    {editingContactId && (
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
                                <button className="secondary-btn" onClick={() => setEditingContactId(null)}>Cancel</button>
                                <button className="primary-btn" onClick={handleEditContact}>Save</button>
                            </div>
                        </div>
                    )}

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

                {/* Notes card */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">My notes</span>
                        <button className="add-btn" onClick={() => {
                            setShowNotesForm(!showNotesForm);
                            setEditingNoteId(null);
                            setNewNotes({ title: "", note:"" });
                        }}>+</button>
                    </div>

                    {notes.map(note => (
                        <div className="notes-item" key={note.id}>
                            <div className="note-content">
                                <div className="note-title">{note.title}</div>
                                <div className="note-date">{formatDate(note.created_at)}</div>
                                <div className="note-text">{note.note}</div>
                            </div>
                            <button className="edit-btn" onClick={() => {
                                setNewNotes({ title: note.title, note: note.note });
                                setEditingNoteId(note.id);
                                setShowNotesForm(false);
                            }}><FaEdit /></button>
                            <button className="delete-btn" onClick={() => handleDeleteNotes(note)}>×</button>
                        </div>
                    ))}

                    {editingNoteId && (
                        <div className="notes-form">
                            <input placeholder="Title" value={newNotes.title}
                                onChange={e => setNewNotes({...newNotes, title: e.target.value})} />
                            <input placeholder="Note" value={newNotes.note}
                                onChange={e => setNewNotes({...newNotes, note: e.target.value})} />
                            <div className="form-btns">
                                <button className="secondary-btn" onClick={() => setEditingNoteId(null)}>Cancel</button>
                                <button className="primary-btn" onClick={handleEditNotes}>Save</button>
                            </div>
                        </div>
                    )}

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

            <ConfirmModal
                isOpen={!!eventTimeConflict}
                title="Event time conflict"
                message={
                    eventTimeConflict
                        ? `You already have "${eventTimeConflict.title}" for ${eventTimeConflict.company_name} / ${eventTimeConflict.job_title} scheduled at ${formatDateTime(eventTimeConflict.starts_at)}. Create this event anyway?`
                        : ""
                }
                confirmText="Create anyway"
                cancelText="Edit event"
                onConfirm={handleConfirmEventConflict}
                onCancel={handleCancelEventConflict}
            />
            <ConfirmModal
                isOpen={!!deletePlannerTarget}
                title={`Delete ${deletePlannerTarget?.type || "item"}?`}
                message={
                    deletePlannerTarget
                        ? `Delete "${deletePlannerTarget.item.title}"? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmPlannerDelete}
                onCancel={() => setDeletePlannerTarget(null)}
            />
            <ConfirmModal
                isOpen={!!deleteContentTarget}
                title={`Delete ${deleteContentTarget?.type || "item"}?`}
                message={
                    deleteContentTarget
                        ? `Are you sure you want to delete "${getDeleteContentLabel()}"? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmContentDelete}
                onCancel={() => setDeleteContentTarget(null)}
            />
            <ConfirmModal
                isOpen={messageModal.isOpen}
                title={messageModal.title}
                message={messageModal.message}
                confirmText="OK"
                cancelText=""
                onConfirm={closeMessageModal}
                onCancel={closeMessageModal}
            />
        </div>
    );
}

export default JobApplicationPage;
