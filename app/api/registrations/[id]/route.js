import { NextResponse } from "next/server";
import { getDb, toObjectId } from "@/lib/mongodb";
import { error, serverError } from "@/lib/http";

// DELETE /api/registrations/[id] → cancel a registration
export async function DELETE(_request, { params }) {
  const _id = toObjectId((await params).id);
  if (!_id) return error("Invalid registration id");
  try {
    const db = await getDb();
    const { deletedCount } = await db.collection("registrations").deleteOne({ _id });
    if (!deletedCount) return error("Registration not found", 404);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
