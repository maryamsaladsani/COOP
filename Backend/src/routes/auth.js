// Auth routes: signup (REQ-28), login (REQ-29/30/31), logout (REQ-52),
// password reset (REQ-32/42), lockout (REQ-43).

const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const prisma = require("../lib/prisma");
const resend = require("../lib/resend");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

const SALT_ROUNDS = 10;

// REQ-43 gives the attempt threshold (10) but not a lockout duration — 15 minutes
// is a reasonable default, not a spec requirement. Change here if that changes.
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

// Not specified in requirements — reasonable default session length. Change here.
const JWT_EXPIRY = "24h";

// REQ-32/42 say "reset via email" but not a TTL — ~1 hour is a reasonable default.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const RESET_EMAIL_SENDER = "COOP <noreply@coop.maryamaladsani.site>";

function sanitizeUser(user) {
  const { password, resetToken, resetTokenExpiresAt, ...safe } = user;
  return safe;
}

// --- REQ-28: HR/Coordinator self-service signup -----------------------------
// Trainee accounts are never created here — they're auto-created by HR's
// accept-application flow (REQ-16), which is Phase 4.
//
// Coordinator signup requires departmentId and links it in the same transaction as account
// creation (Department.coordinatorId — the relation already used by HR's manual linking
// route, PATCH /api/hr/departments/:id/coordinator; this is just the self-service path onto
// the same FK, not a separate concept). Rejects if that department is already claimed by a
// different coordinator, rather than silently overwriting it.
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, fullName, phone, role, departmentId } = req.body || {};

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: "email, password, fullName, and role are required" });
    }

    if (role === "TRAINEE") {
      return res.status(400).json({
        message:
          "Trainee accounts cannot self-register — they are created automatically when HR accepts an application.",
      });
    }

    if (role !== "HR" && role !== "COORDINATOR") {
      return res.status(400).json({ message: "role must be HR or COORDINATOR" });
    }

    let department = null;
    if (role === "COORDINATOR") {
      if (!departmentId) {
        return res.status(400).json({ message: "departmentId is required for Training Coordinator signup" });
      }
      department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) {
        return res.status(400).json({ message: "departmentId does not match a real department" });
      }
      if (department.coordinatorId) {
        return res.status(409).json({
          message: "This department already has a Training Coordinator assigned — contact HR if this is a mistake.",
        });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { email, password: hashedPassword, fullName, phone, role },
        });

        if (department) {
          // Re-check under the transaction in case of a race between two coordinators
          // signing up for the same department at the same time.
          const stillUnclaimed = await tx.department.updateMany({
            where: { id: department.id, coordinatorId: null },
            data: { coordinatorId: created.id },
          });
          if (stillUnclaimed.count === 0) {
            throw new Error("DEPARTMENT_ALREADY_CLAIMED");
          }
        }

        return created;
      });
    } catch (err) {
      if (err.message === "DEPARTMENT_ALREADY_CLAIMED") {
        return res.status(409).json({
          message: "This department was just claimed by another Training Coordinator — pick a different one.",
        });
      }
      throw err;
    }

    return res.status(201).json({ user: sanitizeUser(user) });
  })
);

// --- REQ-29/30/31: unified login across all three roles ---------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // REQ-43: reject locked accounts before ever comparing the password.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({
      message: "Account is temporarily locked due to too many failed login attempts. Try again later.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const data = { failedLoginAttempts };

    if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = new Date(Date.now() + LOCKOUT_WINDOW_MS);
    }

    await prisma.user.update({ where: { id: user.id }, data });

    return res.status(401).json({ message: "Invalid email or password" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: JWT_EXPIRY,
  });

  return res.status(200).json({ token, user: sanitizeUser(user) });
});

// --- REQ-52: logout ----------------------------------------------------------
// Stateless JWT — nothing to invalidate server-side. Client just discards the token.
router.post("/logout", (req, res) => {
  return res.status(200).json({ message: "Logged out" });
});

// --- REQ-32/42: password reset ------------------------------------------------
router.post("/password-reset-request", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  // Always respond identically whether or not the email is registered,
  // so this endpoint can't be used to enumerate accounts.
  const genericResponse = {
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt },
    });

    const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;

    try {
      // The Resend SDK resolves with { data, error } rather than throwing on
      // API-level failures (e.g. invalid key, unverified domain) — only
      // network-level failures throw. Check both so send failures don't go
      // unnoticed. Either way, the response to the client stays identical.
      const { error } = await resend.emails.send({
        from: RESET_EMAIL_SENDER,
        to: user.email,
        subject: "Reset your COOP password",
        html: `<p>We received a request to reset your COOP password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });

      if (error) {
        console.error("[auth] Failed to send password reset email:", error);
      }
    } catch (err) {
      console.error("[auth] Failed to send password reset email:", err);
    }
  }

  return res.status(200).json(genericResponse);
});

router.post("/password-reset-confirm", async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ message: "token and newPassword are required" });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiresAt: null },
  });

  return res.status(200).json({ message: "Password has been reset. You can now log in with your new password." });
});

router.all("*", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = router;
