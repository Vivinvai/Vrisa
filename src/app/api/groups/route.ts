import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Get all groups user is a member of
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.groupChat.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(groups);
}

// Create a new group
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, groupPicture, memberIds } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "At least one member is required" }, { status: 400 });
    }

    // Create group with creator as admin and other members
    const group = await prisma.groupChat.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        groupPicture: groupPicture || null,
        createdById: session.user.id,
        members: {
          create: [
            {
              userId: session.user.id,
              role: "admin",
            },
            ...memberIds
              .filter((id: string) => id !== session.user.id)
              .map((userId: string) => ({
                userId,
                role: "member",
              })),
          ],
        },
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

    console.log(`Group created: ${group.id} by ${session.user.id}`);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Failed to create group:", error);
    return NextResponse.json({ error: "Unable to create group" }, { status: 500 });
  }
}
