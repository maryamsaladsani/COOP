// Regression test for BUG-001 (Company Card status inconsistent across HR/Coordinator/
// Trainee dashboards) — see /BUGS.md. Asserts that a single trainee's status for every
// milestone-related field returns identically no matter which role's endpoint queries it,
// at every stage of the onboarding lifecycle, not just once at the end.

const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createUser, authHeader, createDepartment, createTrainee } = require("./helpers/db");

describe("milestone/card status consistency across HR, Coordinator, and Trainee endpoints", () => {
  afterEach(resetDb);
  afterAll(() => prisma.$disconnect());

  async function fetchAllThreeViews(hr, coordinator, traineeToken, traineeId) {
    const hrRes = await request(app)
      .get(`/api/hr/students/${traineeId}`)
      .set("Authorization", authHeader(hr));
    const coordRes = await request(app)
      .get(`/api/coordinator/trainees/${traineeId}`)
      .set("Authorization", authHeader(coordinator));
    const traineeRes = await request(app)
      .get("/api/trainee/status")
      .set("Authorization", `Bearer ${traineeToken}`);

    return {
      hr: hrRes.body.student,
      coordinator: coordRes.body.trainee,
      trainee: traineeRes.body,
    };
  }

  test("cardStatus matches across all three views at every stage — no waiting-period drift", async () => {
    const hr = await createUser({ role: "HR", email: "hr@consistency.test" });
    const coordinator = await createUser({ role: "COORDINATOR", email: "coord@consistency.test" });
    const department = await createDepartment({ name: "Consistency Dept", coordinatorId: coordinator.id });

    const traineeUser = await createUser({ role: "TRAINEE", email: "trainee@consistency.test" });
    const trainee = await createTrainee({
      userId: traineeUser.id,
      coordinatorId: coordinator.id,
      departmentId: department.id,
    });
    const traineeToken = require("./helpers/db").signToken(traineeUser);

    // Stage 1: before requesting the card — all three must agree it's NOT_REQUESTED.
    let views = await fetchAllThreeViews(hr, coordinator, traineeToken, trainee.id);
    expect(views.hr.cardStatus).toBe("NOT_REQUESTED");
    expect(views.coordinator.cardStatus).toBe("NOT_REQUESTED");
    expect(views.trainee.cardStatus).toBe("NOT_REQUESTED");

    // Stage 2: HR requests the card. No 2-hour waiting period (BUG-001's fix) — it must be
    // ISSUED immediately, identically, on all three endpoints in the very next read.
    await request(app)
      .patch(`/api/hr/students/${trainee.id}/request-card`)
      .set("Authorization", authHeader(hr))
      .send({})
      .expect(200);

    views = await fetchAllThreeViews(hr, coordinator, traineeToken, trainee.id);
    expect(views.hr.cardStatus).toBe("ISSUED");
    expect(views.coordinator.cardStatus).toBe("ISSUED");
    expect(views.trainee.cardStatus).toBe("ISSUED");
    // The specific regression: Trainee's dashboard used to derive cardStatus from milestone
    // position instead of the real field, and could disagree with HR/Coordinator.
    expect(views.trainee.cardStatus).toBe(views.hr.cardStatus);

    // Stage 3: sign contract, then run a coordinator action out of the roadmap's display
    // order (desk/device before account) — accountRequested/deskDeviceRequested must still
    // agree across all three views afterward.
    await prisma.trainee.update({ where: { id: trainee.id }, data: { contractSigned: true } });
    await request(app)
      .patch(`/api/coordinator/trainees/${trainee.id}/request-desk-device`)
      .set("Authorization", authHeader(coordinator))
      .send({})
      .expect(200);

    views = await fetchAllThreeViews(hr, coordinator, traineeToken, trainee.id);
    expect(views.hr.deskDeviceRequested).toBe(true);
    expect(views.coordinator.deskDeviceRequested).toBe(true);
    expect(views.trainee.deskDeviceRequested).toBe(true);
    expect(views.hr.accountRequested).toBe(false);
    expect(views.coordinator.accountRequested).toBe(false);
    expect(views.trainee.accountRequested).toBe(false);
  });

  test("contractSigned matches across all three views", async () => {
    const hr = await createUser({ role: "HR", email: "hr2@consistency.test" });
    const coordinator = await createUser({ role: "COORDINATOR", email: "coord2@consistency.test" });
    const department = await createDepartment({ name: "Consistency Dept 2", coordinatorId: coordinator.id });
    const traineeUser = await createUser({ role: "TRAINEE", email: "trainee2@consistency.test" });
    const trainee = await createTrainee({
      userId: traineeUser.id,
      coordinatorId: coordinator.id,
      departmentId: department.id,
      contractSigned: false,
    });
    const traineeToken = require("./helpers/db").signToken(traineeUser);

    let views = await fetchAllThreeViews(hr, coordinator, traineeToken, trainee.id);
    expect(views.hr.contractSigned).toBe(false);
    expect(views.coordinator.contractSigned).toBe(false);
    expect(views.trainee.contractSigned).toBe(false);

    await request(app).post("/api/trainee/contract/sign").set("Authorization", `Bearer ${traineeToken}`).expect(200);

    views = await fetchAllThreeViews(hr, coordinator, traineeToken, trainee.id);
    expect(views.hr.contractSigned).toBe(true);
    expect(views.coordinator.contractSigned).toBe(true);
    expect(views.trainee.contractSigned).toBe(true);
  });
});
