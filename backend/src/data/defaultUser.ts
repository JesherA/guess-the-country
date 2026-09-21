import { prisma } from "../prisma.js";

// Single-player app for now: every game attaches to the one seeded user.
let cachedUserId: string | undefined;

export async function getDefaultUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.findFirstOrThrow();
  cachedUserId = user.id;
  return cachedUserId;
}
