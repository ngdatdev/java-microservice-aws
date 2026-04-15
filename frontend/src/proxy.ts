import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const cookieToken = request.cookies.get("auth_token")?.value;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Redirect logged-in users away from auth pages
  if (cookieToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect all other pages — require cookie token
  if (!cookieToken && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
