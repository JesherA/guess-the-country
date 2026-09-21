import { prisma } from "../src/prisma.js";

// Single-player app for now: make sure exactly one default user exists
// that every game can be attached to.
async function main() {
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log(`Default user already exists (${existing.id})`);
    return;
  }

  const user = await prisma.user.create({ data: {} });
  console.log(`Created default user (${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
