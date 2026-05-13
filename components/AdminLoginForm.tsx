"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState("");
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: process.env.NODE_ENV === "development" ? "admin@aiscope.local" : "",
      password: process.env.NODE_ENV === "development" ? "admin123456" : "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setFormError("");

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setFormError("بيانات الدخول غير صحيحة");
      return;
    }

    router.push(result.url ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#667eea]"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          dir="ltr"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#667eea]"
          {...register("password")}
        />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {formError && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="gradient-primary w-full rounded-2xl px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </button>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p>بيانات التطوير الافتراضية:</p>
        <p dir="ltr">admin@aiscope.local / admin123456</p>
      </div>
    </form>
  );
}
