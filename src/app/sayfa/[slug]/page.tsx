import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pageRow, parseRows } from "@/lib/models";

const paramsSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/) });

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_pages")
    .select("slug, title, body")
    .eq("slug", parsed.data.slug)
    .limit(1);
  if (error) throw new Error("Sayfa alınamadı.");

  const page = parseRows(pageRow, data)[0];
  if (!page) notFound();

  return (
    <div className="container">
      <div className="section">
        <h1>{page.title}</h1>
        {page.body.split(/\n{2,}/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
