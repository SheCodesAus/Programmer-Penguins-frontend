const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const APPLICATIONS_PATH = "/api/applications";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `${res.status} ${res.statusText}${bodyText ? ` – ${bodyText}` : ""}`,
    );
  }
  return res.json();
}

function toApiDateTime(value) {
  if (!value) return null;

  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

export async function fetchKanbanApplications({ signal } = {}) {
  return apiFetch(`${APPLICATIONS_PATH}/kanban/`, { signal });
}

export async function updateApplicationStatus(id, newStatus) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
}

export async function createApplication(data) {
  return apiFetch(`${APPLICATIONS_PATH}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function extractJobFromUrl(url) {
  return apiFetch(`${APPLICATIONS_PATH}/extract/`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function deleteApplication(id) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/`, {
    method: "DELETE",
  });
}

export async function updateApplicationInterest(id, interestLevel) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ interest_level: interestLevel }),
  });
}

export async function fetchArchivedApplications() {
  return apiFetch(`${APPLICATIONS_PATH}/archived/`);
}

export async function fetchDeletedApplications() {
  return apiFetch(`${APPLICATIONS_PATH}/deleted/`);
}

export async function archiveApplication(id) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/archive/`, {
    method: "PATCH",
  });
}

export async function restoreApplication(id) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/restore/`, {
    method: "PATCH",
  });
}

export async function updateApplication(id, data) {
  return apiFetch(`${APPLICATIONS_PATH}/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchApplicationTasks({ applicationId, completed } = {}) {
  const params = new URLSearchParams();

  if (applicationId) {
    params.set("application", applicationId);
  }

  if (completed !== undefined) {
    params.set("completed", completed ? "true" : "false");
  }

  const query = params.toString();

  return apiFetch(`${APPLICATIONS_PATH}/tasks/${query ? `?${query}` : ""}`);
}

export async function createApplicationTask(data) {
  return apiFetch(`${APPLICATIONS_PATH}/tasks/`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      due_at: toApiDateTime(data.due_at),
    }),
  });
}

export async function completeApplicationTask(id) {
  return apiFetch(`${APPLICATIONS_PATH}/tasks/${id}/complete/`, {
    method: "PATCH",
  });
}

export async function reopenApplicationTask(id) {
  return apiFetch(`${APPLICATIONS_PATH}/tasks/${id}/reopen/`, {
    method: "PATCH",
  });
}

export async function fetchApplicationEvents({ applicationId, upcoming } = {}) {
  const params = new URLSearchParams();

  if (applicationId) {
    params.set("application", applicationId);
  }

  if (upcoming !== undefined) {
    params.set("upcoming", upcoming ? "true" : "false");
  }

  const query = params.toString();

  return apiFetch(`${APPLICATIONS_PATH}/events/${query ? `?${query}` : ""}`);
}

export async function createApplicationEvent(data) {
  return apiFetch(`${APPLICATIONS_PATH}/events/`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      starts_at: toApiDateTime(data.starts_at),
      ends_at: toApiDateTime(data.ends_at),
    }),
  });
}
