import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, password, name, dateOfBirth, gender } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (!dateOfBirth) {
      return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
    }

    if (!gender) {
      return NextResponse.json({ error: "Gender is required" }, { status: 400 });
    }

    // Strong password validation
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain an uppercase letter" }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a lowercase letter" }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a number" }, { status: 400 });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json({ error: "Password must contain a symbol (!@#$%^&*)" }, { status: 400 });
    }

    // Check if email is already registered - each email can only create ONE account
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ 
        error: "This email is already linked to an account. Each email can only be used once." 
      }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique ID (format: vrisa_xxxxxx)
    const generateUniqueId = async () => {
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let uniqueId = '';
      
      // Keep generating until we find a unique one
      while (true) {
        uniqueId = 'vrisa_';
        for (let i = 0; i < 8; i++) {
          uniqueId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        const existing = await prisma.user.findUnique({ where: { uniqueId } });
        if (!existing) break;
      }
      
      return uniqueId;
    };

    const uniqueId = await generateUniqueId();

    // Store a placeholder for keys - they'll be generated on first login
    const user = await prisma.user.create({
      data: {
        uniqueId,
        email,
        password: hashedPassword,
        name: name || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        publicKey: "",
        encryptedPrivateKey: "",
        emailVerified: false,
      },
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: hashedOtp,
        expiresAt,
        used: false,
      },
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // Don't fail registration, but log the error
    }

    return NextResponse.json({ 
      id: user.id, 
      email: user.email,
      message: "Account created! Please check your email for verification code.",
      requiresVerification: true
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
