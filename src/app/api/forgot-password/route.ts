import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({ 
        message: "If an account with that email exists, we've sent a password reset code." 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: otp,
        resetTokenExpiry: expiresAt,
      },
    });

    // Send OTP email
    await sendOTPEmail(email, otp, "password reset");

    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset code.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
