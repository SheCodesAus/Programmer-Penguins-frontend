import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  completeApplicationTask,
  createApplicationEvent,
  fetchApplicationEvents,
  fetchApplicationTasks,
  fetchKanbanApplications,
  reopenApplicationTask,
} from "../api/applications";
import "./TasksAgendaPage.css";

const EMPTY_EVENT_FORM = {
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

function formatDateTime(dateStr) {
  if (!dateStr) return "No due date";

  return new Date(dateStr).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOverdue(task) {
  return task.due_at && !task.completed_at && new Date(task.due_at) < new Date();
}

export default function TasksAgendaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedApplicationId = searchParams.get("application") || "";

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [loading, setLoading] = useState(true);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [error, setError] = useState("");

  const loadPlannerData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [taskData, eventData, applicationData] = await Promise.all([
        fetchApplicationTasks({ applicationId: selectedApplicationId }),
        fetchApplicationEvents({
          applicationId: selectedApplicationId,
          upcoming: true,
        }),
        fetchKanbanApplications(),
      ]);

      setTasks(taskData);
      setEvents(eventData);
      setApplications(applicationData);
    } catch (err) {
      setError(err.message || "Could not load tasks and agenda.");
    } finally {
      setLoading(false);
    }
  }, [selectedApplicationId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadPlannerData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadPlannerData]);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (application) => String(application.id) === selectedApplicationId,
      ),
    [applications, selectedApplicationId],
  );

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.completed_at),
    [tasks],
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed_at).slice(0, 5),
    [tasks],
  );

  async function handleToggleTask(task) {
    try {
      if (task.completed_at) {
        await reopenApplicationTask(task.id);
      } else {
        await completeApplicationTask(task.id);
      }

      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  }

  function handleEventFormChange(event) {
    const { name, value } = event.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateEvent(event) {
    event.preventDefault();

    if (!eventForm.job_application || !eventForm.title || !eventForm.starts_at) {
      setError("Please choose an application, title, and start time.");
      return;
    }

    try {
      setSubmittingEvent(true);
      setError("");

      await createApplicationEvent({
        ...eventForm,
        ends_at: eventForm.ends_at || null,
      });

      setEventForm(EMPTY_EVENT_FORM);
      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not create event.");
    } finally {
      setSubmittingEvent(false);
    }
  }

  return (
    <main className="tasks-agenda-page">
      <div className="tasks-agenda-page__header">
        <button
          className="secondary-btn"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Kanban
        </button>

        <div>
          <h1>Tasks & Agenda</h1>
          <p>
            {selectedApplication
              ? `${selectedApplication.company_name} · ${selectedApplication.job_title}`
              : "Track next steps, follow-ups, and scheduled interviews."}
          </p>
        </div>

        {selectedApplicationId && (
          <button
            className="secondary-btn"
            type="button"
            onClick={() => setSearchParams({})}
          >
            Show all
          </button>
        )}
      </div>

      {loading && <p className="tasks-agenda-page__message">Loading...</p>}
      {error && <p className="tasks-agenda-page__error">{error}</p>}

      {!loading && (
        <div className="tasks-agenda-layout">
          <section className="tasks-panel">
            <div className="tasks-panel__header">
              <h2>Open tasks</h2>
              <span>{openTasks.length}</span>
            </div>

            <div className="tasks-list">
              {openTasks.length === 0 && (
                <p className="tasks-agenda-page__message">No open tasks.</p>
              )}

              {openTasks.map((task) => (
                <article
                  className={`task-item ${isOverdue(task) ? "task-item--overdue" : ""}`}
                  key={task.id}
                >
                  <label className="task-item__check">
                    <input
                      type="checkbox"
                      checked={!!task.completed_at}
                      onChange={() => handleToggleTask(task)}
                    />
                    <span />
                  </label>

                  <div className="task-item__body">
                    <div className="task-item__title-row">
                      <h3>{task.title}</h3>
                      {task.is_required && <span>Required</span>}
                    </div>
                    <p>{task.company_name} · {task.job_title}</p>
                    {task.description && <small>{task.description}</small>}
                    <time>{formatDateTime(task.due_at)}</time>
                  </div>
                </article>
              ))}
            </div>

            {completedTasks.length > 0 && (
              <div className="completed-tasks">
                <h2>Recently completed</h2>
                {completedTasks.map((task) => (
                  <button
                    className="completed-task"
                    key={task.id}
                    type="button"
                    onClick={() => handleToggleTask(task)}
                  >
                    <span>{task.title}</span>
                    <small>{task.company_name}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="agenda-panel">
            <div className="tasks-panel__header">
              <h2>Upcoming</h2>
              <span>{events.length}</span>
            </div>

            <div className="events-list">
              {events.length === 0 && (
                <p className="tasks-agenda-page__message">No upcoming events.</p>
              )}

              {events.map((event) => (
                <article className="event-item" key={event.id}>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.company_name} · {event.job_title}</p>
                    <time>{formatDateTime(event.starts_at)}</time>
                    {event.location && <small>{event.location}</small>}
                    {event.overlap_warning && (
                      <span className="event-item__warning">
                        {event.overlap_warning}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <form className="event-form" onSubmit={handleCreateEvent}>
              <h2>Add interview or event</h2>

              <select
                name="job_application"
                value={eventForm.job_application}
                onChange={handleEventFormChange}
              >
                <option value="">Choose application</option>
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.company_name} · {application.job_title}
                  </option>
                ))}
              </select>

              <input
                name="title"
                value={eventForm.title}
                onChange={handleEventFormChange}
                placeholder="Event title"
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

              <div className="event-form__time-grid">
                <label>
                  <span>Starts</span>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={eventForm.starts_at}
                    onChange={handleEventFormChange}
                  />
                </label>

                <label>
                  <span>Ends</span>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={eventForm.ends_at}
                    onChange={handleEventFormChange}
                  />
                </label>
              </div>

              <input
                name="location"
                value={eventForm.location}
                onChange={handleEventFormChange}
                placeholder="Location"
              />

              <input
                name="meeting_link"
                value={eventForm.meeting_link}
                onChange={handleEventFormChange}
                placeholder="Meeting link"
              />

              <div className="event-form__time-grid">
                <input
                  name="contact_name"
                  value={eventForm.contact_name}
                  onChange={handleEventFormChange}
                  placeholder="Contact name"
                />

                <input
                  name="contact_email"
                  value={eventForm.contact_email}
                  onChange={handleEventFormChange}
                  placeholder="Contact email"
                />
              </div>

              <textarea
                name="notes"
                value={eventForm.notes}
                onChange={handleEventFormChange}
                placeholder="Notes"
              />

              <button className="primary-btn" type="submit" disabled={submittingEvent}>
                {submittingEvent ? "Saving..." : "Add event"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
