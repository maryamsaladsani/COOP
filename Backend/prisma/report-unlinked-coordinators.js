// Read-only diagnostic (COOP bug: "Coordinator signup allows free-text Department entry").
//
// The old signup form had a free-text "Department" field, but the frontend never actually
// sent it to the backend (see mockAuth.js's old comment: "department... which the backend
// has no storage for") — there is no department string stored anywhere on User to check for
// mismatches. What actually happened instead: every coordinator who signed up before this
// fix ended up with NO department linked at all (Department.coordinatorId never got set for
// them). This script lists exactly those accounts so they can be manually linked to a real
// department via PATCH /api/hr/departments/:id/coordinator (or the fixed signup flow, for new
// accounts) — deliberately no auto-matching by name similarity, per the ticket's requirement.
//
// Run with: node prisma/report-unlinked-coordinators.js

const prisma = require("../src/lib/prisma");

async function main() {
  const coordinators = await prisma.user.findMany({
    where: { role: "COORDINATOR" },
    include: { coordinatedDepartments: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const unlinked = coordinators.filter((c) => c.coordinatedDepartments.length === 0);

  console.log(`${coordinators.length} coordinator account(s) total.`);
  console.log(`${unlinked.length} have NO department linked:\n`);

  for (const c of unlinked) {
    console.log(`  ${c.fullName} <${c.email}>  (id: ${c.id}, signed up ${c.createdAt.toISOString()})`);
  }

  const linked = coordinators.filter((c) => c.coordinatedDepartments.length > 0);
  if (linked.length > 0) {
    console.log(`\n${linked.length} already linked (no action needed):\n`);
    for (const c of linked) {
      console.log(`  ${c.fullName} <${c.email}> -> ${c.coordinatedDepartments.map((d) => d.name).join(", ")}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
