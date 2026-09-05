import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <ScrollViewStyleReset />

        <title>CastLog</title>
        <meta name="description" content="Log your catches, follow other anglers, and climb the leaderboard." />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d1b14" />
        <meta name="background-color" content="#0d1b14" />

        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CastLog" />
        <meta name="mobile-web-app-capable" content="yes" />

        <style dangerouslySetInnerHTML={{ __html: `body { background-color: #0d1b14; }` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
