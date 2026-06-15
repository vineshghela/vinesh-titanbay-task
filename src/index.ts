import "dotenv/config";
import { buildApp } from "./app.js";

const app = buildApp();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

const shutdown = async () => {
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
