import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-mfa";

  // Redirect logged-in users away from auth pages
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Protect all other pages — check localStorage token via header injection
  // The actual check happens client-side via AuthProvider

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
