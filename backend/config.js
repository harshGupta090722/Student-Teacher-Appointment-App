import dotenv from "dotenv";
dotenv.config();

const config = {
    mongoUrl: process.env.MONGO_URL,
    jwtuserPassword:process.env.JWT_USER_PASSWORD,
};

export default config;