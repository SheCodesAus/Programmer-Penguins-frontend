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