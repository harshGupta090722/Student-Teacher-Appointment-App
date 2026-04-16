import jwt from "jsonwebtoken";
import config from "../config.js";
import { User } from "../models/user.model.js";

export const protectRouter = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ errors: "You are not logged in!" });
        }

        const decoded = jwt.verify(token, config.jwtuserPassword);

        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({ errors: "The user belonging to this token does no longer exist." });
        }

        req.user = currentUser;
        next();
    } catch (error) {
        console.log("Auth middleware error", error);
        return res.status(401).json({ errors: "Invalid or expired token" });
    }
};

export const restrictTo = (...roles) => {

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ errors: "You do not have permission to perform this action" });
        }
        next();
    };
};