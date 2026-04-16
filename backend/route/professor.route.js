import express from "express";
import {
    viewOwnSlots,
    updateSlot,
    deleteSlot,
    viewAllSlots,
    viewAllBookings,
    cancelAppointment
} from "../controller/professor.controller.js";
import { protectRouter, restrictTo } from "../middleware/middleware.js";

const router = express.Router();

router.use(protectRouter);
router.use(restrictTo("professor"));

// View final 7-day schedule (virtual databaes  + db added changes after exceptions)
router.get("/availability/me", viewOwnSlots);

// Upsert physical DB exception to mark slot as 'blocked'
router.post("/availability/update", updateSlot);

// deleting already booked slot
router.delete("/availability/:id", deleteSlot);

// View all changes made in virtual database
router.get("/availability/me/all", viewAllSlots);

// Fetch all appointments that are booked
router.get("/appointments", viewAllBookings);

// Cancel a student appointment and block that time slot forever 
router.patch("/appointments/:id/cancel", cancelAppointment);

export default router;