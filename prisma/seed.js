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
      permissions: "manage_members,manage_roles,manage_teams,delete_issues,view_all_teams,view_audit_log",
    },
  });
  const memberRole = await prisma.workspaceRole.create({
    data: { name: "Member", isSystem: true, permissions: "" },
  });

  const [alice, bob, carol, dave] = await Promise.all([

    prisma.user.create({
      data: {
        name: "Md. Imran Hasan",
        email: "imran@janatabank-bd.com",
        bankId: "021722",
        fileNumber: "PO-6487",
        mobile: "+8801571769980", passwordHash, roleId: adminRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Raseduz Zaman Rasel",
        email: "rasel@janatabank-bd.com",
        bankId: "021794",
        fileNumber: "PO(Com)-6786",
        mobile: "+8801716620062", passwordHash, roleId: adminRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Avijit Saha",
        email: "saha.avijit@janatabank-bd.com",
        bankId: "024582",
        fileNumber: "SO(com)-15857",
        mobile: "+8801715731066", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Shahnewaz Mahmud",
        email: "piaash@janatabank-bd.com",
        bankId: "026287",
        fileNumber: "So-Com 14093",
        mobile: "+8801534124876", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Shahadat Hossain",
        email: "shahadat.hossain@janatabank-bd.com",
        bankId: "026364",
        fileNumber: "SO(Com)-14185",
        mobile: "+8801551807064", passwordHash, roleId: memberRole.id
      }
    }),



    prisma.user.create({
      data: {
        name: "Mithun Kumer Ghose",
        email: "mithun_ghose@janatabank-bd.com",
        bankId: "028112",
        fileNumber: "SO(com)-14833",
        mobile: "+8801632182206", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Hadiuzzaman Bappy",
        email: "hbappy79@janatabank-bd.com",
        bankId: "028459",
        fileNumber: "SO(com)-15090",
        mobile: "+8801521318670", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Md. Maruf Hossain",
        email: "maruficepustian@gmail.com",
        bankId: "032990",
        fileNumber: "SO(Com)-16488",
        mobile: "+8801868089868", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Md. Minhajul Habib Mobin",
        email: "mdminhajulhabib2000@gmail.com",
        bankId: "034002",
        fileNumber: "O(IT)-14980",
        mobile: "+8801874076622", passwordHash, roleId: memberRole.id
      }
    }),

    prisma.user.create({
      data: {
        name: "Sifatur Rahman Sifat",
        email: "shifaturrahman390@gmail.com",
        bankId: "034253",
        fileNumber: "SO(Com)-",
        mobile: "+8801986800766", passwordHash, roleId: memberRole.id
      }
    })

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

  const core = await prisma.team.create({
    data: {
      name: "Core",
      identifier: "COR",
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

  // const website = await prisma.project.create({
  //   data: {
  //     name: "Marketing Website Revamp",
  //     description: "Rebuild the marketing site with a faster, more accessible design system.",
  //     status: "Active",
  //     priority: "High",
  //     leadId: alice.id,
  //     teamId: frontend.id,
  //     startDate: new Date("2026-08-01"),
  //     targetDate: new Date("2026-10-15"),
  //     isDraft: false,
  //     members: {
  //       create: [
  //         { userId: alice.id, role: "ADMIN" },
  //         { userId: bob.id, role: "MEMBER" },
  //         { userId: carol.id, role: "MEMBER" },
  //       ],
  //     },
  //     milestones: {
  //       create: [
  //         { name: "Design system", description: "Finalize tokens and components" },
  //         { name: "Beta launch", description: "Ship to 10% of traffic" },
  //       ],
  //     },
  //   },
  // });

  // const mobileApp = await prisma.project.create({
  //   data: {
  //     name: "Mobile App Polish",
  //     description: "Fix rough edges ahead of the next store release.",
  //     status: "Planned",
  //     priority: "Medium",
  //     leadId: bob.id,
  //     teamId: frontend.id,
  //     startDate: new Date("2026-09-15"),
  //     targetDate: new Date("2026-11-01"),
  //     isDraft: false,
  //     members: { create: [{ userId: bob.id, role: "ADMIN" }, { userId: carol.id, role: "MEMBER" }] },
  //   },
  // });

  // const infra = await prisma.project.create({
  //   data: {
  //     name: "Internal Deploy Pipeline",
  //     description: "Private infrastructure work only Platform team should see.",
  //     status: "Active",
  //     priority: "Urgent",
  //     leadId: dave.id,
  //     teamId: platform.id,
  //     startDate: new Date("2026-08-10"),
  //     targetDate: new Date("2026-09-30"),
  //     isDraft: false,
  //     members: { create: [{ userId: alice.id, role: "ADMIN" }, { userId: dave.id, role: "MEMBER" }] },
  //     milestones: { create: [{ name: "CI cutover", description: "Move all repos to the new runners" }] },
  //   },
  // });

  // const issueSeeds = [
  //   { team: frontend, project: website, title: "Set up design tokens in Tailwind config", status: "Done", priority: "High", assignee: alice.id, creator: alice.id },
  //   { team: frontend, project: website, title: "Build responsive nav header", status: "In Progress", priority: "High", assignee: bob.id, creator: alice.id },
  //   { team: frontend, project: website, title: "Audit color contrast for accessibility", status: "Todo", priority: "Medium", assignee: carol.id, creator: alice.id },
  //   { team: frontend, project: website, title: "Migrate blog to MDX", status: "Backlog", priority: "Low", assignee: null, creator: bob.id },
  //   { team: frontend, project: mobileApp, title: "Fix keyboard overlap on iOS forms", status: "Todo", priority: "High", assignee: bob.id, creator: bob.id },
  //   { team: frontend, project: mobileApp, title: "Reduce cold start time", status: "Backlog", priority: "Medium", assignee: carol.id, creator: bob.id },
  //   { team: platform, project: infra, title: "Move build cache to shared runner", status: "In Progress", priority: "Urgent", assignee: dave.id, creator: dave.id },
  //   { team: platform, project: infra, title: "Rotate deploy signing keys", status: "Todo", priority: "High", assignee: alice.id, creator: dave.id },
  // ];

  // for (const seed of issueSeeds) {
  //   const team = await prisma.team.update({
  //     where: { id: seed.team.id },
  //     data: { issueCounter: { increment: 1 } },
  //   });
  //   await prisma.issue.create({
  //     data: {
  //       id: `${team.identifier}-${team.issueCounter}`,
  //       number: team.issueCounter,
  //       title: seed.title,
  //       status: seed.status,
  //       priority: seed.priority,
  //       assigneeId: seed.assignee,
  //       creatorId: seed.creator,
  //       projectId: seed.project.id,
  //       labels: "",
  //     },
  //   });
  // }

  console.log("Seed complete:");
  console.log(`  Users: Alice (admin), Bob, Carol, Dave - all password: ${DEMO_PASSWORD}`);
  console.log(`  Teams: Frontend (FRO, public), Platform (PLT, private - Alice & Dave only)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
