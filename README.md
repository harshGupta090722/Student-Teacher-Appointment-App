# UnQueue - College Appointment Backend System

UnQueue is a highly optimized full-stack scheduling API developed in Node.js, Express, and MongoDB. It allows professors to manage their availability and enables students to seamlessly book 1-on-1 appointments.

The architecture strictly follows a **Virtual Slot Overlay** pattern—availability is dynamically calculated in-memory for Monday-Friday (12 PM–3 PM) and only merged with physical database records on exceptions. This drastically reduces database pollution while enforcing strict governance on student bookings.

## Key Features

*   **Role-Based Access Control:** Secure JWT authentication for both `student` and `professor` roles.
*   **Virtual Slot Architecture:** Slots are calculated on-the-fly and only consume MongoDB storage when actively interacted with (upserted).
*   **Time-Zone Agnostic:** Completely stripped of confusing universal timezone offsets. Dates are securely managed as simple `"YYYY-MM-DD"` strings native to the local server.
*   **Strict Booking Governance:**
    *   Maximum 1 hour slots allowed per request.
    *   Maximum 2 appointments allowed per week for any student.
    *   Maximum 1 appointment allowed per day for any student.
*   **Soft Deletion:** Safely manages active history by converting cancelled appointments into safely blocked tracking records instead of blindly wiping data.

## Technology Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB via Mongoose
*   **Authentication:** JWT (JSON Web Tokens) via HTTP-Only Cookies
*   **Validation:** Zod
*   **Security:** Bcrypt (Password Hashing)

## Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd UnQueue/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend/` directory referencing your local configurations:
   ```env
   PORT=4002
   MONGO_URI=mongodb://127.0.0.1:27017/unqueue_db
   JWT_SECRET=your_super_secret_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The backend should now be actively running cleanly on `http://localhost:4002`.

##  API Structure Overview

### 1. User & Authentication routes (`/api/v1/user`)
- `POST /signup` - Open endpoint to register `professor` or `student`.
- `POST /login`  - Sets your secure JWT cookie session.
- `GET /logout`  - Clears the active cookie session.

### 2. Professor Routes (`/api/v1/professor`)
*Requires Active JWT Cookie & `role: "professor"`*
- `GET /availability/me` - Displays 7-day overlaid schedule.
- `POST /availability/update` - Mark a time block as available or blocked.
- `DELETE /availability/:id` - Factory resets an exception back to default.
- `GET /appointments` - List all active scheduled appointments.
- `PATCH /appointments/:id/cancel` - Safely cancels a student appointment.

### 3. Student Routes (`/api/v1/student`)
*Requires Active JWT Cookie & `role: "student"`*
- `GET /slots/:professorId` - Browse a professor's open weekly window.
- `POST /appointments` - Secure a booking (executes max 2/week governance).
- `GET /appointment/me` - Lists your actively booked schedule.
- `PATCH /appointments/:id/cancel` - Cancel your appointment returning it to Professor availability.

## Core Architecture Flow

Because standard Javascript `Date` objects are notorious for globally mutating shifts across time zones, the UnQueue backend relies on a custom `getVirtualSlots` string generator that dynamically formats slots to native `YYYY-MM-DD`. If a professor interacts with a 12PM box on the UI, the backend Upserts the override strictly bound to that string constraint. Any Malicious attempts to bypass UI boundaries are actively blocked on both Student & Professor controllers utilizing an allowed array validation gatekeeper.
