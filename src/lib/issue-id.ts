import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function nextIssueId(tx: TxClient, teamId: string) {
  const team = await tx.team.update({
    where: { id: teamId },
    data: { issueCounter: { increment: 1 } },
  });
  return { id: `${team.identifier}-${team.issueCounter}`, number: team.issueCounter };
}

export type { Prisma };
