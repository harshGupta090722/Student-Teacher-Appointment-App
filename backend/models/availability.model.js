import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["available", "booked", "blocked"],
        default: "available",
    }
});

export const Availability = mongoose.model("Availability", availabilitySchema);