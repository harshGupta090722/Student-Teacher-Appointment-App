import express from "express";
import { bookAppointment, cancelAppointment, getMyBookings, viewAvailableSlots } from "../controller/student.controller.js";
import { protectRouter, restrictTo } from "../middleware/middleware.js";

const router = express.Router();

router.use(protectRouter);
router.use(restrictTo("student"));

// View available slot between 12PM-3PM Mon-Fri for a given professor
router.get("/slots/:professorId", viewAvailableSlots);

// Book an appointment with conditions (each slot can be of max 1 hour, max 1 slot in day, max 2 slots in a week)
router.post("/appointments", bookAppointment);

// View all upcoming and past bookings for the logged-in student
router.get("/appointment/me", getMyBookings);

// Cancel a booked appointment 
router.patch("/appointments/:id/cancel", cancelAppointment);

export default router;