import csrf from "edge-csrf";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const csrfProtect = csrf({
  cookie: {
    name: process.env.CSRF_SECRET,
    secure: process.env.NODE_ENV === "production",
  },
});

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const res = NextResponse.next();

  const csrfError = await csrfProtect(req, res);
  if (csrfError) {
    return new NextResponse("Invalid csrf token", {
      status: 403,
    });
  }

  if (url.pathname.startsWith("/reader")) {
    const basicAuth = req.headers.get("Authorization");

    if (basicAuth) {
      const authValue = basicAuth.split(" ")[1];
      const [user, pwd] = atob(authValue).split(":");

      if (
        user === process.env.BASIC_AUTH_NAME &&
        pwd === process.env.BASIC_AUTH_PASSWORD
      ) {
        return res;
      } else {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { headers: { "WWW-Authenticate": "Basic realm='Secure Area'" }, status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Please enter credentials" },
      { headers: { "WWW-Authenticate": "Basic realm='Secure Area'" }, status: 401 }
    );
  }

  return res;
}
