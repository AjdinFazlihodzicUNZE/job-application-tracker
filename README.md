# Job Application Tracker

A small backend API that keeps track of the jobs and internships you applied to. Built as my FlyRank Backend AI Engineering capstone ("Your 10x Solution").

## The problem

When I apply to many internships and junior jobs, I do not keep a proper record. I mostly depend on the emails that come back, so I often do not know when I sent an application or who I sent it to. Sometimes I even apply twice for the same job.

My 10x claim: checking if I already applied, and what needs a follow-up today, should take about 10 seconds instead of several minutes of searching through emails.

## What it does

1. Register and login
2. Add, list, change and delete my applications (company, position, date sent). Adding the same company and position twice is refused.
3. Every application has a status: `applied`, `interview`, `rejected` or `offer`
4. A daily job flags applications that wait for an answer for 7 days or more
5. A weekly PDF summary (download it, or the server saves it every Monday)

## Concepts used (5, no swaps)

| # | Concept | Where it lives in the code |
|---|---------|----------------------------|
| 1 | API endpoints | `server.js` (routes), `validation.js` and the Zod schemas in `server.js` and `auth.js` |
| 2 | Database | `db.js` (SQLite file `tracker.db`, tables `users` and `applications`) |
| 3 | Authentication | `auth.js` (register, login, bcrypt, JWT in an HttpOnly cookie) and `requireAuth.js` (the guard for protected routes) |
| 4 | Cron jobs | `jobs.js` (daily stale check, weekly reports), started from `server.js` |
| 5 | Reporting (PDF) | `report.js` (PDFKit), route `GET /reports/weekly` in `server.js`, files saved in `reports/` by the weekly job |

## How to run it

You need Node.js 20.6 or newer (I used Node 24) and npm.

```
npm install
npm start
```

That is all. On the first start, `setup.js` creates a `.env` file with a random `JWT_SECRET`, then the server starts on http://localhost:3000. If you already have a `.env`, it is not touched.

To get demo data (optional, recommended):

```
npm run seed
```

This creates a demo account and six fake applications. Login: `demo@example.com` / `demo-password-123`. You can run it again any time, it resets the demo account's applications.

## 5-minute demo path

Start the server in one terminal (`npm start`). Use a second terminal for the commands below. Run `npm run seed` once before you start.

1. Check that the server is alive:
```
curl http://localhost:3000/health
```
You should see `{"status":"ok"}`.

2. Try a protected route without logging in. You should get `401`:
```
curl -i http://localhost:3000/applications
```

3. Login as the demo user. The cookie is saved in `cookies.txt`:
```
curl -c cookies.txt -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo-password-123"}'
```

4. See the six demo applications:
```
curl -b cookies.txt http://localhost:3000/applications
```

5. See what needs a follow-up. You should see Northwind Software and Contoso Labs:
```
curl -b cookies.txt http://localhost:3000/applications/followups
```

6. Try to add an application that already exists. You should get `409`:
```
curl -i -b cookies.txt -X POST http://localhost:3000/applications -H "Content-Type: application/json" -d '{"company":"Northwind Software","position":"Backend Intern","date_sent":"2026-10-18"}'
```

7. Northwind answered, so change its status (the id may differ, check step 4). The follow-up flag is removed:
```
curl -b cookies.txt -X PATCH http://localhost:3000/applications/1 -H "Content-Type: application/json" -d '{"status":"interview"}'
curl -b cookies.txt http://localhost:3000/applications/followups
```

8. Download the weekly PDF and open it:
```
curl -b cookies.txt -o weekly-report.pdf http://localhost:3000/reports/weekly
```

## API

| Method and path | Login needed | What it does |
|-----------------|--------------|--------------|
| `GET /health` | no | Shows that the server is running |
| `POST /register` | no | Creates a user (`email`, `password` with 8 to 72 characters) |
| `POST /login` | no | Checks the password and sets the `token` cookie (valid for 1 hour) |
| `GET /applications` | yes | Lists my applications |
| `POST /applications` | yes | Adds one (`company`, `position`, `date_sent` as `2026-10-18`). Returns `409` if it already exists |
| `GET /applications/followups` | yes | Lists the applications flagged for follow-up |
| `PATCH /applications/:id` | yes | Changes the status and removes the follow-up flag |
| `DELETE /applications/:id` | yes | Deletes one |
| `GET /reports/weekly` | yes | Downloads my weekly summary as a PDF |

Everyone only sees their own applications. Asking for someone else's id gives `404`.

## Scheduled jobs

Times are in the Europe/Sarajevo time zone. The jobs only run while the server is running.

- Every day at 08:00: flag applications with status `applied` or `interview` that had no change for 7 days
- Every Monday at 08:05: save a PDF for every user in `reports/`

You can also run them by hand:

```
node -e "require('./jobs').runStaleCheck()"
node -e "require('./jobs').runWeeklyReports()"
```

## Project files

```
server.js        the server, middleware and the application routes
auth.js          register and login
requireAuth.js   checks the cookie before protected routes
validation.js    small helper for readable validation errors
db.js            opens the database and creates the tables
jobs.js          the two scheduled jobs
report.js        builds the weekly PDF
setup.js         creates .env on the first start
seed.js          demo account and demo data
docs/            my one-pager plan
```

## Settings

- `JWT_SECRET` in `.env`: the key that signs login tokens. Created automatically on the first start. Never commit it. `.env.example` shows the format.
- The port (3000) and the 7 days for follow-ups are written in the code (`server.js` and `jobs.js`).

## If something goes wrong

- `npm install` fails on `better-sqlite3`: use a current Node version (20 or newer). It needs a prebuilt file for your system or a C++ build tool.
- `EADDRINUSE`: port 3000 is already used by another program or another copy of this server.
- `401 Invalid or expired token`: the cookie lasts 1 hour, login again.

## Limits

- The PDF uses PDFKit's standard font, so letters like č, ć and đ do not show correctly. Use English names in demo data.
- No frontend, no real users, no deployment. It is a learning project and not ready for production.

## Not building (non-goals)

I will not build a nice frontend, scrape job sites, or apply to jobs automatically.

## Future ideas

- Send the weekly summary by email as well
- Use an LLM to fill company and position from the text of a job ad
- Automated tests for the scary cases
- Run everything with `docker compose up`
- Deploy on a free hosting tier
