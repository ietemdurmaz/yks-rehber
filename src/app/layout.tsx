import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { pageRow, parseRows } from "@/lib/models";
import "./globals.css";

export const metadata: Metadata = {
  title: "ibolas",
  description: "Yükseköğretim tercihleri için bölüm, konaklama, iş ve yaşam gideri bilgileri.",
};

export const dynamic = "force-dynamic";

async function loadPages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_pages").select("slug, title, body").order("title");
  if (error) return [];
  return parseRows(pageRow, data);
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pages = await loadPages();
  return (
    <html lang="tr">
      <body>
        <header className="site-header">
          <Link href="/">ibolas</Link>
        </header>
        {children}
        <footer className="site-footer">
          {pages.length > 0 ? (
            <ul>
              {pages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/sayfa/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div>ibolas</div>
        </footer>
      </body>
    </html>
  );
}
