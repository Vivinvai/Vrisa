import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// GET all connections (pending, accepted)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "accepted";

  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { requesterId: session.user.id },
        { addresseeId: session.user.id },
      ],
      status,
    },
    include: {
      requester: {
        select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
      },
      addressee: {
        select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

// POST create new connection request
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { addresseeId } = await request.json();

    if (!addresseeId) {
      return NextResponse.json({ error: "addresseeId required" }, { status: 400 });
    }

    if (addresseeId === session.user.id) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
    }

    // Check if connection already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: session.user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Connection already exists", connection: existing }, { status: 409 });
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: session.user.id,
        addresseeId,
        status: "pending",
      },
      include: {
        requester: {
          select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Failed to create connection", error);
    return NextResponse.json({ error: "Unable to create connection" }, { status: 500 });
  }
}

// PATCH update connection status (accept/reject)
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { connectionId, status } = await request.json();

    if (!connectionId || !status) {
      return NextResponse.json({ error: "connectionId and status required" }, { status: 400 });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Only addressee can accept/reject
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (connection.addresseeId !== session.user.id) {
      return NextResponse.json({ error: "Only the addressee can update this connection" }, { status: 403 });
    }

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
      include: {
        requester: {
          select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
        },
        addressee: {
          select: { id: true, email: true, name: true, uniqueId: true, profilePicture: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update connection", error);
    return NextResponse.json({ error: "Unable to update connection" }, { status: 500 });
  }
}
