import type { Metadata } from 'next';
// Removed GeistSans import as it was causing a 'Module not found' error
// import { GeistSans } from 'geist/font/sans';
// Removed GeistMono import as it was causing a 'Module not found' error
// import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

// Removed geistSans assignment
// const geistSans = GeistSans;
// Removed geistMono assignment
// const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'ShiftMaster - Schedule Management', // Already in English
  description: 'Efficiently manage and visualize work shifts.', // Already in English
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
           // Removed GeistSans font variable
           // geistSans.variable
           // Removed GeistMono variable
           // geistMono.variable
        )}
       >
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
