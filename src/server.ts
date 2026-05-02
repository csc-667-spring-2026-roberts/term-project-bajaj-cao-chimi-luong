import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";

import homeRoutes from "./routes/home.js";
import authRoutes from "./routes/auth.js";
import lobbyRoutes from "./routes/lobby.js";
import gameApiRoutes from "./routes/gamesApi.js";
import gameRoutes from "./routes/games.js";
import sseRoutes from "./routes/sse.js";
import loggingMiddleware from "./middleware/logging.js";
import db from "./db/connection.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
app.set("trust proxy",1);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "production") {
  const liveReloadServer = livereload.createServer({ exts: ["ejs", "css", "js"] });

  liveReloadServer.watch([
    path.join(__dirname, "..", "public"),
    path.join(__dirname, "..", "views"),
  ]);

  app.use(connectLiveReload());
}

const PgSession = connectPgSimple(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

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

app.use(loggingMiddleware);

app.use("/", homeRoutes);
app.use("/auth", authRoutes);
app.use("/lobby", lobbyRoutes);
app.use("/api/games", requireAuth, gameApiRoutes);
app.use("/games", requireAuth, gameRoutes);
app.use("/api/sse", sseRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${String(PORT)} at ${new Date().toLocaleTimeString()}`);
});
