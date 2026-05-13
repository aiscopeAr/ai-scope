import { ToastProvider } from "@/components/ui/toast";

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
