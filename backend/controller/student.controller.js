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

export const viewAvailableSlots = async (req, res) => {
    try {
        const { professorId } = req.params;

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

        const virtualSlots = getVirtualSlots(professorId, 7);

        const dbSlots = await Availability.find({
            professorId,
            date: { $in: upcomingDays }
        });

        const combinedSlots = mergeVirtualWithDB(virtualSlots, dbSlots);
        const availableSlots = combinedSlots.filter(s => s.status === "available");

        res.status(200).json({ message: "Available slots retrieved", slots: availableSlots });
    } catch (error) {
        console.error("Error viewing available slots", error);
        res.status(500).json({ errors: "Error viewing available slots" });
    }
};

export const bookAppointment = async (req, res) => {
    try {
        const { professorId, date, startTime, endTime } = req.body;
        const studentId = req.user._id;

        if (!professorId || !date || !startTime || !endTime) {
            return res.status(400).json({ errors: "Missing required slot parameters" });
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
            return res.status(400).json({ errors: "Slot must be exactly one of the approved 12 PM - 3 PM window blocks." });
        }

        const [year, month, day] = date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);

        const dayOfWeek = slotDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({ errors: "Slots can only be booked for Monday through Friday." });
        }

        let availability = await Availability.findOne({
            professorId,
            date,
            startTime,
            endTime
        });

        if (availability && availability.status !== "available") {
            return res.status(400).json({ errors: "Slot is not available" });
        }

        const today = new Date();
        const upcomingDays = [];
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            upcomingDays.push(`${y}-${m}-${dy}`);
        }

        const activeUpcomingBookings = await Appointment.find({
            studentId,
            status: "booked"
        }).populate({
            path: 'availabilityId',
            match: {
                date: { $in: upcomingDays }
            }
        });

        const validUpcomingBookings = activeUpcomingBookings.filter(b => b.availabilityId != null);

        if (validUpcomingBookings.length >= 2) {
            return res.status(400).json({ errors: "You have reached the maximum of 2 upcoming slots for the week." });
        }

        const requestedDateCode = date;
        const hasBookingOnSameDay = validUpcomingBookings.some(booking => {
            return booking.availabilityId.date === requestedDateCode;
        });

        if (hasBookingOnSameDay) {
            return res.status(400).json({ errors: "You can only book maximum 1 hour on a single day." });
        }

        if (!availability) {
            availability = new Availability({
                professorId,
                date,
                startTime,
                endTime,
                status: "booked"
            });
        } else {
            availability.status = "booked";
        }
        
        await availability.save();

        const newAppointment = new Appointment({
            professorId,
            studentId,
            availabilityId: availability._id,
            status: "booked"
        });

        await newAppointment.save();

        res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ errors: "This slot is already booked" });
        }
        console.error("Error booking appointment", error);
        res.status(500).json({ errors: "Error booking appointment" });
    }
}

export const getMyBookings = async (req, res) => {
    try {
        const appointments = await Appointment.find({ studentId: req.user._id })
            .populate('professorId', 'firstName lastName email')
            .populate('availabilityId', 'date startTime endTime status')
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "My bookings retrieved", appointments });
    } catch (error) {
        console.error("Error fetching my bookings", error);
        res.status(500).json({ errors: "Error fetching my bookings" });
    }
}

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findOneAndUpdate(
            { _id: id, studentId: req.user._id, status: "booked" },
            { status: "cancelled" },
            { returnDocument: "after" }
        );

        if (!appointment) {
            return res.status(404).json({ errors: "Appointment not found, unauthorized, or already cancelled" });
        }

        await Availability.findByIdAndUpdate(appointment.availabilityId, { status: "available" });

        res.status(200).json({ message: "Appointment cancelled successfully", appointment });
    } catch (error) {
        console.error("Error cancelling appointment", error);
        res.status(500).json({ errors: "Error cancelling appointment" });
    }
}