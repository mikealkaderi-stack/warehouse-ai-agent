import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims verifies the JWT; getSession alone must not be trusted for access checks.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const allowedEmail = process.env.APP_ALLOWED_EMAIL?.trim().toLowerCase();
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : "";
  const isAllowed = Boolean(claims?.sub && allowedEmail && email === allowedEmail);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!isAllowed && !isLogin) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAllowed && isLogin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
