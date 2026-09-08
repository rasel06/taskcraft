/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const adminRole = await prisma.workspaceRole.create({
    data: {
      name: "Admin",
      isSystem: true,
      permissions: "manage_members,manage_roles,manage_teams,delete_issues,view_all_teams",
    },
  });
  const memberRole = await prisma.workspaceRole.create({
    data: { name: "Member", isSystem: true, permissions: "" },
  });

  const [alice, bob, carol, dave] = await Promise.all([
    prisma.user.create({ data: { name: "Alice Rahman", email: "alice@taskcraft.dev", bankId: "BNK-1001", fileNumber: "FN-1001", mobile: "+8801700000001", passwordHash, roleId: adminRole.id } }),
    prisma.user.create({ data: { name: "Bob Islam", email: "bob@taskcraft.dev", bankId: "BNK-1002", fileNumber: "FN-1002", mobile: "+8801700000002", passwordHash, roleId: memberRole.id } }),
    prisma.user.create({ data: { name: "Carol Ahmed", email: "carol@taskcraft.dev", bankId: "BNK-1003", fileNumber: "FN-1003", mobile: "+8801700000003", passwordHash, roleId: memberRole.id } }),
    prisma.user.create({ data: { name: "Dave Khan", email: "dave@taskcraft.dev", bankId: "BNK-1004", fileNumber: "FN-1004", mobile: "+8801700000004", passwordHash, roleId: memberRole.id } }),
  ]);

  const frontend = await prisma.team.create({
    data: {
      name: "Frontend",
      identifier: "FRO",
      timezone: "GMT+6:00 - Bangladesh Standard Time",
      isPrivate: false,
      icon: "Layers",
      leadId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
          { userId: carol.id, role: "MEMBER" },
        ],
      },
    },
  });

  const platform = await prisma.team.create({
    data: {
      name: "Platform",
      identifier: "PLT",
      timezone: "GMT+6:00 - Bangladesh Standard Time",
      isPrivate: true,
      icon: "Cpu",
      leadId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: dave.id, role: "MEMBER" },
        ],
      },
    },
  });

  const website = await prisma.project.create({
    data: {
      name: "Marketing Website Revamp",
      description: "Rebuild the marketing site with a faster, more accessible design system.",
      status: "Active",
      priority: "High",
      leadId: alice.id,
      teamId: frontend.id,
      startDate: new Date("2026-08-01"),
      targetDate: new Date("2026-10-15"),
      isDraft: false,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
          { userId: carol.id, role: "MEMBER" },
        ],
      },
      milestones: {
        create: [
          { name: "Design system", description: "Finalize tokens and components" },
          { name: "Beta launch", description: "Ship to 10% of traffic" },
        ],
      },
    },
  });

  const mobileApp = await prisma.project.create({
    data: {
      name: "Mobile App Polish",
      description: "Fix rough edges ahead of the next store release.",
      status: "Planned",
      priority: "Medium",
      leadId: bob.id,
      teamId: frontend.id,
      startDate: new Date("2026-09-15"),
      targetDate: new Date("2026-11-01"),
      isDraft: false,
      members: { create: [{ userId: bob.id, role: "ADMIN" }, { userId: carol.id, role: "MEMBER" }] },
    },
  });

  const infra = await prisma.project.create({
    data: {
      name: "Internal Deploy Pipeline",
      description: "Private infrastructure work only Platform team should see.",
      status: "Active",
      priority: "Urgent",
      leadId: dave.id,
      teamId: platform.id,
      startDate: new Date("2026-08-10"),
      targetDate: new Date("2026-09-30"),
      isDraft: false,
      members: { create: [{ userId: alice.id, role: "ADMIN" }, { userId: dave.id, role: "MEMBER" }] },
      milestones: { create: [{ name: "CI cutover", description: "Move all repos to the new runners" }] },
    },
  });

  const issueSeeds = [
    { team: frontend, project: website, title: "Set up design tokens in Tailwind config", status: "Done", priority: "High", assignee: alice.id, creator: alice.id },
    { team: frontend, project: website, title: "Build responsive nav header", status: "In Progress", priority: "High", assignee: bob.id, creator: alice.id },
    { team: frontend, project: website, title: "Audit color contrast for accessibility", status: "Todo", priority: "Medium", assignee: carol.id, creator: alice.id },
    { team: frontend, project: website, title: "Migrate blog to MDX", status: "Backlog", priority: "Low", assignee: null, creator: bob.id },
    { team: frontend, project: mobileApp, title: "Fix keyboard overlap on iOS forms", status: "Todo", priority: "High", assignee: bob.id, creator: bob.id },
    { team: frontend, project: mobileApp, title: "Reduce cold start time", status: "Backlog", priority: "Medium", assignee: carol.id, creator: bob.id },
    { team: platform, project: infra, title: "Move build cache to shared runner", status: "In Progress", priority: "Urgent", assignee: dave.id, creator: dave.id },
    { team: platform, project: infra, title: "Rotate deploy signing keys", status: "Todo", priority: "High", assignee: alice.id, creator: dave.id },
  ];

  for (const seed of issueSeeds) {
    const team = await prisma.team.update({
      where: { id: seed.team.id },
      data: { issueCounter: { increment: 1 } },
    });
    await prisma.issue.create({
      data: {
        id: `${team.identifier}-${team.issueCounter}`,
        number: team.issueCounter,
        title: seed.title,
        status: seed.status,
        priority: seed.priority,
        assigneeId: seed.assignee,
        creatorId: seed.creator,
        projectId: seed.project.id,
        labels: "",
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Users: Alice (admin), Bob, Carol, Dave - all password: ${DEMO_PASSWORD}`);
  console.log(`  Teams: Frontend (FRO, public), Platform (PLT, private - Alice & Dave only)`);
  console.log(`  Projects: ${website.name}, ${mobileApp.name}, ${infra.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
