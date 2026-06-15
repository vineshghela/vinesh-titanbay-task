export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "investor";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: AuthUser;
  }
}
