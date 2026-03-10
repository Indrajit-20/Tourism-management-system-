Tourism management system

This repository contains a full-stack **Tourism Management System** built with a Node.js/Express backend and a React/Vite frontend. It allows browsing tour packages, booking tours and bus tickets, and administrating various resources such as bookings, routes, staff, and reports.

## Features

- **Packages**: Browse, view details, and book tour packages.
- **Bus Routes**: Manage routes and book bus tickets with seat selection.
- **Bookings**:
  - Tour package booking with passenger information and Razorpay payments.
  - Admin interfaces for reviewing/updating booking statuses.
- **Users**: Customer authentication (JWT) and admin functionality.
- **Reports**: Admin dashboard with booking statistics and charts, PDF export.
- **CRUD**: Admin can create/read/update/delete packages, buses, routes, customers, staff, etc.
- **Simple UI** using Bootstrap and Vite for fast development.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Razorpay
- **Frontend**: React, Vite, Axios, Bootstrap, Chart.js (via react-chartjs-2)

## Project Structure

```
backend/
	controllers/
	models/
	routes/
	middleware/
	config/db.js
	index.js

frontend/
	public/
	src/
		components/
		pages/
		App.jsx
		main.jsx
```

## Setup

### Backend

1. `cd backend`
2. `npm install`
3. Create `.env`:
   ```
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/tourism
   JWT_SECRET=your_secret
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   ```
4. `npm run dev` (or `npm start`)

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open the URL shown (usually http://localhost:5173)

## API Endpoints (sample)

- `POST /api/auth/register` – register customer
- `POST /api/auth/login` – login, returns JWT
- `POST /api/bookings/book` – create tour booking
- `GET /api/bookings/all` – admin: list tour bookings
- `PUT /api/bookings/update-status/:id` – admin: change status
- `POST /api/bus-bookings/book` – book a bus ticket
- `GET /api/bus-bookings/all` – admin: list bus bookings
- `GET /api/packages/` – list packages
- `POST /api/packages/` – admin: create package
  (see `backend/routes` for full list)

## Usage

- Customers sign up/login, browse packages, and make bookings.
- Admins login via provided admin user, manage packages, routes, staff, bookings, and view reports.

## Notes

- Database must be running (MongoDB).
- Frontend points to `http://localhost:4000` for API calls.
