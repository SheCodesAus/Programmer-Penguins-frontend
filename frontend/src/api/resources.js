const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const RESOURCES_PATH = "/api/resources";

function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function resourceFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let bodyText = "";

    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }

    throw new Error(
      `${response.status} ${response.statusText}${bodyText ? ` - ${bodyText}` : ""}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchResources() {
  return resourceFetch(`${RESOURCES_PATH}/`);
}

export async function createResource(data) {
  return resourceFetch(`${RESOURCES_PATH}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteResource(id) {
  return resourceFetch(`${RESOURCES_PATH}/${id}/`, {
    method: "DELETE",
  });
}

export async function parseResourceUrl(url) {
  return resourceFetch(`${RESOURCES_PATH}/metadata/`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function parseChatgptSharedUrl(url) {
  return resourceFetch(`${RESOURCES_PATH}/chatgpt-metadata/`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
