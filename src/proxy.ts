import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const tenantId =
    request.headers.get("x-tenant-id") ??
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ??
    "demo-tenant";

  requestHeaders.set("x-tenant-id", tenantId);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
