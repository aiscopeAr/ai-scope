import { ToastProvider } from "@/components/ui/toast";

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
