import { NextResponse } from "next/server";

export const error = (message, status = 400) => NextResponse.json({ error: message }, { status });

export function serverError(err) {
  console.error(err);
  return error(`Server error: ${err.message}`, 500);
}
