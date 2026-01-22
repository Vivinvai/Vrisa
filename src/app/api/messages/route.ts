import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const MESSAGE_LIMIT = 100;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const otherUserId = url.searchParams.get("userId");

  if (!otherUserId) {
    return NextResponse.json({ error: "userId query parameter required" }, { status: 400 });
  }

  console.log(`Fetching messages between ${session.user.id} and ${otherUserId}`);

  // Fetch messages between current user and other user
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
      deleted: false, // Don't fetch deleted messages
    },
    orderBy: { createdAt: "asc" },
    take: MESSAGE_LIMIT,
    include: {
      sender: {
        select: { id: true, email: true, name: true },
      },
      receiver: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  console.log(`Found ${messages.length} messages`);
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { receiverId, ciphertext, iv, messageType, fileName, fileSize, fileUrl } = await request.json();

    if (!receiverId || !ciphertext || !iv) {
      return NextResponse.json({ error: "receiverId, ciphertext, and iv are required" }, { status: 400 });
    }

    console.log(`Creating message from ${session.user.id} to ${receiverId}, type: ${messageType || 'text'}`);

    // Set message expiration to 2 years from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
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
          select: { id: true, email: true, name: true },
        },
        receiver: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    console.log(`Message created successfully: ${message.id}`);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Failed to save message:", error);
    return NextResponse.json({ error: "Unable to store message" }, { status: 500 });
  }
}
