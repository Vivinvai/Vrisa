import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const MESSAGE_LIMIT = 100;

// Get group messages
export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Verify user is a member
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const messages = await prisma.groupMessage.findMany({
    where: {
      groupId,
      deleted: false,
    },
    orderBy: { createdAt: "asc" },
    take: MESSAGE_LIMIT,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      },
    },
  });

  console.log(`Fetched ${messages.length} messages for group ${groupId}`);
  return NextResponse.json(messages);
}

// Send group message
export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Verify user is a member
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  try {
    const { ciphertext, iv, messageType, fileName, fileSize, fileUrl } = await request.json();

    if (!ciphertext || !iv) {
      return NextResponse.json({ error: "ciphertext and iv are required" }, { status: 400 });
    }

    // Set message expiration to 2 years
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);

    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: session.user.id,
        ciphertext,
        iv,
        messageType: messageType || "text",
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileUrl: fileUrl || null,
        expiresAt,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    console.log(`Group message created: ${message.id} in group ${groupId}`);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Failed to create group message:", error);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
