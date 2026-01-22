import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Get group details
export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Check if user is a member
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const group = await prisma.groupChat.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              uniqueId: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(group);
}

// Update group details
export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Check if user is admin
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
      role: "admin",
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Only admins can update group" }, { status: 403 });
  }

  try {
    const { name, description, groupPicture } = await request.json();

    const updated = await prisma.groupChat.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(groupPicture !== undefined && { groupPicture }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update group:", error);
    return NextResponse.json({ error: "Unable to update group" }, { status: 500 });
  }
}

// Delete group (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Check if user is admin
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
      role: "admin",
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Only admins can delete group" }, { status: 403 });
  }

  try {
    await prisma.groupChat.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group:", error);
    return NextResponse.json({ error: "Unable to delete group" }, { status: 500 });
  }
}
