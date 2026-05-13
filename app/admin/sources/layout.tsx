import { ToastProvider } from "@/components/ui/toast";

export default function SourcesLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
