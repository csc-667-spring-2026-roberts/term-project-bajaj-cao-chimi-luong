import pgp from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw Error("undefined env variable");
}

const db = pgp()(connectionString);

export default db;
