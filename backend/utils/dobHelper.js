const DMY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

const isValidDMY = (text) => {
  if (!DMY_REGEX.test(text)) return false;
  const [, dd, mm, yyyy] = text.match(DMY_REGEX);
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  if (year < 1900 || year > 2100) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const toDMY = (value) => {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const day = String(value.getUTCDate()).padStart(2, "0");
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const year = value.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }

  const text = String(value).trim();
  if (!text) return "";

  if (DMY_REGEX.test(text) && isValidDMY(text)) {
    return text;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split("/");
    const dmy = `${dd}-${mm}-${yyyy}`;
    return isValidDMY(dmy) ? dmy : "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [yyyy, mm, dd] = text.split("-");
    const dmy = `${dd}-${mm}-${yyyy}`;
    return isValidDMY(dmy) ? dmy : "";
  }

  // Legacy ISO date-time value.
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return toDMY(parsed);
  }

  return "";
};

const dmyToYmd = (value) => {
  const dmy = toDMY(value);
  if (!dmy) return "";
  const [dd, mm, yyyy] = dmy.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

module.exports = {
  DMY_REGEX,
  isValidDMY,
  toDMY,
  dmyToYmd,
};
