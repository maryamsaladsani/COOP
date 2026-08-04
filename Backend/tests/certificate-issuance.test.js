// Regression test for the certificate-issuance exception carved out when BUG-002 was fixed:
// unlike the four independent Coordinator actions, certificate issuance must still require
// ALL SIX prior milestones actually complete (card issued, department + division assigned,
// account + desk/device requested, training confirmed) — checked via real per-step fields,
// not the single `milestone` display marker, since steps can now land out of order.

const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createUser, authHeader, createDepartment, createTrainee } = require("./helpers/db");

describe("certificate issuance", () => {
  afterEach(resetDb);
  afterAll(() => prisma.$disconnect());

  async function baseSetup(overrides = {}) {
    const hr = await createUser({ role: "HR", email: `hr.${Date.now()}@cert.test` });
    const coordinator = await createUser({ role: "COORDINATOR", email: `coord.${Date.now()}@cert.test` });
    const department = await createDepartment({ coordinatorId: coordinator.id });
    const trainee = await createTrainee({
      coordinatorId: coordinator.id,
      departmentId: department.id,
      contractSigned: true,
      ...overrides,
    });
    return { hr, coordinator, trainee };
  }

  test("fails when no prior milestones are complete", async () => {
    // baseSetup links a department by default (needed by other tests) — null it out here so
    // this test genuinely represents "nothing done yet".
    const { hr, trainee } = await baseSetup();
    await prisma.trainee.update({ where: { id: trainee.id }, data: { departmentId: null } });

    const res = await request(app)
      .patch(`/api/hr/students/${trainee.id}/issue-certificate`)
      .set("Authorization", authHeader(hr))
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Company Card/);
    expect(res.body.message).toMatch(/Department Assignment/);
    expect(res.body.message).toMatch(/Division Assignment/);
    expect(res.body.message).toMatch(/Account Credentials/);
    expect(res.body.message).toMatch(/Desk & Device/);
    expect(res.body.message).toMatch(/Training Completion/);
  });

  test("fails when 5 of 6 are complete — reports exactly the one missing", async () => {
    const { hr, trainee } = await baseSetup({
      cardStatus: "ISSUED",
      division: "Some Division",
      accountRequested: true,
      deskDeviceRequested: true,
      trainingCompleted: true,
      // departmentId intentionally set via baseSetup already; leave division set but no dept
    });
    // Remove the department link specifically, so exactly one condition fails.
    await prisma.trainee.update({ where: { id: trainee.id }, data: { departmentId: null } });

    const res = await request(app)
      .patch(`/api/hr/students/${trainee.id}/issue-certificate`)
      .set("Authorization", authHeader(hr))
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Department Assignment/);
    expect(res.body.message).not.toMatch(/Company Card/);
    expect(res.body.message).not.toMatch(/Division Assignment/);
    expect(res.body.message).not.toMatch(/Account Credentials/);
    expect(res.body.message).not.toMatch(/Desk & Device/);
    expect(res.body.message).not.toMatch(/Training Completion/);
  });

  test("succeeds once all six are complete, regardless of the order they happened in", async () => {
    const { hr, coordinator, trainee } = await baseSetup();

    // Deliberately out of roadmap order: desk/device and training confirm before account.
    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/request-desk-device`)
      .set("Authorization", authHeader(coordinator))
      .send({})
      .expect(200);
    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/confirm-training`)
      .set("Authorization", authHeader(coordinator))
      .send({})
      .expect(200);
    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/division`)
      .set("Authorization", authHeader(coordinator))
      .send({ division: "Final Division" })
      .expect(200);
    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/request-account`)
      .set("Authorization", authHeader(coordinator))
      .send({})
      .expect(200);
    await request(app)
      .patch(`/api/hr/students/${trainee.id}/request-card`)
      .set("Authorization", authHeader(hr))
      .send({})
      .expect(200);

    const res = await request(app)
      .patch(`/api/hr/students/${trainee.id}/issue-certificate`)
      .set("Authorization", authHeader(hr))
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.trainee.certificateIssued).toBe(true);
  });
});
