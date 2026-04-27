const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let bodyText = "";

    try {
      bodyText = await res.text();
    } catch {
      // ignore
    }

    throw new Error(
      `${res.status} ${res.statusText}${bodyText ? ` – ${bodyText}` : ""}`
    );
  }

  return res.json();
}

export async function loginUser({ email, password }) {
  return apiFetch("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function signupUser(data) {
  return apiFetch("/api/auth/registration/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginWithGoogle(accessToken) {
  return apiFetch("/api/auth/google/", {
    method: "POST",
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });
}