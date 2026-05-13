import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white" dir="rtl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl"
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
            >
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white" />
              <div className="absolute bottom-3 left-3 h-4 w-4 rounded-full border-2 border-white" />
            </div>

            <div>
              <h1 className="text-gradient text-2xl font-black">AI Scope</h1>
              <p className="text-xs text-gray-500">نطاق الذكاء</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="font-medium text-gray-700 hover:text-[#667eea]">
              الرئيسية
            </Link>
            <Link href="/category/ai-models" className="font-medium text-gray-700 hover:text-[#667eea]">
              نماذج AI
            </Link>
            <Link href="/category/research" className="font-medium text-gray-700 hover:text-[#667eea]">
              البحوث
            </Link>
            <Link href="/category/companies" className="font-medium text-gray-700 hover:text-[#667eea]">
              الشركات
            </Link>
            <Link href="/about" className="font-medium text-gray-700 hover:text-[#667eea]">
              من نحن
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-1 font-medium text-gray-700 hover:text-[#667eea]"
              aria-label="بحث"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              بحث
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
