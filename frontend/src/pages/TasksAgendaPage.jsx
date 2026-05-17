import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import ConfirmModal from "../components/common/ConfirmModal";
import EventScheduleFields from "../components/EventScheduleFields";
import { toDateTimeLocalValue } from "../utils/dateTimeLocal";
import { FaEdit } from "react-icons/fa";
import "./TasksAgendaPage.css";

const EMPTY_TASK_FORM = {
  job_application: "",
  title: "",
  description: "",
  due_at: "",
  is_required: false,
};

const EMPTY_TASK_EDIT_FORM = {
  title: "",
  description: "",
  due_at: "",
  is_required: false,
};

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
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [error, setError] = useState("");
  const [eventTimeConflict, setEventTimeConflict] = useState(null);
  const [pendingEventPayload, setPendingEventPayload] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState(EMPTY_TASK_EDIT_FORM);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventEditForm, setEventEditForm] = useState(EMPTY_EVENT_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  function toggleTaskForm() {
    setShowTaskForm((isOpen) => {
      const nextIsOpen = !isOpen;

      if (nextIsOpen) {
        setTaskForm((prev) => ({
          ...prev,
          job_application: prev.job_application || selectedApplicationId,
        }));
      }

      return nextIsOpen;
    });
  }

  function toggleEventForm() {
    setShowEventForm((isOpen) => {
      const nextIsOpen = !isOpen;

      if (nextIsOpen) {
        setEventForm((prev) => ({
          ...prev,
          job_application: prev.job_application || selectedApplicationId,
        }));
      }

      return nextIsOpen;
    });
  }

  function handleTaskFormChange(event) {
    const { name, value, checked, type } = event.target;

    setTaskForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  }

  async function handleCreateTask(formEvent) {
    formEvent.preventDefault();

    if (!taskForm.job_application || !taskForm.title.trim()) {
      setError("Please choose an application and enter a task title.");
      return;
    }

    try {
      setSubmittingTask(true);
      setError("");
      await createApplicationTask({
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        due_at: taskForm.due_at || null,
      });
      setTaskForm({
        ...EMPTY_TASK_FORM,
        job_application: selectedApplicationId,
      });
      setShowTaskForm(false);
      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not create task.");
    } finally {
      setSubmittingTask(false);
    }
  }

  function handleEventFormChange(event) {
    const { name, value } = event.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setTaskEditForm({
      title: task.title || "",
      description: task.description || "",
      due_at: toDateTimeLocalValue(task.due_at),
      is_required: !!task.is_required,
    });
    setError("");
  }

  function handleTaskEditFormChange(event) {
    const { name, value, checked, type } = event.target;

    setTaskEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setTaskEditForm(EMPTY_TASK_EDIT_FORM);
  }

  async function handleSaveTaskEdit(task) {
    if (!taskEditForm.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    try {
      setError("");
      await updateApplicationTask(task.id, {
        title: taskEditForm.title.trim(),
        description: taskEditForm.description.trim(),
        due_at: taskEditForm.due_at || null,
        is_required: taskEditForm.is_required,
      });
      cancelEditingTask();
      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  }

  function handleEventScheduleChange(updates) {
    setEventForm((prev) => ({ ...prev, ...updates }));
    setError("");
  }

  function getEventRange(eventData) {
    const startsAt = new Date(eventData.starts_at);
    const endsAt = eventData.ends_at
      ? new Date(eventData.ends_at)
      : new Date(startsAt.getTime() + 60 * 60 * 1000);

    return { startsAt, endsAt };
  }

  async function findEventTimeConflict(eventData, ignoredEventId = null) {
    if (!eventData.starts_at) return null;

    const allEvents = await fetchApplicationEvents();
    const { startsAt, endsAt } = getEventRange(eventData);

    return allEvents.find((existingEvent) => {
      if (ignoredEventId && existingEvent.id === ignoredEventId) return false;

      const existingStartsAt = new Date(existingEvent.starts_at);
      const existingEndsAt = existingEvent.ends_at
        ? new Date(existingEvent.ends_at)
        : new Date(existingStartsAt.getTime() + 60 * 60 * 1000);

      return existingStartsAt < endsAt && existingEndsAt > startsAt;
    }) || null;
  }

  async function createEventFromPayload(payload) {
    await createApplicationEvent(payload);

    setEventForm({
      ...EMPTY_EVENT_FORM,
      job_application: selectedApplicationId,
    });
    setShowEventForm(false);
    setEventTimeConflict(null);
    setPendingEventPayload(null);
    await loadPlannerData();
  }

  function startEditingEvent(event) {
    setEditingEventId(event.id);
    setEventEditForm({
      job_application: event.job_application || "",
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
    setError("");
  }

  function handleEventEditFormChange(event) {
    const { name, value } = event.target;
    setEventEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEventEditScheduleChange(updates) {
    setEventEditForm((prev) => ({ ...prev, ...updates }));
    setError("");
  }

  function cancelEditingEvent() {
    setEditingEventId(null);
    setEventEditForm(EMPTY_EVENT_FORM);
  }

  async function handleSaveEventEdit(event) {
    if (!eventEditForm.job_application || !eventEditForm.title || !eventEditForm.starts_at) {
      setError("Please choose an application, title, and start time.");
      return;
    }

    try {
      setError("");
      const payload = {
        ...eventEditForm,
        title: eventEditForm.title.trim(),
        ends_at: eventEditForm.ends_at || null,
      };
      const conflictEvent = await findEventTimeConflict(payload, event.id);

      if (conflictEvent) {
        setPendingEventPayload({ ...payload, id: event.id, mode: "update" });
        setEventTimeConflict(conflictEvent);
        return;
      }

      await updateApplicationEvent(event.id, payload);
      cancelEditingEvent();
      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not update event.");
    }
  }

  async function handleCreateEvent(formEvent) {
    formEvent.preventDefault();

    if (!eventForm.job_application || !eventForm.title || !eventForm.starts_at) {
      setError("Please choose an application, title, and start time.");
      return;
    }

    try {
      setSubmittingEvent(true);
      setError("");

      const payload = {
        ...eventForm,
        ends_at: eventForm.ends_at || null,
      };
      const conflictEvent = await findEventTimeConflict(payload);

      if (conflictEvent) {
        setPendingEventPayload(payload);
        setEventTimeConflict(conflictEvent);
        return;
      }

      await createEventFromPayload(payload);
    } catch (err) {
      setError(err.message || "Could not create event.");
    } finally {
      setSubmittingEvent(false);
    }
  }

  async function handleConfirmEventConflict() {
    if (!pendingEventPayload) return;

    try {
      setSubmittingEvent(true);
      setError("");
      if (pendingEventPayload.mode === "update") {
        const { id, ...payload } = pendingEventPayload;
        delete payload.mode;
        await updateApplicationEvent(id, payload);
        cancelEditingEvent();
        setEventTimeConflict(null);
        setPendingEventPayload(null);
        await loadPlannerData();
      } else {
        await createEventFromPayload(pendingEventPayload);
      }
    } catch (err) {
      setError(err.message || "Could not create event.");
      setEventTimeConflict(null);
      setPendingEventPayload(null);
    } finally {
      setSubmittingEvent(false);
    }
  }

  function handleCancelEventConflict() {
    setEventTimeConflict(null);
    setPendingEventPayload(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      setError("");
      if (deleteTarget.type === "task") {
        await deleteApplicationTask(deleteTarget.item.id);
        if (editingTaskId === deleteTarget.item.id) {
          cancelEditingTask();
        }
      } else {
        await deleteApplicationEvent(deleteTarget.item.id);
        if (editingEventId === deleteTarget.item.id) {
          cancelEditingEvent();
        }
      }
      setDeleteTarget(null);
      await loadPlannerData();
    } catch (err) {
      setError(err.message || "Could not delete item.");
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
          ◀ Return to dashboard
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
            <section className="planner-section">
              <div className="tasks-panel__header">
                <h2>Open tasks</h2>
                <div className="tasks-panel__header-actions">
                  <span>{openTasks.length}</span>
                  <button
                    type="button"
                    className="planner-add-button"
                    onClick={toggleTaskForm}
                    aria-label={showTaskForm ? "Close task form" : "Add task"}
                    title={showTaskForm ? "Close task form" : "Add task"}
                  >
                    {showTaskForm ? "×" : "+"}
                  </button>
                </div>
              </div>

              {showTaskForm && (
                <form className="planner-create-form" onSubmit={handleCreateTask}>
                  <h3>Add task</h3>
                  <select
                    name="job_application"
                    value={taskForm.job_application}
                    onChange={handleTaskFormChange}
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
                    value={taskForm.title}
                    onChange={handleTaskFormChange}
                    placeholder="Task title"
                  />
                  <textarea
                    name="description"
                    value={taskForm.description}
                    onChange={handleTaskFormChange}
                    placeholder="Description"
                  />
                  <div className="planner-edit-form__grid">
                    <label>
                      <span>Due</span>
                      <input
                        type="datetime-local"
                        name="due_at"
                        value={taskForm.due_at}
                        onChange={handleTaskFormChange}
                      />
                    </label>
                    <label className="planner-edit-form__checkbox">
                      <input
                        type="checkbox"
                        name="is_required"
                        checked={taskForm.is_required}
                        onChange={handleTaskFormChange}
                      />
                      <span>Required</span>
                    </label>
                  </div>
                  <div className="planner-create-form__actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setShowTaskForm(false)}
                    >
                      Cancel
                    </button>
                    <button className="primary-btn" type="submit" disabled={submittingTask}>
                      {submittingTask ? "Saving..." : "Add task"}
                    </button>
                  </div>
                </form>
              )}

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
                    <div className="planner-item__actions planner-item__actions--compact">
                      <button
                        type="button"
                        className="planner-item__edit"
                        onClick={() => startEditingTask(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="planner-item__delete"
                        onClick={() => setDeleteTarget({ type: "task", item: task })}
                        aria-label={`Delete ${task.title}`}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                    {editingTaskId === task.id && (
                      <div className="planner-edit-form planner-edit-form--full">
                        <input
                          name="title"
                          value={taskEditForm.title}
                          onChange={handleTaskEditFormChange}
                          placeholder="Task title"
                        />
                        <textarea
                          name="description"
                          value={taskEditForm.description}
                          onChange={handleTaskEditFormChange}
                          placeholder="Description"
                        />
                        <div className="planner-edit-form__grid">
                          <label>
                            <span>Due</span>
                            <input
                              type="datetime-local"
                              name="due_at"
                              value={taskEditForm.due_at}
                              onChange={handleTaskEditFormChange}
                            />
                          </label>
                          <label className="planner-edit-form__checkbox">
                            <input
                              type="checkbox"
                              name="is_required"
                              checked={taskEditForm.is_required}
                              onChange={handleTaskEditFormChange}
                            />
                            <span>Required</span>
                          </label>
                        </div>
                        <div className="planner-item__actions">
                          <button type="button" className="secondary-btn" onClick={cancelEditingTask}>
                            Cancel
                          </button>
                          <button type="button" className="primary-btn" onClick={() => handleSaveTaskEdit(task)}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {completedTasks.length > 0 && (
              <section className="planner-section">
                <div className="tasks-panel__header">
                  <h2>Recently completed</h2>
                  <span>{completedTasks.length}</span>
                </div>

                <div className="completed-tasks">
                  {completedTasks.map((task) => (
                    <div
                      className="completed-task"
                      key={task.id}
                    >
                      <button
                        className="completed-task__toggle"
                        type="button"
                        onClick={() => handleToggleTask(task)}
                      >
                        <span>{task.title}</span>
                        <small>{task.company_name}</small>
                      </button>
                      <div className="planner-item__actions planner-item__actions--compact">
                        <button
                          type="button"
                          className="planner-item__edit"
                          onClick={() => startEditingTask(task)}
                          aria-label={`Edit ${task.title}`}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="planner-item__delete"
                          onClick={() => setDeleteTarget({ type: "task", item: task })}
                          aria-label={`Delete ${task.title}`}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                      {editingTaskId === task.id && (
                        <div className="planner-edit-form planner-edit-form--full">
                          <input
                            name="title"
                            value={taskEditForm.title}
                            onChange={handleTaskEditFormChange}
                            placeholder="Task title"
                          />
                          <textarea
                            name="description"
                            value={taskEditForm.description}
                            onChange={handleTaskEditFormChange}
                            placeholder="Description"
                          />
                          <div className="planner-edit-form__grid">
                            <label>
                              <span>Due</span>
                              <input
                                type="datetime-local"
                                name="due_at"
                                value={taskEditForm.due_at}
                                onChange={handleTaskEditFormChange}
                              />
                            </label>
                            <label className="planner-edit-form__checkbox">
                              <input
                                type="checkbox"
                                name="is_required"
                                checked={taskEditForm.is_required}
                                onChange={handleTaskEditFormChange}
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          <div className="planner-item__actions">
                            <button type="button" className="secondary-btn" onClick={cancelEditingTask}>
                              Cancel
                            </button>
                            <button type="button" className="primary-btn" onClick={() => handleSaveTaskEdit(task)}>
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>

          <section className="agenda-panel">
            <section className="planner-section">
              <div className="tasks-panel__header">
                <h2>Upcoming</h2>
                <div className="tasks-panel__header-actions">
                  <span>{events.length}</span>
                  <button
                    type="button"
                    className="planner-add-button"
                    onClick={toggleEventForm}
                    aria-label={showEventForm ? "Close event form" : "Add interview or event"}
                    title={showEventForm ? "Close event form" : "Add interview or event"}
                  >
                    {showEventForm ? "×" : "+"}
                  </button>
                </div>
              </div>

              {showEventForm && (
                <form className="planner-create-form" onSubmit={handleCreateEvent}>
                  <h3>Add interview or event</h3>

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

                  <EventScheduleFields
                    startsAt={eventForm.starts_at}
                    endsAt={eventForm.ends_at}
                    onChange={handleEventScheduleChange}
                  />

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

                  <div className="planner-create-form__actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setShowEventForm(false)}
                    >
                      Cancel
                    </button>
                    <button className="primary-btn" type="submit" disabled={submittingEvent}>
                      {submittingEvent ? "Saving..." : "Add event"}
                    </button>
                  </div>
                </form>
              )}

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
                    <div className="planner-item__actions planner-item__actions--compact">
                      <button
                        type="button"
                        className="planner-item__edit"
                        onClick={() => startEditingEvent(event)}
                        aria-label={`Edit ${event.title}`}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="planner-item__delete"
                        onClick={() => setDeleteTarget({ type: "event", item: event })}
                        aria-label={`Delete ${event.title}`}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                    {editingEventId === event.id && (
                      <div className="planner-edit-form planner-edit-form--full">
                        <select
                          name="job_application"
                          value={eventEditForm.job_application}
                          onChange={handleEventEditFormChange}
                        >
                          <option value="">Choose application</option>
                          {applications.map((application) => (
                            <option key={application.id} value={application.id}>
                              {application.company_name} В· {application.job_title}
                            </option>
                          ))}
                        </select>
                        <input
                          name="title"
                          value={eventEditForm.title}
                          onChange={handleEventEditFormChange}
                          placeholder="Event title"
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
                          value={eventEditForm.location}
                          onChange={handleEventEditFormChange}
                          placeholder="Location"
                        />
                        <input
                          name="meeting_link"
                          value={eventEditForm.meeting_link}
                          onChange={handleEventEditFormChange}
                          placeholder="Meeting link"
                        />
                        <div className="event-form__time-grid">
                          <input
                            name="contact_name"
                            value={eventEditForm.contact_name}
                            onChange={handleEventEditFormChange}
                            placeholder="Contact name"
                          />
                          <input
                            name="contact_email"
                            value={eventEditForm.contact_email}
                            onChange={handleEventEditFormChange}
                            placeholder="Contact email"
                          />
                        </div>
                        <textarea
                          name="notes"
                          value={eventEditForm.notes}
                          onChange={handleEventEditFormChange}
                          placeholder="Notes"
                        />
                        <div className="planner-item__actions">
                          <button type="button" className="secondary-btn" onClick={cancelEditingEvent}>
                            Cancel
                          </button>
                          <button type="button" className="primary-btn" onClick={() => handleSaveEventEdit(event)}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

          </section>
        </div>
      )}

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
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type || "item"}?`}
        message={
          deleteTarget
            ? `Delete "${deleteTarget.item.title}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
