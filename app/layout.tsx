'use client';

import type React from "react";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { baseSepolia } from 'viem/chains';
import { createConfig, WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import {config} from '../lib/wagmi'
const queryClient = new QueryClient();
const poppins = Poppins({ subsets: ["latin"], weight: "400" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        {/* Uncomment ThemeProvider if needed */}
        {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange> */}
          
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <OnchainKitProvider
              chain={baseSepolia}
              appName="Your App"
              appIcon="/favicon.ico"
            >
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </OnchainKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}