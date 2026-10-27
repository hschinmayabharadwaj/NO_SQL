# 🎓 Student Event Registration System

A full-stack NoSQL mini project. Students browse college events and register for them; admins create, edit and delete events, view registrations, and see live statistics built with MongoDB aggregation pipelines.

**Stack:** Next.js (App Router, JavaScript) · Next.js Route Handlers as the backend · MongoDB Atlas (official `mongodb` driver) · Tailwind CSS · Recharts · deployed as one Vercel project.

The only configuration is **one environment variable: `MONGODB_URI`**.

---

## Features

- Event list with live search (title / description / venue) and category filter
- Event details page with seats-left progress bar and a validated registration form
- Duplicate USN for the same event is rejected (unique compound index)
- Registration is rejected once an event reaches capacity
- Admin dashboard: add / edit / delete events, stats cards, bar charts
- Per-event registrations page with cancel option
- "Seed sample data" button to load 5 demo events + registrations
- Loading states, success/error messages, client + server validation
- UI built from the tokens in `DESIGN.md`: deep-teal hero bands, green pill buttons, 12px cards, coloured category tags

## Folder structure

```
.
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.js              GET (list, ?category= ?search=), POST
│   │   │   └── [id]/route.js         GET (with count), PUT, DELETE
│   │   ├── registrations/
│   │   │   ├── route.js              GET ?eventId=, POST
│   │   │   └── [id]/route.js         DELETE (cancel)
│   │   ├── stats/route.js            GET (aggregation pipelines)
│   │   └── seed/route.js             POST (sample data)
│   ├── admin/
│   │   ├── page.js                   Admin dashboard
│   │   └── events/[id]/page.js       Registrations for one event
│   ├── events/[id]/page.js           Event details + registration form
│   ├── page.js                       Home: event cards, search, filter
│   ├── layout.js                     Root layout + navbar
│   └── globals.css                   Design tokens (from DESIGN.md) + component classes
├── components/
│   ├── Alert.js                      Success / error message box
│   ├── CategoryTag.js                Coloured category label
│   ├── EventForm.js                  Add / edit event form (modal dialog)
│   └── PageHeader.js                 Dark-teal hero band for page headers
├── lib/
│   ├── mongodb.js                    Cached MongoClient (serverless-safe)
│   ├── validators.js                 Server-side input validation
│   ├── validators.test.js            Unit tests (npm test)
│   ├── constants.js                  Categories, departments, USN pattern
│   ├── http.js                       JSON error helpers for API routes
│   └── api.js                        Client-side fetch helper + date format
├── DESIGN.md                         Visual design spec the UI follows
├── .env.example
├── jsconfig.json                     "@/..." import alias
├── postcss.config.mjs                Tailwind v4 PostCSS plugin
└── package.json
```

## MongoDB schema

Database name: **`event_registration`** (created automatically on first write).

### `events`

| Field         | Type     | Notes                                                    |
|---------------|----------|----------------------------------------------------------|
| `_id`         | ObjectId | auto                                                     |
| `title`       | String   | 3–100 chars                                              |
| `description` | String   | required                                                 |
| `date`        | Date     | event date & time                                        |
| `venue`       | String   | required                                                 |
| `category`    | String   | Technical / Cultural / Sports / Workshop / Seminar       |
| `capacity`    | Number   | integer 1–10000                                          |
| `createdAt`   | Date     | set on insert                                            |

### `registrations`

| Field          | Type     | Notes                                       |
|----------------|----------|---------------------------------------------|
| `_id`          | ObjectId | auto                                        |
| `eventId`      | ObjectId | reference to `events._id`                   |
| `studentName`  | String   | required                                    |
| `usn`          | String   | uppercase, e.g. `1RV21CS001`                |
| `email`        | String   | lowercase, valid email                      |
| `department`   | String   | CSE / ISE / ECE / EEE / ME / CV / AIML      |
| `registeredAt` | Date     | set on insert                               |

**Index:** `{ eventId: 1, usn: 1 }` **unique** — created automatically by `lib/mongodb.js` on first connection; this is what blocks duplicate registrations.

Example documents:

```json
// events
{ "_id": ObjectId("..."), "title": "Intro to MongoDB Workshop", "description": "Hands-on CRUD and aggregation",
  "date": ISODate("2026-11-06T08:30:00Z"), "venue": "CSE Lab 3", "category": "Workshop",
  "capacity": 40, "createdAt": ISODate("2026-10-27T10:00:00Z") }

// registrations
{ "_id": ObjectId("..."), "eventId": ObjectId("..."), "studentName": "Ananya Rao", "usn": "1RV22CS014",
  "email": "ananya.1rv22cs014@college.edu", "department": "CSE", "registeredAt": ISODate("2026-10-27T10:05:00Z") }
```

## API routes

| Method | Route                              | Description                                                         |
|--------|------------------------------------|---------------------------------------------------------------------|
| GET    | `/api/events`                      | List events. Optional `?category=Technical` and `?search=hack`      |
| POST   | `/api/events`                      | Create event                                                        |
| GET    | `/api/events/[id]`                 | One event + `registrationCount` + `seatsLeft`                       |
| PUT    | `/api/events/[id]`                 | Update event (capacity can't go below current registrations)        |
| DELETE | `/api/events/[id]`                 | Delete event **and** its registrations                              |
| GET    | `/api/registrations?eventId=`      | List registrations for an event                                     |
| POST   | `/api/registrations`               | Register (409 if duplicate USN for the event, 409 if event is full) |
| DELETE | `/api/registrations/[id]`          | Cancel a registration                                               |
| GET    | `/api/stats`                       | Totals, registrations per event (`$lookup`), per department (`$group`) |
| POST   | `/api/seed`                        | Insert 5 sample events + 11 registrations                           |

Errors are returned as `{ "error": "message" }` with an appropriate status (400, 404, 409, 500).

Example request:

```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"eventId":"<event id>","studentName":"Asha","usn":"1RV21CS001","email":"asha@college.edu","department":"CSE"}'
```

### Aggregation pipelines used in `/api/stats`

```js
// registrations per event
db.events.aggregate([
  { $lookup: { from: "registrations", localField: "_id", foreignField: "eventId", as: "regs" } },
  { $project: { title: 1, capacity: 1, registrations: { $size: "$regs" } } },
  { $sort: { registrations: -1, title: 1 } }
])

// registrations per department
db.registrations.aggregate([
  { $group: { _id: "$department", registrations: { $sum: 1 } } },
  { $project: { _id: 0, department: "$_id", registrations: 1 } },
  { $sort: { registrations: -1 } }
])
```

---

## Run locally

Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local     # then paste your MongoDB URI into .env.local
npm run dev
```

Open http://localhost:3000 → go to **Admin** → click **Seed sample data**.

Run the validation unit tests with `npm test`.

## Deployment: MongoDB Atlas + Vercel

### 1. Create the MongoDB Atlas database

1. Sign up / log in at https://www.mongodb.com/cloud/atlas.
2. **Create** a cluster → choose the free **M0** tier → pick a region close to you → Create.
3. **Database Access** → *Add New Database User* → username + password (auto-generate is fine, save it) → role *Read and write to any database*.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`). Vercel functions don't have fixed IPs, so this is required.
5. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   Replace `<user>` and `<password>` with the user from step 3 (URL-encode special characters in the password, e.g. `@` → `%40`).

You don't need to create collections — they are created on the first insert.

### 2. Push the code to GitHub

```bash
git init
git add .
git commit -m "Student Event Registration System"
git branch -M main
git remote add origin https://github.com/<your-username>/student-event-registration.git
git push -u origin main
```

`.env.local` is git-ignored, so your password is never committed.

### 3. Deploy on Vercel

1. Log in at https://vercel.com with GitHub → **Add New… → Project** → import the repository.
2. Framework preset: **Next.js** (auto-detected). Leave build settings as default.
3. Expand **Environment Variables** → add:
   - Name: `MONGODB_URI`
   - Value: your Atlas connection string from step 1
4. Click **Deploy**. After ~1 minute you get a URL like `https://student-event-registration.vercel.app`.
5. Open `/admin` on that URL → **Seed sample data** → done.

If you change `MONGODB_URI` later, redeploy (Vercel → Deployments → ⋯ → Redeploy) so it takes effect.

### Troubleshooting

| Symptom                                        | Fix                                                                 |
|------------------------------------------------|---------------------------------------------------------------------|
| `MONGODB_URI environment variable is not set`  | Add it to `.env.local` (local) or Vercel project settings, then restart/redeploy |
| `bad auth : authentication failed`             | Wrong DB user/password in the URI, or password not URL-encoded      |
| Connection timeout / `ENOTFOUND`               | Add `0.0.0.0/0` in Atlas *Network Access*                           |

## How the connection caching works

`lib/mongodb.js` stores the connection promise on `global`. On Vercel, a warm serverless function reuses the same process between requests, so every request after the first reuses the existing `MongoClient` instead of opening a new connection. In development it also survives Next.js hot reloads.
