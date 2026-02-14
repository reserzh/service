import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

export function formatCurrency(amount: string | number | null | undefined): string {
  if (amount == null) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return format(parseISO(dateStr), "MMM d, yyyy h:mm a");
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return format(parseISO(dateStr), "h:mm a");
}

export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return "Unscheduled";
  const s = formatTime(start);
  if (!end) return s;
  return `${s} - ${formatTime(end)}`;
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatAddress(property: {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
}): string {
  const line1 = property.addressLine1;
  const line2 = property.addressLine2 ? ` ${property.addressLine2}` : "";
  return `${line1}${line2}, ${property.city}, ${property.state} ${property.zip}`;
}

export function formatCustomerName(customer: { firstName: string; lastName: string }): string {
  return `${customer.firstName} ${customer.lastName}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
