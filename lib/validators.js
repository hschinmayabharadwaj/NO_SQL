import { CATEGORIES, DEPARTMENTS, USN_PATTERN } from "./constants.js";

const str = (v) => (typeof v === "string" ? v.trim() : "");

// Each validator returns { error } or { data } with cleaned values ready to store.
export function validateEvent(body = {}) {
  const title = str(body.title);
  const description = str(body.description);
  const venue = str(body.venue);
  const category = str(body.category);
  const date = new Date(body.date);
  const capacity = Number(body.capacity);

  if (title.length < 3 || title.length > 100) return { error: "Title must be 3–100 characters" };
  if (!description) return { error: "Description is required" };
  if (!body.date || isNaN(date)) return { error: "A valid date is required" };
  if (!venue) return { error: "Venue is required" };
  if (!CATEGORIES.includes(category)) return { error: `Category must be one of: ${CATEGORIES.join(", ")}` };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) {
    return { error: "Capacity must be a whole number between 1 and 10000" };
  }
  return { data: { title, description, date, venue, category, capacity } };
}

export function validateRegistration(body = {}) {
  const studentName = str(body.studentName);
  const usn = str(body.usn).toUpperCase();
  const email = str(body.email).toLowerCase();
  const department = str(body.department);

  if (studentName.length < 2) return { error: "Student name is required" };
  if (!new RegExp(USN_PATTERN).test(usn)) return { error: "USN must look like 1RV21CS001" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "A valid email is required" };
  if (!DEPARTMENTS.includes(department)) return { error: `Department must be one of: ${DEPARTMENTS.join(", ")}` };
  return { data: { studentName, usn, email, department } };
}
