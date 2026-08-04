// Regression test for BUG-002 (coordinator actions incorrectly gated by strict milestone
// sequence) and BUG-003 (no contractSigned enforcement) — see /BUGS.md. Each of the four
// coordinator actions must be: blocked (409) when contractSigned === false, allowed (200)
// when true, and callable in ANY order relative to each other (no "must be at step X first").

const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createUser, authHeader, createDepartment, createTrainee } = require("./helpers/db");

describe("coordinator action gating", () => {
  afterEach(resetDb);
  afterAll(() => prisma.$disconnect());

  async function setupCoordinatorAndTrainee(contractSigned) {
    const coordinator = await createUser({ role: "COORDINATOR", email: `coord.${Date.now()}@gating.test` });
    const department = await createDepartment({ coordinatorId: coordinator.id });
    const trainee = await createTrainee({ coordinatorId: coordinator.id, departmentId: department.id, contractSigned });
    return { coordinator, trainee };
  }

  const ACTIONS = [
    { name: "request-account", method: "patch", path: (id) => `/api/coordinator/trainees/${id}/request-account`, body: {} },
    { name: "request-desk-device", method: "patch", path: (id) => `/api/coordinator/trainees/${id}/request-desk-device`, body: {} },
    { name: "division", method: "patch", path: (id) => `/api/coordinator/trainees/${id}/division`, body: { division: "Test Division" } },
    { name: "confirm-training", method: "patch", path: (id) => `/api/coordinator/trainees/${id}/confirm-training`, body: {} },
  ];

  describe.each(ACTIONS)("$name", ({ method, path, body }) => {
    test("blocked with 409 when contractSigned is false", async () => {
      const { coordinator, trainee } = await setupCoordinatorAndTrainee(false);
      const res = await request(app)
        [method](path(trainee.id))
        .set("Authorization", authHeader(coordinator))
        .send(body);
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/contract/i);
    });

    test("allowed when contractSigned is true", async () => {
      const { coordinator, trainee } = await setupCoordinatorAndTrainee(true);
      const res = await request(app)
        [method](path(trainee.id))
        .set("Authorization", authHeader(coordinator))
        .send(body);
      expect(res.status).toBe(200);
    });
  });

  test("actions succeed in any order — desk/device before account, before division, before training confirm", async () => {
    const { coordinator, trainee } = await setupCoordinatorAndTrainee(true);

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
      .patch(`/api/coordinator/trainees/${trainee.id}/request-account`)
      .set("Authorization", authHeader(coordinator))
      .send({})
      .expect(200);

    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/division`)
      .set("Authorization", authHeader(coordinator))
      .send({ division: "Late Division" })
      .expect(200);

    const updated = await prisma.trainee.findUnique({ where: { id: trainee.id } });
    expect(updated.deskDeviceRequested).toBe(true);
    expect(updated.trainingCompleted).toBe(true);
    expect(updated.accountRequested).toBe(true);
    expect(updated.division).toBe("Late Division");
  });
});
