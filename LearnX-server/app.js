import express from "express";
import { config } from "dotenv";
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";

config({
  path: "./config/config.env",
});

const app = express();

// Using MIDDLEWARES
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Importing and Using ROUTES
import course from "./routes/courseRoutes.js";
import user from "./routes/userRoutes.js";
import other from "./routes/otherRoutes.js";
import cors from "cors";

app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", other);

export default app;

app.get("/", (req, res) =>
  res.send(
    `<h1>Site is working. Click <a href=${process.env.FRONTEND_URL}></a> to visit frontend.</h1>`
  )
);

app.use(ErrorMiddleware);