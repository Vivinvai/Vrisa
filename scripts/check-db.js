import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  try {
    const tables = await db.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='Message'",
    );
    const messageCount = await db.message.count();
    console.log({ tables, messageCount });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
