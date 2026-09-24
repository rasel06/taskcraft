import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { LOGIN_ERRORS, type LoginErrorCode } from "@/lib/login-errors";

const HOME_PATH = "/inbox";

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

// The login form submits with fetch and asks for JSON; a plain form POST (no
// JavaScript) gets redirects instead, so both paths show a proper message
// rather than a raw API response.
function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function fail(request: Request, code: LoginErrorCode, status: number) {
  if (wantsJson(request)) {
    return NextResponse.json({ error: LOGIN_ERRORS[code], code }, { status });
  }
  return NextResponse.redirect(new URL(`/login?error=${code}`, getAppUrl()), 303);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return fail(request, "missing_fields", 400);
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Same response for an unknown email and a wrong password, so the form
    // doesn't reveal which accounts exist.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail(request, "invalid_credentials", 401);
    }

    const session = await createSession(user.id);

    const response = wantsJson(request)
      ? NextResponse.json({ redirectTo: HOME_PATH })
      : NextResponse.redirect(new URL(HOME_PATH, getAppUrl()), 303);

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

    return fail(request, "server_error", 500);
  }
}
