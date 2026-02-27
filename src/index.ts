import express from "express";
import path from "path";
import { fileURLToPath } from "node:url";
import homeRoutes from "./routes/home.js";
import logging from "./middleware/logging.js";
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.static(path.join(__dirname, "../public"))); // serve static files

app.use(logging);
app.use("/", homeRoutes);

// This MUST be the last app.use() - after all routes
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// --- start ---
app.listen(PORT, () => {
  console.log(`Server running on http//localhost:${String(PORT)}`);
});
