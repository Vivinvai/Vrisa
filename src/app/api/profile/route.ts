import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

// Get current user profile
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      uniqueId: true,
      email: true,
      name: true,
      bio: true,
      profilePicture: true,
      dateOfBirth: true,
      gender: true,
      hobby: true,
      interests: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// Update user profile
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, bio, profilePicture, hobby, interests, dateOfBirth, gender } = await request.json();

    // Get current user to check if DOB/Gender are already set
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dateOfBirth: true, gender: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Allow DOB/Gender to be set ONLY if they are currently null
    const canSetDateOfBirth = !currentUser.dateOfBirth && dateOfBirth;
    const canSetGender = !currentUser.gender && gender;

    // Validate age if setting DOB
    if (canSetDateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (actualAge < 13) {
        return NextResponse.json({ error: "Must be at least 13 years old" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(hobby !== undefined && { hobby }),
        ...(interests !== undefined && { interests }),
        ...(canSetDateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(canSetGender && { gender }),
      },
      select: {
        id: true,
        uniqueId: true,
        email: true,
        name: true,
        bio: true,
        profilePicture: true,
        dateOfBirth: true,
        gender: true,
        hobby: true,
        interests: true,
        isOnline: true,
        lastSeen: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
