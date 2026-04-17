import { prisma } from "@/server/db/client";

export async function listOrganizationsForUser(userId: string) {
  return prisma.organization.findMany({
    where: {
      memberships: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}
