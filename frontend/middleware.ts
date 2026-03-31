// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // don't protect auth and static routes
  const pathname = req.nextUrl.pathname;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Check NextAuth token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'secret',
  });
  console.log(token, 'token')
  if (!token) {
    // Redirect to your login page
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (token && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // allowed
  return NextResponse.next();
}

export const config = {
  matcher: ["/create-interview/:path*", "/interview/:path*", '/dashboard/:path*', '/reports/:path*'],
};
