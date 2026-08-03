// Single shared Resend client instance — import this everywhere.
// Never call `new Resend()` per file.

const { Resend } = require("resend");
const env = require("../config/env");

const resend = new Resend(env.resendApiKey);

module.exports = resend;
