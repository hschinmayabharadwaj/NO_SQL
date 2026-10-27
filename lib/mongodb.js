import { MongoClient, ObjectId } from "mongodb";

const DB_NAME = "event_registration";

// Cache the connection promise on `global` so Vercel's warm serverless invocations
// (and Next.js dev hot-reloads) reuse one MongoClient instead of opening a new one per request.
export function getDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }
  if (!global._mongoDbPromise) {
    global._mongoDbPromise = new MongoClient(process.env.MONGODB_URI)
      .connect()
      .then(async (client) => {
        const db = client.db(DB_NAME);
        // Enforces "one registration per USN per event" even under concurrent requests.
        await db.collection("registrations").createIndex({ eventId: 1, usn: 1 }, { unique: true });
        return db;
      })
      .catch((err) => {
        global._mongoDbPromise = null; // don't cache a failed connection
        throw err;
      });
  }
  return global._mongoDbPromise;
}

export function toObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : null;
}
