import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Search user by unique ID
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uniqueId } = await request.json();

    if (!uniqueId || typeof uniqueId !== "string") {
      return NextResponse.json({ error: "uniqueId required" }, { status: 400 });
    }

    // Don't allow searching for yourself
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { uniqueId: true },
    });

    if (currentUser?.uniqueId === uniqueId) {
      return NextResponse.json({ error: "Cannot search for yourself" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { uniqueId: uniqueId.toLowerCase() },
      select: {
        id: true,
        uniqueId: true,
        name: true,
        bio: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: user.id },
          { requesterId: user.id, addresseeId: session.user.id },
        ],
      },
    });

    return NextResponse.json({
      user,
      connectionStatus: existingConnection?.status || null,
      connectionId: existingConnection?.id || null,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
