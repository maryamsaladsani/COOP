// Single shared PrismaClient instance — import this everywhere.
// Never call `new PrismaClient()` in route/middleware files directly.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
