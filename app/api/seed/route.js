import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { serverError } from "@/lib/http";

const daysFromNow = (days, hour) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// POST /api/seed → inserts 5 sample events and a few registrations (adds to existing data)
export async function POST() {
  try {
    const db = await getDb();
    const now = new Date();
    const events = [
      { title: "CodeSprint Hackathon 2026", description: "A 24-hour hackathon where teams build solutions to real campus problems. Food and swags provided.", date: daysFromNow(7, 9), venue: "Main Auditorium", category: "Technical", capacity: 100 },
      { title: "Intro to MongoDB Workshop", description: "Hands-on workshop covering documents, collections, CRUD, indexes and the aggregation pipeline.", date: daysFromNow(10, 14), venue: "CSE Lab 3", category: "Workshop", capacity: 40 },
      { title: "Rhythm Cultural Fest", description: "An evening of music, dance and drama performances by student clubs.", date: daysFromNow(14, 17), venue: "Open Air Theatre", category: "Cultural", capacity: 300 },
      { title: "Inter-Department Cricket League", description: "Department teams compete in a T10 knockout tournament.", date: daysFromNow(20, 8), venue: "College Ground", category: "Sports", capacity: 5 },
      { title: "AI in Healthcare Seminar", description: "Guest lecture by industry experts on how machine learning is transforming diagnostics.", date: daysFromNow(25, 11), venue: "Seminar Hall 1", category: "Seminar", capacity: 120 },
    ].map((e) => ({ ...e, createdAt: now }));

    const { insertedIds } = await db.collection("events").insertMany(events);
    const ids = Object.values(insertedIds);

    const students = [
      ["Ananya Rao", "1RV22CS014", "CSE"],
      ["Rahul Sharma", "1RV22IS031", "ISE"],
      ["Priya Nair", "1RV22EC007", "ECE"],
      ["Karthik Gowda", "1RV22ME022", "ME"],
      ["Sneha Kulkarni", "1RV22AI045", "AIML"],
      ["Vikram Hegde", "1RV22CS052", "CSE"],
    ];
    // [eventIndex, studentIndex] pairs
    const pairs = [[0, 0], [0, 1], [0, 5], [0, 4], [1, 0], [1, 4], [2, 2], [2, 3], [2, 1], [3, 3], [4, 4]];
    const registrations = pairs.map(([e, s]) => {
      const [studentName, usn, department] = students[s];
      return {
        eventId: ids[e],
        studentName,
        usn,
        email: `${studentName.split(" ")[0].toLowerCase()}.${usn.toLowerCase()}@college.edu`,
        department,
        registeredAt: now,
      };
    });
    await db.collection("registrations").insertMany(registrations);

    return NextResponse.json({ events: ids.length, registrations: registrations.length }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
