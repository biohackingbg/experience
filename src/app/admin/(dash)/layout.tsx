import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";

/**
 * The real gate for every page in this route group.
 *
 * `proxy.ts` only does a cheap optimistic redirect — the Next docs are explicit
 * that it must not be the sole authorization check — so the session is verified
 * here on the server before anything renders. The login route sits outside this
 * group, which is why it stays reachable while signed out.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  return <>{children}</>;
}
