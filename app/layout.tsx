import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { isAuthenticated, getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Atmiya - Personal Finance Manager",
  description: "Manage your personal finances, track expenses, and investments",
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }
  ],
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();
  const user = authenticated ? await getAuthenticatedUser() : null;

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {authenticated && user ? (
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header userName={user.email} userEmail={user.email} />
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

