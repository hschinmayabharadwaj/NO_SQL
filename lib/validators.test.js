import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEvent, validateRegistration } from "./validators.js";

const event = { title: "Hackathon", description: "24h", date: "2030-01-01T10:00:00Z", venue: "Hall A", category: "Technical", capacity: "50" };

test("validateEvent accepts a valid event and converts types", () => {
  const { data, error } = validateEvent(event);
  assert.equal(error, undefined);
  assert.equal(data.capacity, 50);
  assert.ok(data.date instanceof Date);
});

test("validateEvent rejects bad fields", () => {
  assert.ok(validateEvent({ ...event, capacity: 0 }).error);
  assert.ok(validateEvent({ ...event, capacity: 2.5 }).error);
  assert.ok(validateEvent({ ...event, date: "nope" }).error);
  assert.ok(validateEvent({ ...event, category: "Other" }).error);
  assert.ok(validateEvent({}).error);
});

test("validateRegistration normalises USN/email and rejects bad input", () => {
  const ok = validateRegistration({ studentName: "Asha", usn: "1rv21cs001", email: "A@X.com", department: "CSE" });
  assert.equal(ok.data.usn, "1RV21CS001");
  assert.equal(ok.data.email, "a@x.com");
  assert.ok(validateRegistration({ studentName: "Asha", usn: "123", email: "a@x.com", department: "CSE" }).error);
  assert.ok(validateRegistration({ studentName: "Asha", usn: "1RV21CS001", email: "bad", department: "CSE" }).error);
});
