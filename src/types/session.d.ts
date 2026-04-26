import "express-session";
import { User } from "./types.ts";

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}
