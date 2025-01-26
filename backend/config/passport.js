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
    done(null, { id: user._id, role: user.role }); // Use `_id` instead of `id` for MongoDB documents
  });

  // Deserialize user from session
  passport.deserializeUser(async (user, done) => {
    try {
      const foundUser = await User.findById(user.id);
      if (!foundUser) {
        return done(new Error("User not found"));
      }
      done(null, foundUser);
    } catch (err) {
      done(err);
    }
  });
};
