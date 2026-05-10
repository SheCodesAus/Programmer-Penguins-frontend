const STORAGE_KEY = "jobTrackerRestoredApplications";

export const RESTORED_APPLICATION_BADGE_DURATION_MS = 10 * 60 * 1000;

const RESTORE_LABELS = {
  archive: "Just restored from archive",
  trash: "Just restored from trash",
};

function readMarkers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeMarkers(markers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    // Ignore storage failures; badges are a nice-to-have UI hint.
  }
}

function getActiveMarkers(markers, now) {
  return Object.entries(markers).reduce((active, [id, marker]) => {
    if (
      marker?.expiresAt > now &&
      RESTORE_LABELS[marker.source]
    ) {
      active[id] = {
        source: marker.source,
        restoredAt: marker.restoredAt,
        expiresAt: marker.expiresAt,
        label: RESTORE_LABELS[marker.source],
      };
    }

    return active;
  }, {});
}

export function markApplicationRestored(applicationId, source) {
  if (!applicationId || !RESTORE_LABELS[source]) return;

  const now = Date.now();
  const markers = getActiveMarkers(readMarkers(), now);

  markers[String(applicationId)] = {
    source,
    restoredAt: now,
    expiresAt: now + RESTORED_APPLICATION_BADGE_DURATION_MS,
    label: RESTORE_LABELS[source],
  };

  writeMarkers(markers);
}

export function getRestoredApplicationBadges() {
  const activeMarkers = getActiveMarkers(readMarkers(), Date.now());
  writeMarkers(activeMarkers);
  return activeMarkers;
}
