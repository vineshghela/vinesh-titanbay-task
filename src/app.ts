import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { fundsRoutes } from "./modules/funds/funds.routes.js";
import { investmentsRoutes } from "./modules/investments/investments.routes.js";
import { investorsRoutes } from "./modules/investors/investors.routes.js";
import { transactionsRoutes } from "./modules/transactions/transactions.routes.js";
import { errorHandler } from "./shared/errors.js";

export function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(helmet);
  app.register(cors, { origin: process.env.CORS_ORIGIN ?? false });
  app.register(rateLimit, { global: false });

  app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      info: {
        title: "Titanbay API",
        description: "API for managing private market funds & investor commitments",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { persistAuthorization: true },
  });

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "test-secret-do-not-use-in-prod",
    sign: { expiresIn: "24h" },
  });

  app.setErrorHandler(errorHandler);

  app.addHook("onSend", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.get("/health", { schema: { hide: true } }, async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  app.register(authRoutes);
  app.register(fundsRoutes);
  app.register(investorsRoutes);
  app.register(investmentsRoutes);
  app.register(transactionsRoutes);

  return app;
}
