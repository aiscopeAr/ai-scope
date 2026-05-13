import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/AdminLoginForm";
import { auth } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await auth();

  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <section
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbe4ff,transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef2ff_100%)] px-4 py-10"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#667eea] shadow-sm">
            لوحة الإدارة
          </p>
          <h1 className="mb-3 text-4xl font-black text-slate-900">تسجيل دخول المشرف</h1>
          <p className="text-slate-600">ادخل إلى لوحة التحكم لإدارة الأخبار والتصنيفات والإعدادات.</p>
        </div>

        <AdminLoginForm />
      </div>
    </section>
  );
}
