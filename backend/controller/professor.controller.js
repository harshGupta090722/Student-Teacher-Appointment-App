import { Availability } from "../models/availability.model.js";
import { Appointment } from "../models/Appointment.model.js";
import { getVirtualSlots } from "../utils/slotGenerator.js";

const mergeVirtualWithDB = (virtualSlots, dbSlots) => {
    return virtualSlots.map(vSlot => {
        const matchingDbSlot = dbSlots.find(dSlot =>
            dSlot.date === vSlot.date &&
            dSlot.startTime === vSlot.startTime
        );
        return matchingDbSlot || vSlot;
    });
};

export const viewOwnSlots = async (req, res) => {

    console.log("Hitting the route that shows the availablity for the professor for next 7 days");

    try {
        const today = new Date();
        const upcomingDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            upcomingDays.push(`${year}-${month}-${day}`);
        }

        const virtualSlots = getVirtualSlots(req.user._id, 7);

        const dbSlots = await Availability.find({
            professorId: req.user._id,
            date: { $in: upcomingDays }
        });

        const slots = mergeVirtualWithDB(virtualSlots, dbSlots);

        res.status(200).json({ message: "Slots retrieved", slots });
    } catch (error) {
        console.error("Error fetching slots", error);
        res.status(500).json({ errors: "Error fetching availability slots" });
    }
};

export const viewAllSlots = async (req, res) => {
    try {
        const slots = await Availability.find({ professorId: req.user._id }).sort({ date: 1, startTime: 1 });
        res.status(200).json({ message: "All slots retrieved", slots });
    } catch (error) {
        console.error("Error fetching all slots", error);
        res.status(500).json({ errors: "Error fetching all slots" });
    }
};

export const updateSlot = async (req, res) => {
    try {
        const { date, startTime, endTime, status } = req.body;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ errors: "Date, startTime, and endTime are required" });
        }

        if (!status || !["available", "booked", "blocked"].includes(status)) {
            return res.status(400).json({ errors: "Valid status required" });
        }

        const allowedSlots = [
            { start: "12:00 PM", end: "01:00 PM" },
            { start: "01:00 PM", end: "02:00 PM" },
            { start: "02:00 PM", end: "03:00 PM" }
        ];

        const isValidSlot = allowedSlots.some(
            s => s.start === startTime && s.end === endTime
        );
        if (!isValidSlot) {
            return res.status(400).json({ errors: "Slot must be exactly one of the approved 12 PM - 3 PM blocks." });
        }

        const [year, month, day] = date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);

        const dayOfWeek = slotDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({ errors: "Slots can only be updated for Monday through Friday." });
        }

        const existingSlot = await Availability.findOne({ professorId: req.user._id, date, startTime, endTime });
        if (existingSlot && existingSlot.status === "booked") {
            return res.status(400).json({ errors: "Cannot manually modify a slot that is actively booked by a student. Please use the cancel appointment route." });
        }

        let slot = await Availability.findOneAndUpdate(
            { professorId: req.user._id, date, startTime, endTime },
            { status },
            { returnDocument: "after" }
        );

        if (!slot) {
            slot = new Availability({
                professorId: req.user._id,
                date,
                startTime,
                endTime,
                status
            });
            await slot.save();
        }

        res.status(200).json({ message: "Slot updated", slot });
    } catch (error) {
        console.error("Error updating slot", error);
        res.status(500).json({ errors: "Error updating slot status" });
    }
};

export const deleteSlot = async (req, res) => {
    try {

        const { id } = req.params;

        const existingSlot = await Availability.findOne({ _id: id, professorId: req.user._id });

        if (!existingSlot) {
            return res.status(404).json({ errors: "Slot not found or unauthorized" });
        }

        if (existingSlot.status === "booked") {
            return res.status(400).json({ errors: "Cannot delete a slot that is actively booked by a student. Please use the cancel appointment route first." });
        }

        await Availability.findByIdAndDelete(id);

        res.status(200).json({ message: "Slot deleted successfully" });
    } catch (error) {
        console.error("Error deleting slot", error);
        res.status(500).json({ errors: "Error deleting slot" });
    }
};

export const viewAllBookings = async (req, res) => {
    try {
        const today = new Date();
        const upcomingDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            upcomingDays.push(`${year}-${month}-${day}`);
        }

        const bookings = await Appointment.find({
            professorId: req.user._id,
            status: "booked"
        })
            .populate({
                path: 'availabilityId',
                match: { date: { $in: upcomingDays } }
            })
            .populate('studentId', 'firstName lastName email');

        const filteredBookings = bookings.filter(b => b.availabilityId != null);

        res.status(200).json({ message: "Bookings retrieved", bookings: filteredBookings });
    } catch (error) {
        console.error("Error fetching bookings", error);
        res.status(500).json({ errors: "Error fetching bookings" });
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, professorId: req.user._id, status: "booked" },
            { status: "cancelled" },
            { returnDocument: "after" }
        );

        if (!appointment) {
            return res.status(404).json({ errors: "Appointment not found or already cancelled" });
        }

        await Availability.findByIdAndUpdate(appointment.availabilityId, { status: "blocked" });

        res.status(200).json({ message: "Appointment cancelled and slot blocked", appointment });
    } catch (error) {
        console.error("Error cancelling appointment", error);
        res.status(500).json({ errors: "Error cancelling appointment" });
    }
};