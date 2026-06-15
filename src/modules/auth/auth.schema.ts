import { z } from "zod";
import { nonEmptyString, uuidParam } from "../../shared/validators.js";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: nonEmptyString("Password"),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: uuidParam,
    email: z.string().email(),
    role: z.enum(["admin", "investor"]),
  }),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
