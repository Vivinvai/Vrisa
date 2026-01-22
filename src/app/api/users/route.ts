import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    select: {
      id: true,
      email: true,
      name: true,
      publicKey: true,
      profilePicture: true,
      uniqueId: true,
      bio: true,
    },
    orderBy: { email: "asc" },
  });

  return NextResponse.json(users);
}
