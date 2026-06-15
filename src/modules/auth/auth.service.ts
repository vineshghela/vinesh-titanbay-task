import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";
import { NotFoundError, UnauthorisedError } from "../../shared/errors.js";
import type { LoginBody, LoginResponse } from "./auth.schema.js";

export async function login(
  body: LoginBody,
  signToken: (payload: object) => string,
): Promise<LoginResponse> {
  const [user] = await db.select().from(users).where(eq(users.email, body.email));

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorisedError("Invalid credentials");
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const payload = { id: user.id, email: user.email, role: user.role };
  const token = signToken(payload);

  return { token, user: payload };
}
