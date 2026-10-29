import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { username, email, password, displayName } = await req.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    let welcomeEmailSent = false;
    try {
      welcomeEmailSent = await sendWelcomeEmail(
        newUser.email,
        typeof displayName === "string"
          ? displayName
          : typeof username === "string"
            ? username
            : ""
      );
    } catch (emailError) {
      console.error("Welcome email delivery failed", {
        code:
          typeof emailError === "object" &&
          emailError !== null &&
          "code" in emailError
            ? emailError.code
            : undefined,
      });
    }

    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email }, 
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      jwt: token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
      },
      welcomeEmailSent,
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
