import express from "express";
import mongoose from "mongoose";
import userRouter from "./route/auth.routes.js";
import professorRouter from "./route/professor.route.js";
import studentRouter from "./route/student.route.js";
import config from "./config.js";
import cookieParser from "cookie-parser";

const app = express();
const port = 4002;

try {
    await mongoose.connect(config.mongoUrl);
    console.log("Connected to MongoDB");
} catch (error) {
    console.log(error);
}

app.use(express.json());
app.use(cookieParser());


app.use('/api/v1/user', userRouter);
app.use('/api/v1/professor', professorRouter);
app.use('/api/v1/student', studentRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})