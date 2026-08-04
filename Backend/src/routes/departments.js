// Public department reference list — no auth, since the signup page (REQ-28) that needs to
// let a Training Coordinator pick a real department is itself unauthenticated. Deliberately
// minimal: id/name/divisions only. No coordinator name, branch, business line, building, or
// floor — those are HR-internal (see GET /api/hr/departments for the full shape).

const express = require("express");

const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const departments = await prisma.department.findMany({
      include: { divisions: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        divisions: d.divisions.map((div) => div.name),
      })),
    });
  })
);

module.exports = router;
