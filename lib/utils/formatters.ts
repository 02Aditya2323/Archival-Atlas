export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateLabel(value: string | null) {
  if (!value) {
    return "Date unknown";
  }

  const yearMatch = value.match(/^-?\d{1,4}/);
  const year = yearMatch ? Number(yearMatch[0]) : Number.NaN;

  if (!Number.isNaN(year) && year <= 0) {
    return `${Math.abs(year)} BCE`;
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (!Number.isNaN(year)) {
    return String(year);
  }

  return value;
}

export function formatYearLabel(year: number | null) {
  if (year === null) {
    return "Unknown";
  }

  return year <= 0 ? `${Math.abs(year)} BCE` : String(year);
}

export function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
