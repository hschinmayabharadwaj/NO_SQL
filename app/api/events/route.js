import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { error, serverError } from "@/lib/http";
import { validateEvent } from "@/lib/validators";

// GET /api/events?category=&search=
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      // Escape regex special chars so user input is matched literally (case-insensitive).
      const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ title: rx }, { description: rx }, { venue: rx }];
    }

    const db = await getDb();
    const events = await db.collection("events").find(filter).sort({ date: 1 }).toArray();
    return NextResponse.json(events);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/events
export async function POST(request) {
  try {
    const { data, error: msg } = validateEvent(await request.json().catch(() => ({})));
    if (msg) return error(msg);

    const db = await getDb();
    const doc = { ...data, createdAt: new Date() };
    const { insertedId } = await db.collection("events").insertOne(doc);
    return NextResponse.json({ ...doc, _id: insertedId }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
