import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting seed...");

  const existingFight = await prisma.fight.findFirst({
    where: {
      title: "Sedo vs Johnny",
    },
  });

  if (existingFight) {
    console.log("Fight already exists.");
    return;
  }

  const fight = await prisma.fight.create({
    data: {
      title: "Sedo vs Johnny",
      description:
        "MMA prediction match between Sedo and Johnny.",

      fighterAName: "Sedo",
      fighterBName: "Johnny",

      fighterAProbability: 35,
      fighterBProbability: 65,

      status: "UPCOMING",

      scheduledAt: new Date("2026-08-30T18:00:00+03:00"),
    },
  });

  console.log("Fight created:");
  console.log(fight);
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });