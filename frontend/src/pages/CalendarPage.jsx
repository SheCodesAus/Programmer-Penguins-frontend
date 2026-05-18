import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import "./CalendarPage.css";
import {
    completeApplicationTask,
    createApplicationEvent,
    createApplicationTask,
    deleteApplicationEvent,
    deleteApplicationTask,
    fetchApplicationEvents,
    fetchApplicationTasks,
    fetchKanbanApplications,
    reopenApplicationTask,
    updateApplicationEvent,
    updateApplicationTask,
} from "../api/applications";
import LoadingState from "../components/common/LoadingState";
import EventScheduleFields from "../components/EventScheduleFields";
import { getCompanyInitials, getCompanyLogoUrl } from "../utils/companyLogo";
import { toDateTimeLocalValue } from "../utils/dateTimeLocal";

const VIEW_MODES = [
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_CREATE_TASK_FORM = {
    job_application: "",
    title: "",
    description: "",
    due_at: "",
    is_required: false,
};

const EMPTY_CREATE_EVENT_FORM = {
    job_application: "",
    title: "",
    event_type: "INTERVIEW",
    starts_at: "",
    ends_at: "",
    location: "",
    meeting_link: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
};

const calendarDataCache = {
    events: null,
    tasks: null,
    applications: null,
};

function getCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return days;
}

function getStartOfWeek(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    return start;
}

function getWeekDates(date) {
    const start = getStartOfWeek(date);

    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(start);
        day.setDate(start.getDate() + index);

        return day;
    });
}

function toDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function buildLocalDateTime(date, timeValue = "09:00") {
    return `${toDateValue(date)}T${timeValue}`;
}

function addMinutesToLocalDateTime(dateTimeValue, minutes) {
    const date = new Date(dateTimeValue);
    date.setMinutes(date.getMinutes() + minutes);

    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");

    return `${toDateValue(date)}T${hours}:${mins}`;
}

function isSameCalendarDay(firstDate, secondDate) {
    return (
        firstDate.getDate() === secondDate.getDate() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getFullYear() === secondDate.getFullYear()
    );
}

function isTodayDate(date) {
    return isSameCalendarDay(date, new Date());
}

function getEventsForDate(events, date) {
    return events.filter(event => isSameCalendarDay(new Date(event.starts_at), date));
}

function getTasksForDate(tasks, date) {
    return tasks.filter(task => task.due_at && isSameCalendarDay(new Date(task.due_at), date));
}

function formatCalendarTitle(date, viewMode) {
    if (viewMode === "day") {
        return date.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    if (viewMode === "week") {
        const weekDates = getWeekDates(date);
        const start = weekDates[0];
        const end = weekDates[6];
        const sameMonth = start.getMonth() === end.getMonth();

        if (sameMonth) {
            return `${start.toLocaleDateString("en-AU", { day: "numeric" })} - ${end.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`;
        }

        return `${start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`;
    }

    return date.toLocaleString("default", {
        month: "long",
        year: "numeric",
    });
}

function formatDateTime(str) {
    if (!str) return "No date";
    return new Date(str).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatItemTime(str) {
    if (!str) return "";

    return new Date(str).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
    });
}

const EVENT_COLOURS = {
    INTERVIEW: "#8680f1",
    CALL: "#62e380",
    DEADLINE: "#d184a7",
    OTHER: "#224ce3",
};

const EVENT_TYPE_ORDER = ["INTERVIEW", "CALL", "DEADLINE", "OTHER"];

const EVENT_TYPE_LABELS = {
    INTERVIEW: "Interview",
    CALL: "Call",
    DEADLINE: "Deadline",
    OTHER: "Other",
};

const TASK_SCHEDULE_COLOURS = {
    overdue: "#db2121",
    due_today: "#ebc79d",
    scheduled: "#1fb586",
    done: "#9CA3AF",
};

const TASK_SCHEDULE_ORDER = ["overdue", "due_today", "scheduled", "done"];

const TASK_SCHEDULE_LABELS = {
    overdue: "Overdue",
    due_today: "Due today",
    scheduled: "Scheduled",
    done: "Done",
};

function formatChoiceLabel(value) {
    return (value || "")
        .toLowerCase()
        .split("_")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getEventTypeLabel(event) {
    return event.event_type_display || EVENT_TYPE_LABELS[event.event_type] || formatChoiceLabel(event.event_type || "OTHER");
}

function getTaskTypeLabel(task) {
    if (task.completed_at) return "Completed";

    return task.task_type_display || formatChoiceLabel(task.task_type || "CUSTOM");
}

function getTaskScheduleKey(task) {
    if (task.completed_at) return "done";
    if (!task.due_at) return "scheduled";

    const now = new Date();
    const due = new Date(task.due_at);

    if (due < now) return "overdue";

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (due <= today) return "due_today";

    return "scheduled";
}

function getTaskColour(task) {
    return TASK_SCHEDULE_COLOURS[getTaskScheduleKey(task)];
}

function buildEventLegendItems(visibleEvents) {
    const visibleTypeLabels = new Map();

    visibleEvents.forEach(event => {
        const type = event.event_type || "OTHER";

        if (!visibleTypeLabels.has(type)) {
            visibleTypeLabels.set(type, getEventTypeLabel(event));
        }
    });

    const knownTypes = EVENT_TYPE_ORDER.map(type => ({
        key: type,
        label: visibleTypeLabels.get(type) || EVENT_TYPE_LABELS[type],
        colour: EVENT_COLOURS[type] || EVENT_COLOURS.OTHER,
    }));
    const unknownVisibleTypes = [...visibleTypeLabels.keys()]
        .filter(type => !EVENT_TYPE_ORDER.includes(type))
        .map(type => ({
            key: type,
            label: visibleTypeLabels.get(type),
            colour: EVENT_COLOURS[type] || EVENT_COLOURS.OTHER,
        }));

    return [...knownTypes, ...unknownVisibleTypes];
}

function buildTaskLegendItems(visibleTasks) {
    const visibleGroups = new Set(visibleTasks.map(getTaskScheduleKey));

    return TASK_SCHEDULE_ORDER
        .filter(group => visibleGroups.has(group))
        .map(group => ({
            key: group,
            label: TASK_SCHEDULE_LABELS[group],
            colour: TASK_SCHEDULE_COLOURS[group],
        }));
}

function getApplicationId(item) {
    return item.job_application || item.job_application_detail?.id || null;
}

function getApplicationSummary(item) {
    return {
        companyName:
            item.company_name ||
            item.job_application_detail?.company_name ||
            "Unknown company",
        jobTitle:
            item.job_title ||
            item.job_application_detail?.job_title ||
            "Job application",
    };
}

function getApplicationLogoSource(item) {
    return item.job_application_detail || {
        company_name: item.company_name,
        job_title: item.job_title,
    };
}

function ApplicationContextCard({ item }) {
    const applicationId = getApplicationId(item);
    const { companyName, jobTitle } = getApplicationSummary(item);

    return (
        <div className="application-context-card">
            <div>
                <span>Application</span>
                <strong>{companyName}</strong>
                <small>{jobTitle}</small>
            </div>

            {applicationId && (
                <Link
                    className="application-context-card__link"
                    to={`/job-application/${applicationId}`}
                >
                    Open application
                </Link>
            )}
        </div>
    );
}

function CalendarItemContent({ item }) {
    const { companyName, jobTitle } = getApplicationSummary(item);

    return (
        <>
            <span className="calendar-item__title">{item.title}</span>
            <span className="calendar-item__meta">{companyName}</span>
            <span className="calendar-item__role">{jobTitle}</span>
        </>
    );
}

function CompanyLogo({ application }) {
    const [failedUrl, setFailedUrl] = useState(null);
    if (!application) return null;
    const logoUrl = getCompanyLogoUrl(application);
    const initials = getCompanyInitials(application.company_name);
    const showLogo = logoUrl && logoUrl !== failedUrl;

    return showLogo ? (
        <img
            className="company-logo"
            src={logoUrl}
            alt={application.company_name}
            onError={() => setFailedUrl(logoUrl)}
        />
    ) : (
        <div className="company-logo company-logo--fallback">
            {initials}
        </div>
    );
}

function CalendarCreateModal({
    applications,
    applicationsLoading,
    selectedDate,
    onClose,
    onCreated,
}) {
    const initialStartsAt = buildLocalDateTime(selectedDate);
    const [createType, setCreateType] = useState("task");
    const [taskForm, setTaskForm] = useState({
        ...EMPTY_CREATE_TASK_FORM,
        due_at: initialStartsAt,
    });
    const [eventForm, setEventForm] = useState({
        ...EMPTY_CREATE_EVENT_FORM,
        starts_at: initialStartsAt,
        ends_at: addMinutesToLocalDateTime(initialStartsAt, 60),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const availableApplications = applications.filter(
        (application) => application.is_active !== false && !application.is_archived,
    );

    function handleTaskChange(event) {
        const { name, type, checked, value } = event.target;

        setTaskForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setError("");
    }

    function handleEventChange(event) {
        const { name, value } = event.target;

        setEventForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError("");
    }

    function handleEventScheduleChange(updates) {
        setEventForm((prev) => ({
            ...prev,
            ...updates,
        }));
        setError("");
    }

    function handleTaskScheduleChange(updates) {
        setTaskForm((prev) => ({
            ...prev,
            due_at: updates.starts_at || "",
        }));
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        try {
            setSaving(true);

            if (createType === "task") {
                if (!taskForm.job_application || !taskForm.title.trim()) {
                    setError("Please choose an application and enter a task title.");
                    return;
                }

                await createApplicationTask({
                    ...taskForm,
                    job_application: Number(taskForm.job_application),
                    title: taskForm.title.trim(),
                    description: taskForm.description.trim(),
                    due_at: taskForm.due_at || null,
                    task_type: "CUSTOM",
                });
            } else {
                if (!eventForm.job_application || !eventForm.title.trim() || !eventForm.starts_at) {
                    setError("Please choose an application, event title, and start time.");
                    return;
                }

                await createApplicationEvent({
                    ...eventForm,
                    job_application: Number(eventForm.job_application),
                    title: eventForm.title.trim(),
                    ends_at: eventForm.ends_at || null,
                });
            }

            await onCreated();
            onClose();
        } catch (err) {
            setError(err.message || "Could not create calendar item.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="popup-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <form className="popup calendar-create-modal" onSubmit={handleSubmit}>
                <div className="popup-header">
                    <div>
                        <h3 className="popup-title">Add to calendar</h3>
                        <p className="calendar-create-modal__date">
                            {selectedDate.toLocaleDateString("en-AU", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                            })}
                        </p>
                    </div>
                    <button className="popup-close" type="button" onClick={onClose}>x</button>
                </div>

                <div className="calendar-create-type" aria-label="Create type">
                    <button
                        type="button"
                        className={createType === "task" ? "active" : ""}
                        onClick={() => {
                            setCreateType("task");
                            setError("");
                        }}
                    >
                        Task
                    </button>
                    <button
                        type="button"
                        className={createType === "event" ? "active" : ""}
                        onClick={() => {
                            setCreateType("event");
                            setError("");
                        }}
                    >
                        Event
                    </button>
                </div>

                <div className="calendar-create-form">
                    {createType === "task" ? (
                        <>
                            <label>
                                <span>Application</span>
                                <select
                                    name="job_application"
                                    value={taskForm.job_application}
                                    onChange={handleTaskChange}
                                    disabled={applicationsLoading}
                                >
                                    <option value="">
                                        {applicationsLoading ? "Loading applications..." : "Choose application"}
                                    </option>
                                    {availableApplications.map((application) => (
                                        <option key={application.id} value={application.id}>
                                            {application.company_name} - {application.job_title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span>Task title</span>
                                <input
                                    name="title"
                                    value={taskForm.title}
                                    onChange={handleTaskChange}
                                    placeholder="e.g. Follow up with recruiter"
                                />
                            </label>
                            <EventScheduleFields
                                title="Due date"
                                startLabel="Due time"
                                startsAt={taskForm.due_at}
                                endsAt=""
                                showEndFields={false}
                                onChange={handleTaskScheduleChange}
                            />
                            <label>
                                <span>Description</span>
                                <textarea
                                    name="description"
                                    value={taskForm.description}
                                    onChange={handleTaskChange}
                                    placeholder="Optional notes"
                                />
                            </label>
                            <label className="calendar-create-form__checkbox">
                                <input
                                    type="checkbox"
                                    name="is_required"
                                    checked={taskForm.is_required}
                                    onChange={handleTaskChange}
                                />
                                <span>Required task</span>
                            </label>
                        </>
                    ) : (
                        <>
                            <label>
                                <span>Application</span>
                                <select
                                    name="job_application"
                                    value={eventForm.job_application}
                                    onChange={handleEventChange}
                                    disabled={applicationsLoading}
                                >
                                    <option value="">
                                        {applicationsLoading ? "Loading applications..." : "Choose application"}
                                    </option>
                                    {availableApplications.map((application) => (
                                        <option key={application.id} value={application.id}>
                                            {application.company_name} - {application.job_title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span>Event title</span>
                                <input
                                    name="title"
                                    value={eventForm.title}
                                    onChange={handleEventChange}
                                    placeholder="e.g. First interview"
                                />
                            </label>
                            <label>
                                <span>Event type</span>
                                <select
                                    name="event_type"
                                    value={eventForm.event_type}
                                    onChange={handleEventChange}
                                >
                                    <option value="INTERVIEW">Interview</option>
                                    <option value="CALL">Call</option>
                                    <option value="DEADLINE">Deadline</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </label>
                            <EventScheduleFields
                                startsAt={eventForm.starts_at}
                                endsAt={eventForm.ends_at}
                                onChange={handleEventScheduleChange}
                            />
                            <label>
                                <span>Location</span>
                                <input
                                    name="location"
                                    value={eventForm.location}
                                    onChange={handleEventChange}
                                    placeholder="Office, phone, or online"
                                />
                            </label>
                            <label>
                                <span>Meeting link</span>
                                <input
                                    name="meeting_link"
                                    value={eventForm.meeting_link}
                                    onChange={handleEventChange}
                                    placeholder="https://..."
                                />
                            </label>
                            <div className="calendar-create-form__grid">
                                <label>
                                    <span>Contact name</span>
                                    <input
                                        name="contact_name"
                                        value={eventForm.contact_name}
                                        onChange={handleEventChange}
                                    />
                                </label>
                                <label>
                                    <span>Contact email</span>
                                    <input
                                        name="contact_email"
                                        value={eventForm.contact_email}
                                        onChange={handleEventChange}
                                    />
                                </label>
                            </div>
                            <label>
                                <span>Notes</span>
                                <textarea
                                    name="notes"
                                    value={eventForm.notes}
                                    onChange={handleEventChange}
                                    placeholder="Optional notes"
                                />
                            </label>
                        </>
                    )}
                </div>

                {error && <p className="popup-error">{error}</p>}

                <div className="popup-actions">
                    <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="btn-primary" type="submit" disabled={saving || applicationsLoading || availableApplications.length === 0}>
                        {saving ? "Saving..." : `Create ${createType}`}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EventPopup({ event, onClose, onSaved, onDeleted }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        title: event.title || "",
        event_type: event.event_type || "INTERVIEW",
        starts_at: toDateTimeLocalValue(event.starts_at),
        ends_at: toDateTimeLocalValue(event.ends_at),
        location: event.location || "",
        meeting_link: event.meeting_link || "",
        contact_name: event.contact_name || "",
        contact_email: event.contact_email || "",
        contact_phone: event.contact_phone || "",
        notes: event.notes || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    function handleChange(event) {
        setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const updated = await updateApplicationEvent(event.id, form);
            onSaved(updated);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this event?")) return;
        try {
            await deleteApplicationEvent(event.id);
            onDeleted(event.id);
            onClose();
        } catch (err) {
            setError(err.message);
        }
    }

    const colour = EVENT_COLOURS[event.event_type] || EVENT_COLOURS.OTHER;
    const applicationLogoSource = getApplicationLogoSource(event);
    const { companyName } = getApplicationSummary(event);

    return (
        <div
            className="popup-backdrop"
            onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}
        >
            <div className="popup">
                <div className="popup-header">
                    <div className="popup-meta">
                        <span className="popup-colour-dot" style={{ background: colour }} />
                        <CompanyLogo application={applicationLogoSource} />
                        <span className="popup-meta__company">{companyName}</span>
                    </div>
                    <button className="popup-close" type="button" onClick={onClose}>x</button>
                </div>

                {!isEditing ? (
                    <div className="popup-body">
                        <h3 className="popup-title">{event.title}</h3>
                        <div className="popup-badge" style={{ background: colour }}>
                            {getEventTypeLabel(event)}
                        </div>
                        <ApplicationContextCard item={event} />
                        <div className="popup-field">
                            <span>Starts</span>
                            <span>{formatDateTime(event.starts_at)}</span>
                        </div>
                        {event.ends_at && (
                            <div className="popup-field">
                                <span>Ends</span>
                                <span>{formatDateTime(event.ends_at)}</span>
                            </div>
                        )}
                        {event.location && (
                            <div className="popup-field">
                                <span>Location</span>
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.meeting_link && (
                            <div className="popup-field">
                                <span>Link</span>
                                <a href={event.meeting_link} target="_blank" rel="noreferrer">
                                    Join meeting
                                </a>
                            </div>
                        )}
                        {event.contact_name && (
                            <div className="popup-field">
                                <span>Contact</span>
                                <span>{event.contact_name}</span>
                            </div>
                        )}
                        {event.contact_email && (
                            <div className="popup-field">
                                <span>Email</span>
                                <span>{event.contact_email}</span>
                            </div>
                        )}
                        {event.contact_phone && (
                            <div className="popup-field">
                                <span>Phone</span>
                                <span>{event.contact_phone}</span>
                            </div>
                        )}
                        {event.notes && (
                            <div className="popup-notes">
                                <span>Notes</span>
                                <p>{event.notes}</p>
                            </div>
                        )}
                        <div className="popup-actions">
                            <button className="btn-danger" type="button" onClick={handleDelete}>
                                Delete
                            </button>
                            <button className="btn-primary" type="button" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="popup-body">
                        <label>
                            Title
                            <input name="title" value={form.title} onChange={handleChange} />
                        </label>
                        <label>
                            Type
                            <select name="event_type" value={form.event_type} onChange={handleChange}>
                                <option value="INTERVIEW">Interview</option>
                                <option value="CALL">Call</option>
                                <option value="DEADLINE">Deadline</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </label>
                        <label>
                            Starts at
                            <input
                                type="datetime-local"
                                name="starts_at"
                                value={form.starts_at}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Ends at
                            <input
                                type="datetime-local"
                                name="ends_at"
                                value={form.ends_at}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Location
                            <input name="location" value={form.location} onChange={handleChange} />
                        </label>
                        <label>
                            Meeting link
                            <input name="meeting_link" value={form.meeting_link} onChange={handleChange} />
                        </label>
                        <label>
                            Contact name
                            <input name="contact_name" value={form.contact_name} onChange={handleChange} />
                        </label>
                        <label>
                            Contact email
                            <input name="contact_email" value={form.contact_email} onChange={handleChange} />
                        </label>
                        <label>
                            Contact phone
                            <input name="contact_phone" value={form.contact_phone} onChange={handleChange} />
                        </label>
                        <label>
                            Notes
                            <textarea name="notes" value={form.notes} onChange={handleChange} />
                        </label>
                        {error && <p className="popup-error">{error}</p>}
                        <div className="popup-actions">
                            <button
                                className="btn-secondary"
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TaskPopup({ task, onClose, onSaved, onDeleted }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        title: task.title || "",
        description: task.description || "",
        due_at: toDateTimeLocalValue(task.due_at),
        task_type: task.task_type || "CUSTOM",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    function handleChange(event) {
        setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
    }

    async function handleSave() {
        setSaving(true);
        setError(null);

        try {
            const updated = await updateApplicationTask(task.id, form);
            onSaved(updated);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this task?")) return;

        try {
            await deleteApplicationTask(task.id);
            onDeleted(task.id);
            onClose();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleComplete() {
        try {
            const updated = task.completed_at
                ? await reopenApplicationTask(task.id)
                : await completeApplicationTask(task.id);
            onSaved(updated);
        } catch (err) {
            setError(err.message);
        }
    }

    const colour = getTaskColour(task);
    const applicationLogoSource = getApplicationLogoSource(task);
    const { companyName } = getApplicationSummary(task);
    const titleClassName = `popup-title ${task.completed_at ? "popup-title--completed" : ""}`;

    return (
        <div
            className="popup-backdrop"
            onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}
        >
            <div className="popup">
                <div className="popup-header">
                    <div className="popup-meta">
                        <span className="popup-colour-dot" style={{ background: colour }} />
                        <CompanyLogo application={applicationLogoSource} />
                        <span className="popup-meta__company">{companyName}</span>
                    </div>
                    <button className="popup-close" type="button" onClick={onClose}>x</button>
                </div>

                {!isEditing ? (
                    <div className="popup-body">
                        <h3 className={titleClassName}>{task.title}</h3>
                        <div className="popup-badge" style={{ background: colour }}>
                            {getTaskTypeLabel(task)}
                        </div>
                        <ApplicationContextCard item={task} />
                        {task.due_at && (
                            <div className="popup-field">
                                <span>Due</span>
                                <span>{formatDateTime(task.due_at)}</span>
                            </div>
                        )}
                        {task.completed_at && (
                            <div className="popup-field">
                                <span>Completed</span>
                                <span>{formatDateTime(task.completed_at)}</span>
                            </div>
                        )}
                        {task.description && (
                            <div className="popup-notes">
                                <span>Description</span>
                                <p>{task.description}</p>
                            </div>
                        )}
                        {error && <p className="popup-error">{error}</p>}
                        <div className="popup-actions">
                            <button className="btn-danger" type="button" onClick={handleDelete}>
                                Delete
                            </button>
                            <button className="btn-secondary" type="button" onClick={handleComplete}>
                                {task.completed_at ? "Reopen" : "Mark complete"}
                            </button>
                            <button className="btn-primary" type="button" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="popup-body">
                        <label>
                            Title
                            <input name="title" value={form.title} onChange={handleChange} />
                        </label>
                        <label>
                            Type
                            <select name="task_type" value={form.task_type} onChange={handleChange}>
                                <option value="TAILOR_RESUME">Tailor resume</option>
                                <option value="COVER_LETTER">Prepare cover letter</option>
                                <option value="SUBMIT_APPLICATION">Submit application</option>
                                <option value="FOLLOW_UP">Follow up</option>
                                <option value="INTERVIEW_PREP">Prepare for interview</option>
                                <option value="INTERVIEW_FOLLOW_UP">Interview follow-up</option>
                                <option value="REJECTION_FEEDBACK">Ask for feedback</option>
                                <option value="OFFER_REVIEW">Review offer</option>
                                <option value="CUSTOM">Custom</option>
                            </select>
                        </label>
                        <label>
                            Due at
                            <input
                                type="datetime-local"
                                name="due_at"
                                value={form.due_at}
                                onChange={handleChange}
                            />
                        </label>
                        <label>
                            Description
                            <textarea name="description" value={form.description} onChange={handleChange} />
                        </label>
                        {error && <p className="popup-error">{error}</p>}
                        <div className="popup-actions">
                            <button
                                className="btn-secondary"
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button className="btn-primary" type="button" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState("month");
    const [filter, setFilter] = useState("all");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const days = getCalendarDays(currentDate);

    useEffect(() => {
        async function loadInitialCalendarData() {
            const hasCachedCalendarData = calendarDataCache.events && calendarDataCache.tasks;

            try {
                if (hasCachedCalendarData) {
                    setEvents(calendarDataCache.events);
                    setTasks(calendarDataCache.tasks);
                    setApplications(calendarDataCache.applications || []);
                    setIsLoading(false);
                } else {
                    setIsLoading(true);
                }
                setError(null);

                const [eventData, taskData] = await Promise.all([
                    fetchApplicationEvents(),
                    fetchApplicationTasks(),
                ]);

                calendarDataCache.events = eventData;
                calendarDataCache.tasks = taskData;

                setEvents(eventData);
                setTasks(taskData);
            } catch (err) {
                if (!hasCachedCalendarData) {
                    setError(err.message);
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadInitialCalendarData();
    }, []);

    async function refreshCalendarData() {
        const [eventData, taskData] = await Promise.all([
            fetchApplicationEvents(),
            fetchApplicationTasks(),
        ]);

        calendarDataCache.events = eventData;
        calendarDataCache.tasks = taskData;

        setEvents(eventData);
        setTasks(taskData);
    }

    async function loadApplicationsForCreate() {
        if (calendarDataCache.applications) {
            setApplications(calendarDataCache.applications);
            return;
        }

        try {
            setApplicationsLoading(true);
            const applicationData = await fetchKanbanApplications();

            calendarDataCache.applications = applicationData;
            setApplications(applicationData);
        } catch (err) {
            setError(err.message);
        } finally {
            setApplicationsLoading(false);
        }
    }

    function handleOpenCreateModal() {
        setShowCreateModal(true);
        void loadApplicationsForCreate();
    }

    const calendarTitle = formatCalendarTitle(currentDate, viewMode);
    const weekDates = getWeekDates(currentDate);
    const visibleDates = viewMode === "week"
        ? weekDates
        : viewMode === "day"
            ? [currentDate]
            : days
                .filter(Boolean)
                .map(day => new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    const visibleEvents = filter === "tasks"
        ? []
        : visibleDates.flatMap(date => getEventsForDate(events, date));
    const visibleTasks = filter === "events"
        ? []
        : visibleDates.flatMap(date => getTasksForDate(tasks, date));
    const visibleEventsCount = visibleEvents.length;
    const visibleTasksCount = visibleTasks.length;
    const eventLegendItems = buildEventLegendItems(visibleEvents);
    const taskLegendItems = buildTaskLegendItems(visibleTasks);

    function handlePreviousPeriod() {
        setCurrentDate(prevDate => {
            if (viewMode === "day") {
                return new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() - 1);
            }

            if (viewMode === "week") {
                return new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() - 7);
            }

            return new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
        });
    }

    function handleNextPeriod() {
        setCurrentDate(prevDate => {
            if (viewMode === "day") {
                return new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 1);
            }

            if (viewMode === "week") {
                return new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 7);
            }

            return new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
        });
    }

    function handleOpenDay(date) {
        setCurrentDate(date);
        setViewMode("day");
    }

    function handleCalendarCellKeyDown(event, date) {
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        handleOpenDay(date);
    }

    function getVisibleItemsForDate(date) {
        return {
            dayEvents: filter === "tasks" ? [] : getEventsForDate(events, date),
            dayTasks: filter === "events" ? [] : getTasksForDate(tasks, date),
        };
    }

    function renderCalendarCell(date, key, { isMuted = false } = {}) {
        const { dayEvents, dayTasks } = getVisibleItemsForDate(date);
        const isToday = isTodayDate(date);

        return (
            <div
                key={key}
                className={`calendar-cell calendar-cell--clickable ${isToday ? "today" : ""} ${isMuted ? "muted" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenDay(date)}
                onKeyDown={(event) => handleCalendarCellKeyDown(event, date)}
            >
                <div className="day-number-wrap">
                    <span className="day-number">{date.getDate()}</span>
                    {viewMode !== "month" && (
                        <small>{date.toLocaleDateString("en-AU", { month: "short" })}</small>
                    )}
                </div>

                {dayEvents.map(event => (
                    <button
                        key={event.id}
                        type="button"
                        className="calendar-event"
                        style={{ background: EVENT_COLOURS[event.event_type] || EVENT_COLOURS.OTHER }}
                        onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelectedEvent(event);
                        }}
                    >
                        <CalendarItemContent item={event} />
                    </button>
                ))}
                {dayTasks.map(task => (
                    <button
                        key={task.id}
                        type="button"
                        className="calendar-task"
                        style={{ background: getTaskColour(task) }}
                        onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelectedTask(task);
                        }}
                    >
                        <CalendarItemContent item={task} />
                    </button>
                ))}
            </div>
        );
    }

    function renderCalendarGrid() {
        const month = currentDate.getMonth();

        if (viewMode === "week") {
            return (
                <div className="calendar-grid calendar-grid--week">
                    {WEEKDAY_LABELS.map(d => (
                        <div key={d} className="calendar-header-cell">{d}</div>
                    ))}
                    {weekDates.map(date => renderCalendarCell(date, date.toISOString(), {
                        isMuted: date.getMonth() !== month,
                    }))}
                </div>
            );
        }

        return (
            <div className="calendar-grid">
                {WEEKDAY_LABELS.map(d => (
                    <div key={d} className="calendar-header-cell">{d}</div>
                ))}

                {days.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="calendar-cell empty" />;
                    }

                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

                    return renderCalendarCell(date, date.toISOString());
                })}
            </div>
        );
    }

    function renderDayAgenda() {
        const { dayEvents, dayTasks } = getVisibleItemsForDate(currentDate);
        const scheduleItems = [
            ...dayEvents.map(event => ({
                id: `event-${event.id}`,
                type: "event",
                item: event,
                sortDate: new Date(event.starts_at),
            })),
            ...dayTasks.map(task => ({
                id: `task-${task.id}`,
                type: "task",
                item: task,
                sortDate: new Date(task.due_at),
            })),
        ].sort((first, second) => first.sortDate - second.sortDate);

        if (scheduleItems.length === 0) {
            return (
                <div className="day-agenda__empty">
                    No tasks or events scheduled for this day.
                </div>
            );
        }

        return (
            <div className="day-agenda">
                {scheduleItems.map(({ id, type, item }) => {
                    const isEvent = type === "event";
                    const colour = isEvent
                        ? EVENT_COLOURS[item.event_type] || EVENT_COLOURS.OTHER
                        : getTaskColour(item);
                    const time = isEvent ? formatItemTime(item.starts_at) : formatItemTime(item.due_at);

                    return (
                        <article className="day-agenda-item" key={id}>
                            <div className="day-agenda-item__time">
                                <span>{time || "Any time"}</span>
                                <small>{isEvent ? "Event" : "Task"}</small>
                            </div>
                            <button
                                type="button"
                                className="day-agenda-item__card"
                                onClick={() => isEvent ? setSelectedEvent(item) : setSelectedTask(item)}
                            >
                                <span
                                    className="day-agenda-item__dot"
                                    style={{ background: colour }}
                                />
                                <CalendarItemContent item={item} />
                            </button>
                        </article>
                    );
                })}
            </div>
        );
    }

    if (isLoading) {
        return (
            <main className="calendar-page calendar-page--state">
                <LoadingState />
            </main>
        );
    }

    if (error) {
        return (
            <main className="calendar-page calendar-page--state">
                <div className="calendar-state calendar-state--error">Error: {error}</div>
            </main>
        );
    }

    return (
        <main className="calendar-page">
            <header className="calendar-page__header">
                <div>
                    <span className="calendar-page__eyebrow">
                        <CalendarDays size={16} />
                        Schedule
                    </span>
                    <h1>Calendar</h1>
                    <p>See interviews, follow-ups, deadlines, and application tasks by date.</p>
                </div>

                <div className="calendar-summary" aria-label="Calendar summary">
                    <span>{events.length} events</span>
                    <span>{tasks.filter(task => task.due_at).length} dated tasks</span>
                </div>
            </header>

            <section className="calendar-shell">
                <div className="calendar-toolbar">
                    <div className="calendar-nav">
                        <button
                            className="arrow"
                            type="button"
                            aria-label={`Previous ${viewMode}`}
                            onClick={handlePreviousPeriod}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <h2>{calendarTitle}</h2>
                        <button
                            className="arrow"
                            type="button"
                            aria-label={`Next ${viewMode}`}
                            onClick={handleNextPeriod}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="calendar-toolbar__controls">
                        <div className="calendar-view-toggle" aria-label="Calendar view">
                            {VIEW_MODES.map(mode => (
                                <button
                                    key={mode.value}
                                    type="button"
                                    className={`view-btn ${viewMode === mode.value ? "active" : ""}`}
                                    onClick={() => setViewMode(mode.value)}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div className="calendar-filters" aria-label="Calendar filters">
                            {["all", "events", "tasks"].map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    className={`filter-btn ${filter === f ? "active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        <button
                            className="calendar-add-button"
                            type="button"
                            onClick={handleOpenCreateModal}
                            aria-label="Add task or event"
                            title="Add task or event"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <div className="calendar-legend">
                    {filter !== "tasks" && (
                        <section className="legend-group" aria-label="Visible event types">
                            <div className="legend-group__heading">
                                <h3>Events by type</h3>
                                <span>{visibleEventsCount}</span>
                            </div>
                            <div className="legend-group__items">
                                {eventLegendItems.map(item => (
                                    <span key={item.key} className="legend-item legend-item--event">
                                        <span className="legend-dot" style={{ background: item.colour }} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {filter !== "events" && (
                        <section className="legend-group" aria-label="Visible task due date groups">
                            <div className="legend-group__heading">
                                <h3>Tasks by date</h3>
                                <span>{visibleTasksCount}</span>
                            </div>
                            {taskLegendItems.length > 0 ? (
                                <div className="legend-group__items">
                                    {taskLegendItems.map(item => (
                                        <span key={item.key} className="legend-item legend-item--task">
                                            <span className="legend-dot" style={{ background: item.colour }} />
                                            {item.label}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="legend-empty">No visible tasks</p>
                            )}
                        </section>
                    )}
                </div>

                {viewMode !== "day" && visibleEventsCount === 0 && visibleTasksCount === 0 && (
                    <div className="calendar-empty">No dated items to show for this view yet.</div>
                )}

                {viewMode === "day" ? renderDayAgenda() : renderCalendarGrid()}
            </section>

            {selectedEvent && (
                <EventPopup
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onSaved={updated => {
                        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
                        setSelectedEvent(updated);
                    }}
                    onDeleted={id => setEvents(prev => prev.filter(e => e.id !== id))}
                />
            )}

            {selectedTask && (
                <TaskPopup
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onSaved={updated => {
                        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                        setSelectedTask(updated);
                    }}
                    onDeleted={id => setTasks(prev => prev.filter(t => t.id !== id))}
                />
            )}

            {showCreateModal && (
                <CalendarCreateModal
                    applications={applications}
                    applicationsLoading={applicationsLoading}
                    selectedDate={currentDate}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={refreshCalendarData}
                />
            )}
        </main>
    );
}

export default CalendarPage;
