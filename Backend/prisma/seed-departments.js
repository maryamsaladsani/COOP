// Seeds the real department/division list (replacing the placeholder "Engineering Test
// Dept" used during development). Upsert-based — safe to re-run.
//
// Only `name` and (for Enterprise and Business Solutions) `divisions` were supplied for
// these departments — branch/businessLine/buildingNumber/floorNumber and coordinatorId are
// left null rather than guessed. HR needs to fill those in manually (via the existing
// PATCH /api/hr/departments/:id/coordinator route for the coordinator link; the other four
// fields have no route yet — direct DB edit or a future admin route) before HR can assign
// trainees to any of these six departments (assign-department requires coordinatorId to be
// set, see hr.js).
//
// Run with: node prisma/seed-departments.js

const prisma = require("../src/lib/prisma");

const DEPARTMENTS = [
  {
    name: "Enterprise and Business Solutions",
    divisions: [
      "Enterprise Resource Solution Division",
      "Billing and Customer Relation Solution Division",
      "ERP Technical Application Support Division",
      "Document and Archives Division",
      "GIS Division",
      "Assets Maintenance Solutions Division",
    ],
  },
  { name: "Reports & Customer Insights Department", divisions: [] },
  { name: "Business Development Department", divisions: [] },
  { name: "Documentation Department", divisions: [] },
  { name: "Digital Projects Department", divisions: [] },
  { name: "Data Management Office Department", divisions: [] },
];

async function upsertDepartment({ name, divisions }) {
  const department = await prisma.department.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  for (const divisionName of divisions) {
    await prisma.division.upsert({
      where: { departmentId_name: { departmentId: department.id, name: divisionName } },
      update: {},
      create: { departmentId: department.id, name: divisionName },
    });
  }

  return department;
}

async function main() {
  for (const dept of DEPARTMENTS) {
    const department = await upsertDepartment(dept);
    console.log(`Upserted "${department.name}" (${dept.divisions.length} division(s))`);
  }

  // One-time cleanup, confirmed with HR: remove the dev-only placeholder department. Any
  // trainee previously assigned to it (departmentId is ON DELETE SET NULL) keeps its
  // division value and coordinatorId — only the department link is cleared, so those
  // trainees need reassigning to a real department via the existing HR UI.
  const testDept = await prisma.department.findUnique({ where: { name: "Engineering Test Dept" } });
  if (testDept) {
    const affected = await prisma.trainee.findMany({
      where: { departmentId: testDept.id },
      select: { id: true, fullName: true },
    });
    await prisma.department.delete({ where: { id: testDept.id } });
    console.log(`Deleted "Engineering Test Dept".`);
    if (affected.length > 0) {
      console.log(
        `  ${affected.length} trainee(s) lost their department assignment and need reassigning: ` +
          affected.map((t) => `${t.fullName} (${t.id})`).join(", ")
      );
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
