import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `شركات الذكاء الاصطناعي الكبرى | ${SITE_NAME_AR}`,
  description: "دليل أبرز شركات الذكاء الاصطناعي في العالم — OpenAI وGoogle DeepMind وAnthropic وMeta AI والمزيد. نظرة شاملة على نماذجها وإنجازاتها.",
  alternates: { canonical: absoluteUrl("/companies") },
  openGraph: {
    title: `شركات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: "أبرز شركات AI في العالم — نظرة شاملة بالعربية",
    locale: "ar_AR",
    type: "website",
  },
};

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    where: { published: true },
    orderBy: { viewCount: "desc" },
  }).catch(() => []);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-1/3 h-80 w-80 rounded-full bg-sky-600/10 blur-3xl animate-blob" />
          <div className="absolute top-10 left-1/4 h-64 w-64 rounded-full bg-violet-600/8 blur-3xl animate-blob" style={{ animationDelay: "2.5s" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 text-center relative animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-5 py-2">
            <span className="text-sky-400">🏢</span>
            <span className="text-sm font-semibold text-sky-300">{companies.length} شركة رائدة</span>
          </div>
          <h1 className="mb-4 text-5xl font-black md:text-6xl">
            شركات <span className="text-gradient">الذكاء الاصطناعي</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            أبرز الشركات التي تصنع مستقبل الذكاء الاصطناعي — نماذجها وإنجازاتها وتأثيرها
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        <AdSlot position="companies-top" className="mb-10" />

        {companies.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mb-4 text-5xl">🏢</div>
            <p className="text-lg font-semibold">قريباً — جاري إضافة ملفات الشركات</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 card-hover hover:border-sky-500/30 transition"
              >
                <div className="mb-4 flex items-center gap-3">
                  {company.logoUrl ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <Image src={company.logoUrl} alt={company.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-xl font-black text-sky-400">
                      {company.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                      {company.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {company.country && <span>{company.country}</span>}
                      {company.founded && <span>• تأسست {company.founded}</span>}
                    </div>
                  </div>
                </div>

                <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-3">{company.descriptionAr}</p>

                {company.notableModels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
                    {company.notableModels.slice(0, 3).map((m) => (
                      <span key={m} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">{m}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
