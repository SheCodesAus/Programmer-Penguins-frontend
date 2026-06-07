import "./EventScheduleFields.css";

const DEFAULT_START_TIME = "09:00";
const DEFAULT_DURATION_MINUTES = 60;

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  const label = `${period} ${hour12}:${String(minutes).padStart(2, "0")} (${value})`;

  return { value, label };
});

function hasTimezone(value) {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toLocalDateTimeInputValue(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${toDateInputValue(date)}T${hours}:${minutes}`;
}

function getTodayDateValue() {
  return toDateInputValue(new Date());
}

function getTomorrowDateValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toDateInputValue(tomorrow);
}

function getDateValue(dateTimeValue) {
  if (dateTimeValue && hasTimezone(dateTimeValue)) {
    return toDateInputValue(new Date(dateTimeValue));
  }

  return dateTimeValue ? dateTimeValue.slice(0, 10) : "";
}

function getTimeValue(dateTimeValue) {
  if (dateTimeValue && hasTimezone(dateTimeValue)) {
    const date = new Date(dateTimeValue);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  return dateTimeValue ? dateTimeValue.slice(11, 16) : "";
}

function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return "";

  return `${dateValue}T${timeValue}`;
}

function addMinutes(dateTimeValue, minutes) {
  if (!dateTimeValue) return "";

  const date = new Date(dateTimeValue);
  date.setMinutes(date.getMinutes() + minutes);

  return toLocalDateTimeInputValue(date);
}

function getDurationMinutes(startsAt, endsAt) {
  if (!startsAt || !endsAt) return DEFAULT_DURATION_MINUTES;

  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();

  if (!Number.isFinite(diff) || diff <= 0) return DEFAULT_DURATION_MINUTES;

  return Math.round(diff / 60000);
}

function formatPreview(dateTimeValue) {
  if (!dateTimeValue) return "";

  return new Date(dateTimeValue).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function EventScheduleFields({
  startsAt,
  endsAt,
  onChange,
  title = "Schedule",
  startLabel = "Start time",
  showEndFields = true,
}) {
  const dateValue = getDateValue(startsAt);
  const startTimeValue = getTimeValue(startsAt);
  const endTimeValue = getTimeValue(endsAt);
  const durationMinutes = getDurationMinutes(startsAt, endsAt);
  const durationOptionValue = DURATION_OPTIONS.some(
    (option) => option.value === durationMinutes,
  )
    ? durationMinutes
    : DEFAULT_DURATION_MINUTES;

  function updateStart(nextDateValue, nextStartTimeValue) {
    const nextStartsAt = combineDateAndTime(nextDateValue, nextStartTimeValue);

    onChange({
      starts_at: nextStartsAt,
      ...(showEndFields
        ? { ends_at: nextStartsAt ? addMinutes(nextStartsAt, durationMinutes) : "" }
        : {}),
    });
  }

  function handleDateChange(nextDateValue) {
    updateStart(nextDateValue, startTimeValue || DEFAULT_START_TIME);
  }

  function handleStartTimeChange(nextStartTimeValue) {
    updateStart(dateValue || getTodayDateValue(), nextStartTimeValue);
  }

  function handleEndTimeChange(nextEndTimeValue) {
    const nextDateValue = dateValue || getTodayDateValue();
    const nextStartsAt =
      startsAt || combineDateAndTime(nextDateValue, startTimeValue || DEFAULT_START_TIME);
    let nextEndsAt = combineDateAndTime(nextDateValue, nextEndTimeValue);

    if (nextEndsAt && new Date(nextEndsAt) <= new Date(nextStartsAt)) {
      nextEndsAt = addMinutes(nextEndsAt, 24 * 60);
    }

    onChange({
      starts_at: nextStartsAt,
      ends_at: nextEndsAt,
    });
  }

  function handleDurationChange(nextDurationMinutes) {
    if (!startsAt) return;

    onChange({
      starts_at: startsAt,
      ends_at: addMinutes(startsAt, Number(nextDurationMinutes)),
    });
  }

  return (
    <div className="event-schedule">
      <div className="event-schedule__header">
        <span className="event-schedule__title">{title}</span>
        <div className="event-schedule__quick-actions">
          <button
            type="button"
            className={`event-schedule__quick ${dateValue === getTodayDateValue() ? "active" : ""}`}
            onClick={() => handleDateChange(getTodayDateValue())}
          >
            Today
          </button>
          <button
            type="button"
            className={`event-schedule__quick ${dateValue === getTomorrowDateValue() ? "active" : ""}`}
            onClick={() => handleDateChange(getTomorrowDateValue())}
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="event-schedule__grid">
        <label className="event-schedule__field event-schedule__field--wide">
          <span>Date</span>
          <input
            type="date"
            value={dateValue}
            onChange={(event) => handleDateChange(event.target.value)}
          />
        </label>

        <label className="event-schedule__field">
          <span>{startLabel}</span>
          <select
            value={startTimeValue}
            onChange={(event) => handleStartTimeChange(event.target.value)}
          >
            <option value="">Choose time</option>
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {showEndFields && (
          <>
            <label className="event-schedule__field">
              <span>End time</span>
              <select
                value={endTimeValue}
                onChange={(event) => handleEndTimeChange(event.target.value)}
              >
                <option value="">Choose time</option>
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="event-schedule__field event-schedule__field--wide">
              <span>Duration</span>
              <select
                value={durationOptionValue}
                onChange={(event) => handleDurationChange(event.target.value)}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {startsAt && (
        <div className="event-schedule__preview">
          {formatPreview(startsAt)}
          {showEndFields && endsAt ? ` - ${formatPreview(endsAt)}` : ""}
        </div>
      )}
    </div>
  );
}
