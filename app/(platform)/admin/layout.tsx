import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/current-admin";
import s from "./admin.module.css";

/**
 * Admin route shell. Gated server-side on is_admin() (defense in depth — the
 * proxy is the coarse first gate, this is the authoritative one). A non-admin
 * who somehow reaches here is bounced to "/". No tenant-portal chrome — admin
 * is not a tenant role.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/");

  return (
    <div className={s.shell}>
      <header className={s.topbar}>
        <span className={s.brand}>EvntCue</span>
        <span className={s.adminTag}>Admin</span>
      </header>
      <main className={s.main}>{children}</main>
    </div>
  );
}
