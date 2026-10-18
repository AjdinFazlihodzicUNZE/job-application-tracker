# My 10x Solution - one-pager (M1)

## The problem

I apply to many internships and junior jobs, and I do not keep a proper record. I mostly depend on the emails that come back to me. Because of that I often do not know when I sent an application or who I sent it to. Sometimes I even apply twice for the same job.

## Who has this problem

Students and juniors who send many applications at the same time. Me too.

## My 10x claim

Checking if I already applied to a job, and what needs a follow-up today, takes about 10 seconds. Now it takes several minutes of searching through my emails.

(I will time my current way and my new way, so the numbers are real.)

## Core features (5)

1. Register and login
2. Add, edit, delete and list my applications (company, position, date sent). If I add the same company and position again, the API refuses it because it already exists.
3. A status for each application (applied, interview, rejected, offer)
4. A daily check that finds applications with no update for a number of days
5. A weekly PDF summary

## Concepts (5, no swaps)

1. API endpoints: real HTTP API with correct status codes and validation
2. Database: applications and users are saved and survive a restart
3. Authentication: login, and every user sees only their own applications
4. Cron job: the daily check runs on a schedule
5. Reporting: the weekly PDF

## Non-goal

I will not build a nice frontend, scrape job sites, or apply to jobs automatically.
