export const STATUSES = [
  "All",
  "Approved",
  "Confirmed",
  "Pending",
  "Completed",
  "Cancelled",
];

export const STATUS_META = {
  All: { pillClass: "fv-status-pill fv-s-all" },
  Approved: { pillClass: "fv-status-pill fv-s-approved" },
  Confirmed: { pillClass: "fv-status-pill fv-s-confirmed" },
  Pending: { pillClass: "fv-status-pill fv-s-pending" },
  Completed: { pillClass: "fv-status-pill fv-s-completed" },
  Cancelled: { pillClass: "fv-status-pill fv-s-cancelled" },
};

export const STATUS_BADGE = {
  Approved: "fv-badge fv-badge-approved",
  Confirmed: "fv-badge fv-badge-confirmed",
  Active: "fv-badge fv-badge-confirmed",
  Pending: "fv-badge fv-badge-pending",
  Completed: "fv-badge fv-badge-completed",
  Cancelled: "fv-badge fv-badge-cancelled",
};

export const PAY_BADGE = {
  Paid: "fv-pay fv-pay-paid",
  Pending: "fv-pay fv-pay-pending",
  Failed: "fv-pay fv-pay-failed",
  Refunded: "fv-pay fv-pay-refunded",
};

export const PAY_ICON = {
  Paid: "💳",
  Pending: "⏳",
  Failed: "❌",
  Refunded: "↩️",
};

export const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const toTitle = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const countFor = (bookings, mainTab, status) => {
  const tabKey = normalize(mainTab);
  const statusKey = normalize(status);

  const base = bookings.filter((item) => {
    if (tabKey === "all") return true;
    return normalize(item.type) === tabKey;
  });

  if (statusKey === "all") return base.length;

  return base.filter((item) => normalize(item.status) === statusKey).length;
};
