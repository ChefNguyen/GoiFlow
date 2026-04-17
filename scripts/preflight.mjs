const required = ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(`Missing environment variables: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Environment contract looks good.");
}
