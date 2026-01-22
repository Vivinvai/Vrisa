import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Add member to group (admin only)
export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = params;

  // Check if user is admin
  const adminCheck = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
      role: "admin",
    },
  });

  if (!adminCheck) {
    return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check if already a member
    const existing = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: "member",
      },
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
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to add member:", error);
    return NextResponse.json({ error: "Unable to add member" }, { status: 500 });
  }
}

// Remove member from group (admin only)
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
  const adminCheck = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId: session.user.id,
      role: "admin",
    },
  });

  if (!adminCheck) {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent removing the last admin
    const member = await prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (member?.role === "admin") {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: "admin" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin" },
          { status: 400 }
        );
      }
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json({ error: "Unable to remove member" }, { status: 500 });
  }
}
