import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicKey, encryptedPrivateKey } = await request.json();

    if (!publicKey || !encryptedPrivateKey) {
      return NextResponse.json({ error: "Keys required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        publicKey,
        encryptedPrivateKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Key storage error:", error);
    return NextResponse.json({ error: "Failed to store keys" }, { status: 500 });
  }
}
