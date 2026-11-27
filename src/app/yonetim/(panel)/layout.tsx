import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminUser } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div className="admin">
      <nav aria-label="Yönetim menüsü">
        <p className="muted">{user.fullName}<br />{user.role === "super_admin" ? "Üst yönetici" : "Kurum yöneticisi"}</p>
        <Link href="/yonetim">Genel durum</Link>
        <Link href="/yonetim/sehirler">Şehirler</Link>
        <Link href="/yonetim/universiteler">Üniversiteler</Link>
        <Link href="/yonetim/denetim">Denetim kayıtları</Link>
        <form action={logoutAction}>
          <button type="submit" className="secondary">Çıkış yap</button>
        </form>
      </nav>
      <main>{children}</main>
    </div>
  );
}
