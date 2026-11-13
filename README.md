# CAMP

A project management app for small teams. Set up projects, invite your team with roles, hand out tasks with deadlines, and see who owes what by when.

## Features

- **Projects and teams.** Create projects, invite people by email, and give each member a role: admin, project admin or member.
- **Task board.** To do, In progress and Done lanes, with assignees, deadlines, subtasks and file attachments.
- **Notes.** Shared notes inside each project.
- **Dashboard.** Your open tasks, overdue count, a two-week route of upcoming deadlines, your projects and your workload.
- **My tasks.** Everything assigned to you across all projects, grouped by due date.
- **Calendar.** A month view of task deadlines, with the next seven days and anything overdue.
- **Live updates.** Boards update in real time over Socket.IO, and people removed from a project lose access straight away.
- **Email.** Verification, password reset, invites, assignments, deadline changes and reminders, role changes, removals and password-change notices.
- **Light and dark themes.**

## Tech stack

| Part | Tools |
| --- | --- |
| API | Node.js, Express 5, MongoDB with Mongoose, JWT in httpOnly cookies, express-validator |
| Realtime | Socket.IO |
| Files | Multer and Cloudinary |
| Email | Mailgen templates, sent through the Brevo API or any SMTP server with Nodemailer |
| Web app | React 19, Vite, Tailwind CSS 4, Radix UI, Motion, lucide icons |

## Project structure

```
.
├── src/                 # Express API
│   ├── controllers/     # route handlers and email senders
│   ├── jobs/            # hourly deadline reminders
│   ├── middlewares/     # auth, project roles, uploads, validation
│   ├── models/          # Mongoose models
│   ├── routes/          # /api/v1 routers
│   ├── socket/          # Socket.IO rooms and events
│   └── utils/           # email templates, errors, responses
├── public/              # static files served by the API
└── frontend/            # React app (Vite)
    └── src/
        ├── components/  # layout, board, task panel, shared UI
        ├── lib/         # formatting and data hooks
        └── pages/       # dashboard, projects, my tasks, calendar, auth
```

## Getting started

### Requirements

- Node.js 20 or newer
- A MongoDB database, local or Atlas
- A Cloudinary account for attachments and avatars
- An email sender: a Brevo API key, or SMTP credentials

### 1. Install

```bash
npm install
npm install --prefix frontend
```

### 2. Configure

Create a `.env` file in the project root:

```bash
# Server
PORT=5000
MONGO_URI=mongodb://localhost:27017/camp
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Auth
ACCESS_TOKEN_SECRET=change-me
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_SECRET=change-me-too
REFRESH_TOKEN_EXPIRATION=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email: set BREVO_API_KEY, or the SMTP_* values
BREVO_API_KEY=
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
EMAIL_SENDER_ADDRESS=
EMAIL_SENDER_NAME=CAMP
```

| Variable | What it does |
| --- | --- |
| `CORS_ORIGIN` | Allowed web app origins, comma separated |
| `FRONTEND_URL` | Base URL used for links in emails |
| `NODE_ENV` | `production` makes auth cookies secure |
| `BREVO_API_KEY` | Sends email through the Brevo API instead of SMTP |
| `EMAIL_SENDER_ADDRESS` | The from address; falls back to `SMTP_USER` |
| `APP_NAME` | Product name used in emails, `CAMP` by default |
| `DEADLINE_REMINDERS` | Set to `off` to stop the hourly reminder job |
| `CRON_SECRET` | Turns on `POST /api/v1/reminders/run` for an external scheduler |

The web app needs no configuration in development. Vite proxies `/api` to `http://localhost:5000`. To point it at another API, set `VITE_API_URL` in `frontend/.env`.

### 3. Run

In two terminals:

```bash
npm run dev                    # API on http://localhost:5000
npm run dev --prefix frontend  # web app on http://localhost:5173
```

To check your email settings, send yourself a test message:

```bash
npm run mail:test -- you@example.com
```

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| root | `npm run dev` | API with nodemon |
| root | `npm start` | API with node |
| root | `npm run mail:test` | Sends a test email |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build into `frontend/dist` |
| `frontend/` | `npm run lint` | ESLint |

## API

All routes live under `/api/v1`. Responses are shaped as `{ statusCode, message, data, success }`.

| Area | Routes |
| --- | --- |
| Auth | under `/auth`: `/register`, `/login`, `/logout`, `/refresh-token`, `/current-user`, `/change-password`, `/verify-email/:token`, `/resend-email-verification`, `/forgot-password`, `/reset-password` |
| Projects | `/project`, `/project/:projectId` |
| Members | `/project/:projectId/members`, `/project/:projectId/members/:userId` |
| Project invites | `/project/:projectId/invites`, `.../invites/:inviteId`, `.../invites/:inviteId/resend` |
| Your invites | `/invites`, `/invites/id/:inviteId/accept`, `/invites/id/:inviteId/decline`, `/invites/:token`, `/invites/:token/accept`, `/invites/:token/decline` |
| Tasks | `/task/:projectId`, `/task/:projectId/tasks/:taskId`, `/task/:projectId/users/:userId` |
| Subtasks | `/task/:projectId/tasks/:taskId/subtasks`, `.../subtasks/:subTaskId`, `.../subtasks/:subTaskId/status` |
| Notes | `/notes/:projectId`, `/notes/:projectId/n/:noteId` |
| Users | `/users/search` |
| Reminders | `/reminders/run` |
| Health | `/healthcheck` |

### Roles

Each person has a role per project:

| Role | Can |
| --- | --- |
| Admin | Everything: edit or delete the project, manage members and invites, and write notes |
| Project admin | Create, edit and delete tasks and subtasks |
| Member | View the project, its tasks and notes, and tick off subtasks |

## Deadline reminders

While the API is running, it checks for deadlines once an hour. Each assignee gets one email listing their open tasks and subtasks due today or tomorrow, and a deadline is only reminded once.

Some hosts put the server to sleep between requests. On those, set `DEADLINE_REMINDERS=off` and a `CRON_SECRET`. Then have a scheduler call:

```bash
curl -X POST https://your-api/api/v1/reminders/run -H "x-cron-secret: $CRON_SECRET"
```

## Deployment

The web app is set up for Vercel. `frontend/vercel.json` rewrites `/api/*` to the API and serves `index.html` for every other route, so auth cookies stay same-origin. Vercel can't forward WebSockets, so Socket.IO falls back to long polling there.

The API runs on any Node host, such as Render. Set the same environment variables there, with `NODE_ENV=production` and `CORS_ORIGIN` and `FRONTEND_URL` set to the web app's address.

## License

ISC
