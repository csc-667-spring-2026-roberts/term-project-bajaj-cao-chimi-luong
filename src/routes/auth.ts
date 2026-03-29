import { Router } from "express";
import Users from "../db/users.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { TypedRequestBody, UserLoginRequestBody } from "../types/types.js";
const router = Router();

const SALT_ROUNDS = 10;

function gravatarUrl(email: string): string {
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

router.post("/register", async (request: TypedRequestBody<UserLoginRequestBody>, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    response.status(400).json({ error: "Email and password required" });
    return;
  }

  if (password.length < 8) {
    response.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    if (await Users.existing(email)) {
      response.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const avatar = gravatarUrl(email);

    const user = await Users.create(email, passwordHash, avatar);

    request.session.user = user;

    response.status(201).json({
      ...user,
    });
  } catch (error) {
    console.error("Registration error: ", error);
    response.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (request: TypedRequestBody<UserLoginRequestBody>, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    response.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const dbUser = await Users.findByEmail(email);
    const isMatch = await bcrypt.compare(password, dbUser.password_hash);

    if (!isMatch) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`Match not found for ${email}`);
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      gravatar_url: dbUser.gravatar_url,
      created_at: dbUser.created_at,
    };
    request.session.user = user;
    response.json(user);
  } catch (error) {
    console.error("Login error: ", error);
    response.status(500).json({ error: "Invalid email or password" });
  }
});

router.post("/logout", (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      console.error("Logout error: ", error);
      response.status(500).json({ error: "Logout failed" });
      return;
    }
    response.clearCookie("connect.sid");
    response.json({ message: "Logout successful" });
  });
});

export default router;
