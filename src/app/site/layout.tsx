import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white transition-colors duration-300">
      
      <Header />

      <main className="flex-grow pt-32">
        {children}
      </main>

      <Footer />
    </div>
  );
}