import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { Colors } from '@/constants/theme';

/**
 * The HTML shell for the web version. It is rendered once at build time for every
 * page, so it cannot use anything that only exists in a browser.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Log what you eat and track your weight." />
        <meta name="theme-color" content={Colors.ground} />
        <ScrollViewStyleReset />
        {/* Paint the app's background straight away, before any script has run. */}
        <style dangerouslySetInnerHTML={{ __html: `body{background-color:${Colors.ground};}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
