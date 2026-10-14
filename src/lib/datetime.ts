export function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
}

export function formatTime(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function toInputDateTime(iso: string): string {
  // YYYY-MM-DDTHH:mm for datetime-local
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputDateTime(value: string): string {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}
