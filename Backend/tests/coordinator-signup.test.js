// Regression test for BUG-006 (coordinator signup allowed free-text department entry not
// linked to a real Department record). departmentId must be a real Department FK — reject
// on missing/invalid/unlisted values, and never create an orphaned user account on rejection.

const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createDepartment } = require("./helpers/db");

describe("coordinator signup department linking", () => {
  afterEach(resetDb);
  afterAll(() => prisma.$disconnect());

  test("rejects Coordinator signup with no departmentId at all", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "nodept@signup.test",
      password: "TestPass#123",
      fullName: "No Dept",
      role: "COORDINATOR",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/departmentId is required/);

    const user = await prisma.user.findUnique({ where: { email: "nodept@signup.test" } });
    expect(user).toBeNull();
  });

  test("rejects an unlisted/made-up departmentId string (not a real FK)", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "faketdept@signup.test",
      password: "TestPass#123",
      fullName: "Fake Dept",
      role: "COORDINATOR",
      departmentId: "this-is-not-a-real-department-id",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not match a real department/);

    const user = await prisma.user.findUnique({ where: { email: "faketdept@signup.test" } });
    expect(user).toBeNull();
  });

  test("accepts a real departmentId and links Department.coordinatorId atomically", async () => {
    const department = await createDepartment({ name: "Real Department" });
    expect(department.coordinatorId).toBeNull();

    const res = await request(app).post("/api/auth/signup").send({
      email: "realdept@signup.test",
      password: "TestPass#123",
      fullName: "Real Dept",
      role: "COORDINATOR",
      departmentId: department.id,
    });
    expect(res.status).toBe(201);

    const updatedDept = await prisma.department.findUnique({ where: { id: department.id } });
    expect(updatedDept.coordinatorId).toBe(res.body.user.id);
  });

  test("rejects signup for a department that already has a different coordinator — no account created", async () => {
    const department = await createDepartment({ name: "Claimed Department" });
    await request(app)
      .post("/api/auth/signup")
      .send({
        email: "first@signup.test",
        password: "TestPass#123",
        fullName: "First Coordinator",
        role: "COORDINATOR",
        departmentId: department.id,
      })
      .expect(201);

    const res = await request(app).post("/api/auth/signup").send({
      email: "second@signup.test",
      password: "TestPass#123",
      fullName: "Second Coordinator",
      role: "COORDINATOR",
      departmentId: department.id,
    });
    expect(res.status).toBe(409);

    const secondUser = await prisma.user.findUnique({ where: { email: "second@signup.test" } });
    expect(secondUser).toBeNull();
  });

  test("HR signup does not require departmentId — HR has no department concept", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      email: "hr@signup.test",
      password: "TestPass#123",
      fullName: "HR Person",
      role: "HR",
    });
    expect(res.status).toBe(201);
  });
});
