// Syncs the Department table from a local snapshot (prisma/departments-data.json) into
// whichever database DATABASE_URL points at. Upsert-by-id, so it's safe to re-run — re-running
// against an environment that already has these rows just updates them in place, never
// duplicates. Data-only: does not run migrations, does not touch the schema.
//
// Run with: node prisma/seed-departments.js

const prisma = require("../src/lib/prisma");
const departments = require("./departments-data.json");

async function main() {
  let count = 0;

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: dept,
      create: dept,
    });
    count += 1;
  }

  console.log(`Seeded ${count} department(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
