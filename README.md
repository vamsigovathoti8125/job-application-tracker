# Job Application Tracker

A responsive frontend application for organizing a job search. It supports the complete application lifecycle: create, read, update, and delete.

## Features

- Add applications with company, role, location, date, status, URL, and notes
- Edit and delete existing applications without a page reload
- Search by company, job role, or location
- Filter by Applied, Interview, Offer, Rejected, or Withdrawn
- Dynamic dashboard statistics
- Persistent browser storage with `localStorage`
- CSV export for a portable backup
- Responsive layout for desktop, tablet, and mobile
- Client-side form validation, including URL validation

## Run locally

No build step is required. Open `index.html` in a browser, or use VS Code's Live Server extension for a local development server.

## Project structure

```text
job-application-tracker/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How it works

The browser loads the saved application array from `localStorage`. Every form submission validates the input, updates the array, saves it back to storage, and re-renders the list. Search and status filtering operate on the current array, while dashboard counts are recalculated from the full collection.

Each application is represented as an object:

```js
{
  id: "unique-id",
  company: "Google",
  role: "Frontend Developer",
  location: "Bangalore",
  date: "2026-09-18",
  status: "Applied",
  url: "https://careers.google.com/",
  notes: "Applied through careers page"
}
```

## Interview talking points

- **DOM manipulation:** JavaScript generates application cards and updates dashboard counts.
- **Event handling:** Form submission, search input, filter changes, edit, delete, export, and dialog controls are event-driven.
- **CRUD:** Create adds an object, read renders the array, update maps over an existing record, and delete filters a record out.
- **Persistence:** `JSON.stringify` stores the application array and `JSON.parse` restores it on page load.
- **Validation:** Required fields and URL protocol are validated before data enters the application array.
- **Responsive design:** CSS grid, flexible controls, and mobile media queries adapt the interface to smaller screens.

## Debugging checklist

Use browser DevTools to inspect console errors, inspect generated cards in the Elements panel, and review the `jobTrackerApplications` entry under Application > Local Storage.
