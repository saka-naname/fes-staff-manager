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
  const res = NextResponse.next();
  const csrfError = await csrfProtect(req, res);
  if (csrfError) {
    return new NextResponse("Invalid csrf token", {
      status: 403,
    });
  }

  return res;
}
