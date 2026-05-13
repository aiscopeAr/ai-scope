import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AnalyticsProvider from "@/components/AnalyticsProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsProvider />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
