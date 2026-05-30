/** Display formatters for the Catr portal. Date strings are `YYYY-MM-DD`. */

export function formatEventDate(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventDateLong(date: string): string {
  if (!date) return "Date TBD";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatUSDCents(cents: number): string {
  if (!cents) return "Budget TBD";
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
