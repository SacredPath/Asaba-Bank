// pages/_app.tsx
import { useState } from 'react';
import type { AppProps } from 'next/app';
import '@/styles/globals.css'; // Assuming your global styles import

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
