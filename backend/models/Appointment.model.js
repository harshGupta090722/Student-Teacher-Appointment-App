import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    availabilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Availability",
        required: true
    },
    status: {
        type: String,
        enum: ["booked", "cancelled"],
        default: "booked",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export const Appointment = mongoose.model("Appointment", AppointmentSchema);