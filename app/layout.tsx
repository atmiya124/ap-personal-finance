import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Atmiya - Personal Finance Manager",
  description: "Manage your personal finances, track expenses, and investments",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {authenticated ? (
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header userName="Atmiya" userEmail="atmiyapatel024@gmail.com" />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
            <Toaster />
          </div>
        ) : (
          <>
            {children}
            <Toaster />
          </>
        )}
      </body>
    </html>
  );
}

