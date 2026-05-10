import { NextFunction, Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

import Users from "../db/users.js";
import { TypedRequestBody, UserLoginRequestBody } from "../types/types.js";

const router = Router();

const SALT_ROUNDS = 10;

function gravatarUrl(email: string): string {
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

function redirectIfLoggedIn(request: Request, response: Response, next: NextFunction): void {
  if (request.session.user) {
    response.redirect("/lobby");
    return;
  }
  next();
}

router.get("/register", redirectIfLoggedIn, (_request, response) => {
  response.render("auth/register", { path: "/auth/register" });
});

router.post("/register", async (request: TypedRequestBody<UserLoginRequestBody>, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    response.render("auth/register", { error: "Email and password required" });
    return;
  }

  if (password.length < 8) {
    response.render("auth/register", { error: "Password must be at least 8 characters" });
    return;
  }

  try {
    if (await Users.existing(email)) {
      response.render("auth/register", { error: "Email is already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const avatar = gravatarUrl(email);

    const user = await Users.create(email, passwordHash, avatar);

    request.session.user = user;
    response.redirect("/lobby");
  } catch (error) {
    console.error("Registration error:", error);
    response.render("auth/register", { error: "Registration failed" });
  }
});

router.get("/login", redirectIfLoggedIn, (_request, response) => {
  response.render("auth/login");
});

router.post("/login", async (request: TypedRequestBody<UserLoginRequestBody>, response) => {
  const { email, password } = request.body;

  if (!email || !password) {
    response.render("auth/login", { error: "Email and password required" });
    return;
  }

  try {
    const dbUser = await Users.findByEmail(email);
    const isMatch = await bcrypt.compare(password, dbUser.pw_hash);

    if (!isMatch) {
      throw new Error(`Match not found for ${email}`);
    }

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      gravatar_url: dbUser.gravatar_url,
      created_at: dbUser.created_at,
    };

    request.session.user = user;
    response.redirect("/lobby");
  } catch (error) {
    console.error("Login error:", error);
    response.render("auth/login", { error: "Invalid email or password" });
  }
});

router.post("/logout", (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
    }

    response.clearCookie("connect.sid");
    response.redirect("/auth/login");
  });
});

export default router;
