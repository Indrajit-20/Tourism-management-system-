export const to24HourInput = (value) => {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return "";

  if (/^\d{2}:\d{2}$/.test(text)) return text;

  const period = text.slice(-2);
  const timePart = text.replace(/AM|PM/, "").trim();
  const [hourText, minuteText] = timePart.split(":");

  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  hour = hour % 12;
  if (period === "PM") hour += 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const to12HourDisplay = (value) => {
  const text = String(value || "").trim().toUpperCase();
  if (!text) return "-";

  if (text.includes("AM") || text.includes("PM")) return text;

  const [hourText, minuteText] = text.split(":");
  const hour24 = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) return text;

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

export const toMinutes = (value) => {
  const time24 = to24HourInput(value);
  if (!time24) return null;

  const [hourText, minuteText] = time24.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};
