// Syncs the Department (and Division) tables from a local snapshot
// (prisma/departments-data.json) into whichever database DATABASE_URL points at.
// Upsert-by-id/[departmentId,name], so it's safe to re-run — re-running against an
// environment that already has these rows just updates them in place, never duplicates.
// Data-only: does not run migrations, does not touch the schema.
//
// Each department entry's `divisions` array (a list of plain division-name strings) is
// upserted into the Division table, one row per name, scoped to that department — empty
// arrays are a no-op, not an error, for departments with no divisions defined yet.
//
// Run with: node prisma/seed-departments.js

const prisma = require("../src/lib/prisma");
const departments = require("./departments-data.json");

async function main() {
  let departmentCount = 0;
  let divisionCount = 0;

  for (const { divisions = [], ...dept } of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: dept,
      create: dept,
    });
    departmentCount += 1;

    for (const name of divisions) {
      await prisma.division.upsert({
        where: { departmentId_name: { departmentId: dept.id, name } },
        update: {},
        create: { departmentId: dept.id, name },
      });
      divisionCount += 1;
    }
  }

  console.log(`Seeded ${departmentCount} department(s) and ${divisionCount} division(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
