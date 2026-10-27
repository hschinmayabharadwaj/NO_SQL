import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { serverError } from "@/lib/http";

export const dynamic = "force-dynamic"; // never cache stats at build time

// GET /api/stats
export async function GET() {
  try {
    const db = await getDb();
    const [totalEvents, totalRegistrations, perEvent, perDepartment] = await Promise.all([
      db.collection("events").countDocuments(),
      db.collection("registrations").countDocuments(),

      // Registrations per event: join events → registrations, count matches.
      db
        .collection("events")
        .aggregate([
          {
            $lookup: {
              from: "registrations",
              localField: "_id",
              foreignField: "eventId",
              as: "regs",
            },
          },
          { $project: { title: 1, capacity: 1, registrations: { $size: "$regs" } } },
          { $sort: { registrations: -1, title: 1 } },
        ])
        .toArray(),

      // Registrations per department: group and count.
      db
        .collection("registrations")
        .aggregate([
          { $group: { _id: "$department", registrations: { $sum: 1 } } },
          { $project: { _id: 0, department: "$_id", registrations: 1 } },
          { $sort: { registrations: -1 } },
        ])
        .toArray(),
    ]);

    return NextResponse.json({ totalEvents, totalRegistrations, perEvent, perDepartment });
  } catch (err) {
    return serverError(err);
  }
}
