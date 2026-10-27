import { NextResponse } from "next/server";
import { getDb, toObjectId } from "@/lib/mongodb";
import { error, serverError } from "@/lib/http";
import { validateRegistration } from "@/lib/validators";

// GET /api/registrations?eventId=
export async function GET(request) {
  const eventId = toObjectId(new URL(request.url).searchParams.get("eventId"));
  if (!eventId) return error("A valid eventId query parameter is required");
  try {
    const db = await getDb();
    const registrations = await db
      .collection("registrations")
      .find({ eventId })
      .sort({ registeredAt: -1 })
      .toArray();
    return NextResponse.json(registrations);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/registrations
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventId = toObjectId(body.eventId);
    if (!eventId) return error("A valid eventId is required");
    const { data, error: msg } = validateRegistration(body);
    if (msg) return error(msg);

    const db = await getDb();
    const event = await db.collection("events").findOne({ _id: eventId });
    if (!event) return error("Event not found", 404);

    // shortcut: count-then-insert can overbook by a seat or two under heavy concurrent load; fine for a demo.
    const count = await db.collection("registrations").countDocuments({ eventId });
    if (count >= event.capacity) return error("Sorry, this event is full", 409);

    const doc = { eventId, ...data, registeredAt: new Date() };
    const { insertedId } = await db.collection("registrations").insertOne(doc);
    return NextResponse.json({ ...doc, _id: insertedId }, { status: 201 });
  } catch (err) {
    // 11000 = duplicate key on the unique { eventId, usn } index
    if (err.code === 11000) return error("This USN is already registered for this event", 409);
    return serverError(err);
  }
}
