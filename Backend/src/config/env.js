// Loads and validates required environment variables at startup.
// Fails fast (logs + exits) rather than letting the app run in a broken state.

require("dotenv").config();

const REQUIRED_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "RESEND_API_KEY",
  "FRONTEND_URL",
];

function loadEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[config] Missing required environment variable(s): ${missing.join(", ")}`
    );
    console.error("[config] See .env.example — copy it to .env and fill in values.");
    process.exit(1);
  }

  return {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    frontendUrl: process.env.FRONTEND_URL,
    // Railway assigns PORT dynamically; only fall back locally.
    port: process.env.PORT || 3000,
  };
}

module.exports = loadEnv();
