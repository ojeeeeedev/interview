import { format, addHours } from "date-fns";

/**
 * Calendar Utilities
 * 
 * Provides functions to generate deep-links for Google and Outlook calendars,
 * and a utility to download RFC 5545 compliant .ics files for offline/Apple iCal usage.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
}

/**
 * Generates a Google Calendar web-based event creation link.
 */
export const getGoogleCalendarUrl = (event: CalendarEvent) => {
  const { title, description, startDate, endDate } = event;
  const end = endDate || addHours(startDate, 1);
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${fmt(startDate)}/${fmt(end)}`;
};

/**
 * Generates an Outlook.com web-based event creation link.
 */
export const getOutlookCalendarUrl = (event: CalendarEvent) => {
  const { title, description, startDate, endDate } = event;
  const end = endDate || addHours(startDate, 1);
  const fmt = (d: Date) => d.toISOString();
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&startdt=${fmt(startDate)}&enddt=${fmt(end)}`;
};

/**
 * Generates and triggers a browser download for a standard .ics (iCalendar) file.
 * This format is supported by almost all calendar applications (Apple, Outlook, etc.).
 */
export const downloadIcsFile = (event: CalendarEvent, fileName: string = "event.ics") => {
  const { title, description, startDate, endDate } = event;
  const end = endDate || addHours(startDate, 1);
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
  
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
