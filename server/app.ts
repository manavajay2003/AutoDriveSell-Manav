import express from "express";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma from "./prisma/prismaClient";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./passport";
import session from "express-session";

import rateLimit from "express-rate-limit";
import authRouter, { loggedIn } from "./routes/auth";
import profileRouter from "./routes/profile";
import adminRouter  from "./routes/adminRouter";
import catalogRouter from "./routes/catalog";
import checkoutRouter from "./routes/checkout";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
import cors from "cors";

// Allow Nginx proxy
app.set('trust proxy', 1)

// use it before all route definitions
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Rate limiting middleware
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: "Too many requests from this IP, please try again later.",
  })
);

app.use(
  session({
    key: "session",
    secret: process.env.SESSION_SECRET,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.authenticate("session"));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use("/api/products", catalogRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);
app.use("/api/checkout", checkoutRouter);

app.get("/api/", (req, res) => {
  res.send("AutoDriveSell server is up and running!");
});

app.get("/api/protected", loggedIn, (req, res, next) => {
  res.json({ data: "protected data" });
});

app.listen(PORT, () => {
  console.log(`AutoDriveSell server listening on port ${PORT}`);
  console.log(`To get products, go to http://localhost/api/products`);
});
