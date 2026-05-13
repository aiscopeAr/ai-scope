import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">AI Scope</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              منصة عربية متخصصة في أخبار الذكاء الاصطناعي
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-[#667eea]">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-[#667eea]">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-[#667eea]">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">التصنيفات</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/category/ai-models" className="text-sm text-gray-600 hover:text-[#667eea]">
                  نماذج AI
                </Link>
              </li>
              <li>
                <Link href="/category/research" className="text-sm text-gray-600 hover:text-[#667eea]">
                  البحوث
                </Link>
              </li>
              <li>
                <Link href="/category/companies" className="text-sm text-gray-600 hover:text-[#667eea]">
                  الشركات
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">قانوني</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-[#667eea]">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-[#667eea]">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>© 2026 AI Scope - نطاق الذكاء الاصطناعي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
