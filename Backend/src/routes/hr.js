// HR routes: accept/reject applications (REQ-15/19), notifications (REQ-17/18/20), card
// requests (REQ-21), student database/profile (REQ-23/24), department+coordinator assignment
// (REQ-25), certificate issuance (REQ-26), withdrawal (REQ-27). HR sees all students —
// no coordinatorId-style scoping (unlike Coordinator routes).
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");

const { requireAuth } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const prisma = require("../lib/prisma");
const resend = require("../lib/resend");
const asyncHandler = require("../lib/asyncHandler");
const formatDate = require("../lib/formatDate");
const { isMilestoneBehind } = require("../lib/milestone");
const { createDocumentSignedUrl } = require("../lib/uploads");
const { buildEmailTemplate } = require("../lib/emailTemplate");

const router = express.Router();

router.use(requireAuth);
router.use(roleGuard("HR"));

const SALT_ROUNDS = 10;
const EMAIL_SENDER = "COOP <noreply@coop.maryamaladsani.site>";

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

function toStudentSummary(t) {
  return {
    id: t.id,
    fullName: t.fullName,
    personalEmail: t.personalEmail,
    universityName: t.universityName,
    major: t.major,
    nationalId: t.nationalId,
    applicationStatus: t.applicationStatus,
    milestone: t.milestone,
    cardStatus: t.cardStatus,
    coordinatorId: t.coordinatorId,
    departmentId: t.departmentId,
    division: t.division,
    withdrawn: t.withdrawn,
    trainingCompleted: t.trainingCompleted,
    certificateIssued: t.certificateIssued,
    createdAt: t.createdAt,
  };
}

// `html` here is just the body content for the email type (see sendAcceptanceEmails/
// sendRejectionEmail/sendWithdrawalEmail below) — buildEmailTemplate() wraps it with the
// shared branded header/footer once, here, so none of those call sites duplicate that markup.
async function sendEmail({ to, subject, html }, logContext) {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to,
      subject,
      html: buildEmailTemplate(html),
    });

    if (error) {
      console.error(
        `[hr] Failed to send email (${logContext}) to ${to}:`,
        error
      );
    }
  } catch (err) {
    console.error(
      `[hr] Failed to send email (${logContext}) to ${to}:`,
      err
    );
  }
}

async function sendAcceptanceEmails(trainee, tempPassword) {
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Your COOP application has been accepted",
      html:
        `<p>Congratulations ${trainee.fullName}, your Saudi Energy COOP application has been accepted.</p>` +
        `<p>Your COOP account has been created. Log in with:</p>` +
        `<p>Email: ${trainee.personalEmail}<br/>Temporary password: ${tempPassword}</p>` +
        `<p>Please log in and change your password as soon as possible.</p>`,
    },
    "REQ-17 acceptance"
  );

  await sendEmail(
    {
      to: trainee.universityEmail,
      subject: `COOP acceptance confirmation for ${trainee.fullName}`,
      html:
        `<p>This confirms that ${trainee.fullName} (National ID: ${trainee.nationalId}) has been ` +
        `accepted into the Saudi Energy COOP program, running from ${formatDate(
          trainee.startDate
        )} ` +
        `to ${formatDate(trainee.endDate)}.</p>`,
    },
    "REQ-18 university notification"
  );
}

async function sendRejectionEmail(trainee) {
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Update on your COOP application",
      html:
        `<p>Dear ${trainee.fullName}, thank you for applying to the Saudi Energy COOP program. ` +
        `After review, we are unable to move forward with your application at this time.</p>`,
    },
    "REQ-20 rejection"
  );
}

async function sendWithdrawalEmail(trainee) {
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Update on your COOP training",
      html:
        `<p>Dear ${trainee.fullName}, your Saudi Energy COOP training has been withdrawn. ` +
        `Please contact HR directly if you have any questions.</p>`,
    },
    "withdrawal notification"
  );
}

// -----------------------------------------------------------------------------
// Department reference list
// -----------------------------------------------------------------------------

router.get(
  "/departments",
  asyncHandler(async (_req, res) => {
    const departments = await prisma.department.findMany({
      include: {
        coordinator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        divisions: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const shaped = departments.map((department) => ({
      id: department.id,
      name: department.name,
      branch: department.branch,
      businessLine: department.businessLine,
      buildingNumber: department.buildingNumber,
      floorNumber: department.floorNumber,
      coordinatorId: department.coordinatorId,
      coordinatorName: department.coordinator
        ? department.coordinator.fullName
        : null,
      divisions: department.divisions.map(
        (division) => division.name
      ),
    }));

    return res.status(200).json({
      departments: shaped,
    });
  })
);

// -----------------------------------------------------------------------------
// Link coordinator to department
// -----------------------------------------------------------------------------

router.patch(
  "/departments/:id/coordinator",
  asyncHandler(async (req, res) => {
    const { coordinatorId } = req.body || {};

    if (!coordinatorId) {
      return res.status(400).json({
        message: "coordinatorId is required",
      });
    }

    const department = await prisma.department.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const coordinator = await prisma.user.findUnique({
      where: {
        id: coordinatorId,
      },
    });

    if (!coordinator || coordinator.role !== "COORDINATOR") {
      return res.status(400).json({
        message:
          "coordinatorId must reference an existing user with role COORDINATOR",
      });
    }

    const updated = await prisma.department.update({
      where: {
        id: department.id,
      },
      data: {
        coordinatorId,
      },
      include: {
        coordinator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return res.status(200).json({
      department: {
        id: updated.id,
        name: updated.name,
        branch: updated.branch,
        businessLine: updated.businessLine,
        buildingNumber: updated.buildingNumber,
        floorNumber: updated.floorNumber,
        coordinatorId: updated.coordinatorId,
        coordinatorName: updated.coordinator
          ? updated.coordinator.fullName
          : null,
      },
    });
  })
);

// -----------------------------------------------------------------------------
// All students
// -----------------------------------------------------------------------------

router.get(
  "/students",
  asyncHandler(async (_req, res) => {
    const trainees = await prisma.trainee.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      students: trainees.map(toStudentSummary),
    });
  })
);

// -----------------------------------------------------------------------------
// Full student profile
// -----------------------------------------------------------------------------

router.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json({
      student: trainee,
    });
  })
);

// -----------------------------------------------------------------------------
// Secure application document URL
//
// View:
// GET /api/hr/students/:id/documents/:field
//
// Download:
// GET /api/hr/students/:id/documents/:field?download=true
//
// The returned Supabase URL is valid for five minutes.
// -----------------------------------------------------------------------------

router.get(
  "/students/:id/documents/:field",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const wantsDownload = req.query.download === "true";

    const document = await createDocumentSignedUrl(
      trainee,
      req.params.field,
      300,
      wantsDownload
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.status(200).json({
      document: {
        url: document.url,
        originalName: document.originalName,
        mode: wantsDownload ? "download" : "view",
        expiresInSeconds: 300,
      },
    });
  })
);

// -----------------------------------------------------------------------------
// Accept application
// -----------------------------------------------------------------------------

router.patch(
  "/students/:id/accept",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (trainee.applicationStatus !== "PENDING") {
      return res.status(409).json({
        message:
          `Application must be PENDING to accept ` +
          `(currently ${trainee.applicationStatus})`,
      });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(
      tempPassword,
      SALT_ROUNDS
    );

    let updatedTrainee;

    try {
      updatedTrainee = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: trainee.personalEmail,
            password: hashedPassword,
            fullName: trainee.fullName,
            phone: trainee.phone,
            role: "TRAINEE",
          },
        });

        return tx.trainee.update({
          where: {
            id: trainee.id,
          },
          data: {
            applicationStatus: "ACCEPTED",
            acceptedAt: new Date(),
            userId: user.id,
          },
        });
      });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({
          message:
            "A user account with this email already exists",
        });
      }

      throw err;
    }

    await sendAcceptanceEmails(
      updatedTrainee,
      tempPassword
    );

    return res.status(200).json({
      trainee: updatedTrainee,
    });
  })
);

// -----------------------------------------------------------------------------
// Reject application
// -----------------------------------------------------------------------------

router.patch(
  "/students/:id/reject",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (trainee.applicationStatus !== "PENDING") {
      return res.status(409).json({
        message:
          `Application must be PENDING to reject ` +
          `(currently ${trainee.applicationStatus})`,
      });
    }

    const updated = await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data: {
        applicationStatus: "REJECTED",
        rejectedAt: new Date(),
      },
    });

    await sendRejectionEmail(updated);

    return res.status(200).json({
      trainee: updated,
    });
  })
);

// -----------------------------------------------------------------------------
// Request ISD card
// -----------------------------------------------------------------------------

router.patch(
  "/students/:id/request-card",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (trainee.applicationStatus !== "ACCEPTED") {
      return res.status(409).json({
        message:
          `Student must be ACCEPTED to request a card ` +
          `(currently ${trainee.applicationStatus})`,
      });
    }

    if (trainee.cardStatus !== "NOT_REQUESTED") {
      return res.status(409).json({
        message:
          `Card has already been requested or issued ` +
          `(currently ${trainee.cardStatus})`,
      });
    }

    const now = new Date();

    const data = {
      cardStatus: "ISSUED",
      cardRequestedAt: now,
      cardIssuedAt: now,
    };

    if (
      isMilestoneBehind(
        trainee.milestone,
        "COMPANY_CARD"
      )
    ) {
      data.milestone = "COMPANY_CARD";
    }

    const updated = await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data,
    });

    return res.status(200).json({
      trainee: updated,
    });
  })
);

// -----------------------------------------------------------------------------
// Assign students to department
// -----------------------------------------------------------------------------

router.patch(
  "/students/assign-department",
  asyncHandler(async (req, res) => {
    const { studentIds, departmentId } =
      req.body || {};

    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "studentIds must be a non-empty array",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        message: "departmentId is required",
      });
    }

    const department =
      await prisma.department.findUnique({
        where: {
          id: departmentId,
        },
      });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    if (!department.coordinatorId) {
      return res.status(409).json({
        message:
          "Department has no coordinator assigned yet — cannot assign trainees to it",
      });
    }

    const trainees = await prisma.trainee.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
    });

    if (trainees.length !== studentIds.length) {
      const foundIds = new Set(
        trainees.map((trainee) => trainee.id)
      );

      const missing = studentIds.filter(
        (id) => !foundIds.has(id)
      );

      return res.status(404).json({
        message: `Student(s) not found: ${missing.join(
          ", "
        )}`,
      });
    }

    const notReady = trainees.filter(
      (trainee) =>
        trainee.applicationStatus !== "ACCEPTED"
    );

    if (notReady.length > 0) {
      return res.status(409).json({
        message:
          "Student(s) must be ACCEPTED to assign a department: " +
          notReady
            .map(
              (trainee) =>
                `${trainee.id} (${trainee.applicationStatus})`
            )
            .join(", "),
      });
    }

    const updated = await prisma.$transaction(
      trainees.map((trainee) => {
        const data = {
          departmentId: department.id,
          coordinatorId:
            department.coordinatorId,
        };

        if (
          isMilestoneBehind(
            trainee.milestone,
            "DEPARTMENT_ASSIGNMENT"
          )
        ) {
          data.milestone =
            "DEPARTMENT_ASSIGNMENT";
        }

        return prisma.trainee.update({
          where: {
            id: trainee.id,
          },
          data,
        });
      })
    );

    return res.status(200).json({
      trainees: updated,
    });
  })
);

// -----------------------------------------------------------------------------
// Issue completion certificate
// -----------------------------------------------------------------------------

router.patch(
  "/students/:id/issue-certificate",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const incomplete = [];

    if (trainee.cardStatus !== "ISSUED") {
      incomplete.push("Company Card");
    }

    if (
      !trainee.departmentId ||
      !trainee.coordinatorId
    ) {
      incomplete.push("Department Assignment");
    }

    if (!trainee.division) {
      incomplete.push("Division Assignment");
    }

    if (!trainee.accountRequested) {
      incomplete.push("Account Credentials");
    }

    if (!trainee.deskDeviceRequested) {
      incomplete.push("Desk & Device");
    }

    if (!trainee.trainingCompleted) {
      incomplete.push(
        "Training Completion (Coordinator confirmation)"
      );
    }

    if (incomplete.length > 0) {
      return res.status(409).json({
        message:
          "Cannot issue certificate — incomplete milestone(s): " +
          incomplete.join(", "),
      });
    }

    const updated = await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data: {
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        milestone: "CERTIFICATE",
      },
    });

    return res.status(200).json({
      trainee: updated,
    });
  })
);

// -----------------------------------------------------------------------------
// Withdraw trainee
// -----------------------------------------------------------------------------

router.patch(
  "/students/:id/withdraw",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!trainee) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (trainee.certificateIssued) {
      return res.status(409).json({
        message:
          "Cannot withdraw a trainee whose certificate has already been issued",
      });
    }

    if (trainee.withdrawn) {
      return res.status(409).json({
        message:
          "Trainee has already been withdrawn",
      });
    }

    const updated = await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data: {
        withdrawn: true,
        withdrawnAt: new Date(),
      },
    });

    await sendWithdrawalEmail(updated);

    return res.status(200).json({
      trainee: updated,
    });
  })
);

router.all("*", (_req, res) => {
  return res.status(501).json({
    message: "Not implemented yet",
  });
});

module.exports = router;