import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";

import homeRoutes from "./routes/home.js";
import testRoutes from "./routes/test.js";
import authRoutes from "./routes/auth.js";

import logging from "./middleware/logging.js";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import db from "./db/connection.js";
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;

const PgSession = connectPgSimple(session);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PgSession({ pgPromise: db }),
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(logging);

app.use("/", homeRoutes);
app.use("/test", testRoutes);
app.use("/auth", authRoutes);

app.use(express.static(path.join(__dirname, "../public")));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});
