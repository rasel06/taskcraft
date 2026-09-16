import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";

function isSecureCookieEnabled() {
  return process.env.SESSION_COOKIE_SECURE === "true";
}

function getAppUrl() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured");
  }

  return appUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password",
        },
        {
          status: 401,
        },
      );
    }

    const valid = await verifyPassword(
      password,
      user.passwordHash,
    );

    if (!valid) {
      return NextResponse.json(
        {
          error: "Invalid email or password",
        },
        {
          status: 401,
        },
      );
    }

    const session = await createSession(user.id);

    const response = NextResponse.redirect(
      new URL("/inbox", getAppUrl()),
      303,
    );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.id,
      httpOnly: true,
      secure: isSecureCookieEnabled(),
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        error: "Unable to sign in",
      },
      {
        status: 500,
      },
    );
  }
}
