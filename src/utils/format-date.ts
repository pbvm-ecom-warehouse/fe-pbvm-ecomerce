import { format } from "date-fns";

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "---";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "---";
    return format(date, "dd/MM/yyyy HH:mm");
  } catch {
    return "---";
  }
}

