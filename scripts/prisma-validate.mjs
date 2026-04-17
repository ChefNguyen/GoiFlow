import { execSync } from "node:child_process";

const fallbackUrl =
  "postgresql://postgres:postgres@localhost:5432/goiflow?schema=public";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || fallbackUrl,
};

execSync("npx prisma validate", {
  stdio: "inherit",
  env,
});
