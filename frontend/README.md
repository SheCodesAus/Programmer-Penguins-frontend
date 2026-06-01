# JobTracker Frontend

JobTracker is a full-stack job application tracking app that helps users manage their job search in one place. Users can track job applications, organize them on a Kanban dashboard, save contacts and notes, create tasks and events, view deadlines in a calendar, and store useful career resources.

This repository contains the React frontend for the JobTracker application.

## Features

- User authentication with login, signup, password reset, and Google login support
- Protected dashboard for logged-in users
- Kanban board for tracking job applications by status
- Job application detail page with related contacts, notes, tasks, and events
- Job link extraction to help auto-fill new job application fields
- Calendar page with month, week, and day views
- Task and event creation from the calendar
- Task completion and reopening
- Tasks agenda page for open and recently completed tasks
- Contacts page for application-related contacts
- Resources page for saving article links and ChatGPT answers
- Archive and trash pages for managing removed applications
- User profile page and account settings
- Admin panel link for superusers

## Tech Stack

### Frontend

- React 19
- Vite
- JavaScript / JSX
- CSS
- React Router DOM
- Lucide React
- React Icons
- React OAuth Google
- React Confetti
- ESLint

### Backend API

The frontend connects to a Django REST API. The deployed backend URL is configured through `VITE_API_BASE_URL`.

Backend technologies used in the wider project include:

- Django
- Django REST Framework
- dj-rest-auth
- django-allauth
- django-cors-headers
- dj-database-url
- Heroku deployment

## Project Structure

```text
frontend/
  src/
    api/                  API helper functions
    assets/               Images and static assets
    components/           Reusable UI components
    hooks/                Custom React hooks
    pages/                Main application pages
    utils/                Shared utility functions
    main.jsx              Router setup and app entry point
  .env                    Frontend environment variables
  package.json            npm scripts and dependencies
  vite.config.js          Vite configuration
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Programmer-Penguins-frontend/frontend
```

Make sure you are inside the `frontend` folder before running npm commands.

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env` file inside the `frontend` folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

For the deployed backend, use:

```env
VITE_API_BASE_URL=heroku-link
```

### 4. Run the development server

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev
```

Starts the local Vite development server.

```bash
npm run build
```

Builds the app for production.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint checks.

## Main Routes

- `/` - home page
- `/login` - login page
- `/signup` - signup page
- `/dashboard` - job application Kanban dashboard
- `/job-application/:id` - job application details
- `/calendar` - calendar with tasks and events
- `/tasks` - tasks agenda
- `/contacts` - contacts
- `/resources` - saved resources
- `/archive` - archived applications
- `/trash` - deleted applications
- `/profile` - user profile
- `/forgot-password` - password reset request
- `/reset-password/:uid/:token` - password reset form

## API Configuration

The frontend communicates with the backend using API helper files in `src/api/`.

Important environment variable:

```env
VITE_API_BASE_URL=<backend-api-url>
```

Examples:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Notes

- The backend must be running locally or deployed for authenticated features to work.
- If `npm run dev` gives a `package.json` error, check that the terminal is inside the `frontend` directory.
- Google login requires a valid `VITE_GOOGLE_CLIENT_ID`.

## Team

Programmer Penguins - She Codes group project.
