"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface Props {
  defaultValue?: string;
}

export default function SearchBox({ defaultValue = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("type"); // reset type filter on new search
      startTransition(() => router.push(`/search?${params.toString()}`));
    },
    [router, searchParams]
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full" dir="rtl">
      <div className="relative flex items-center">
        <input
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="ابحث عن أخبار الذكاء الاصطناعي، الأدوات، والأدلة..."
          autoFocus
          autoComplete="off"
          className="w-full rounded-2xl border border-white/10 bg-white/4 py-4 pr-5 pl-14 text-base text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:bg-white/6 focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-60"
          aria-label="بحث"
        >
          {isPending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
