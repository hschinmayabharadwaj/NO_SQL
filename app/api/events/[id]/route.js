import { NextResponse } from "next/server";
import { getDb, toObjectId } from "@/lib/mongodb";
import { error, serverError } from "@/lib/http";
import { validateEvent } from "@/lib/validators";

// GET /api/events/[id] → event + registration count
export async function GET(_request, { params }) {
  const _id = toObjectId((await params).id);
  if (!_id) return error("Invalid event id");
  try {
    const db = await getDb();
    const event = await db.collection("events").findOne({ _id });
    if (!event) return error("Event not found", 404);

    const registrationCount = await db.collection("registrations").countDocuments({ eventId: _id });
    return NextResponse.json({
      ...event,
      registrationCount,
      seatsLeft: Math.max(event.capacity - registrationCount, 0),
    });
  } catch (err) {
    return serverError(err);
  }
}

// PUT /api/events/[id]
export async function PUT(request, { params }) {
  const _id = toObjectId((await params).id);
  if (!_id) return error("Invalid event id");
  try {
    const { data, error: msg } = validateEvent(await request.json().catch(() => ({})));
    if (msg) return error(msg);

    const db = await getDb();
    const registrationCount = await db.collection("registrations").countDocuments({ eventId: _id });
    if (data.capacity < registrationCount) {
      return error(`Capacity cannot be lower than current registrations (${registrationCount})`);
    }

    const updated = await db
      .collection("events")
      .findOneAndUpdate({ _id }, { $set: data }, { returnDocument: "after" });
    if (!updated) return error("Event not found", 404);
    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/events/[id] → also deletes its registrations
export async function DELETE(_request, { params }) {
  const _id = toObjectId((await params).id);
  if (!_id) return error("Invalid event id");
  try {
    const db = await getDb();
    const { deletedCount } = await db.collection("events").deleteOne({ _id });
    if (!deletedCount) return error("Event not found", 404);

    const regs = await db.collection("registrations").deleteMany({ eventId: _id });
    return NextResponse.json({ deleted: true, registrationsDeleted: regs.deletedCount });
  } catch (err) {
    return serverError(err);
  }
}
