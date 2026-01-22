import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";

// Verify OTP
export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otpCodes: {
          where: {
            used: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    if (user.otpCodes.length === 0) {
      return NextResponse.json({ error: "No valid OTP found. Please request a new one." }, { status: 400 });
    }

    const otpRecord = user.otpCodes[0];
    const isValid = await bcrypt.compare(otp, otpRecord.code);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Clean up old OTPs
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        id: { not: otpRecord.id },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Email verified successfully! You can now login." 
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

// Resend OTP
export async function PATCH(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otpCodes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Check if last OTP was sent less than 60 seconds ago
    if (user.otpCodes.length > 0) {
      const lastOtp = user.otpCodes[0];
      const secondsSinceLastOtp = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
      
      if (secondsSinceLastOtp < 60) {
        const waitTime = Math.ceil(60 - secondsSinceLastOtp);
        return NextResponse.json({ 
          error: `Please wait ${waitTime} seconds before requesting a new code` 
        }, { status: 429 });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store new OTP
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: hashedOtp,
        expiresAt,
        used: false,
      },
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name || undefined);

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "New verification code sent to your email" 
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Failed to resend code" }, { status: 500 });
  }
}
