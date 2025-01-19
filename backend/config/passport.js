import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User.js";

export const initializePassport = (passport) => {
    // Local Strategy
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                // Find user by username
                const user = await User.findOne({ username });
                if (!user) {
                    return done(null, false, { message: "No user found with this username" });
                }

                // Validate password
                const isMatch = await user.matchPassword(password);
                if (!isMatch) {
                    return done(null, false, { message: "Incorrect password" });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        })
    );

    // Serialize user into the session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from the session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, false);
        }
    });
};
