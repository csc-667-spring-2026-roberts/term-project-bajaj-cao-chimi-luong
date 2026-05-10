import pgPromise from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (connectionString === undefined) {
  throw new Error("Connection string undefined");
}

const pgp = pgPromise();
const connection = pgp({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default connection;
