import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_TIMEOUT_MS = 3000; // 3 second timeout for auth checks

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth for API routes to avoid blocking
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Protected routes - redirect to login if not authenticated
    const protectedRoutes = ["/watchlist", "/portfolio"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      const result = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

      if (!result?.data?.user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.warn("Middleware auth check failed:", error);
    // Continue without auth on error
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
