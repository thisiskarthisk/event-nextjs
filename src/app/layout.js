import { APP_NAME } from "@/constants";
import { cookies } from "next/headers";

import Script from "next/script";

import en from "@/i18n/en";
import hi from "@/i18n/hi";

import I18nProvider from "@/components/i18nProvider";
import AppLayout from "@/components/appLayout";

export const metadata = {
  title: APP_NAME,
};

const messages = {
  en, hi
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('language')?.value || 'en';
  const initialMessages = messages[locale] || messages.en;

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <link rel="stylesheet" href="/assets/css/apexcharts.css" />
        <link rel="stylesheet" href="/assets/mdi/css/materialdesignicons.min.css" />
        <link rel="stylesheet" href="/assets/css/jsvectormap.min.css" />
        <link rel="stylesheet" href="/assets/css/overlayscrollbars.min.css" />

        <link rel="stylesheet" href="/assets/css/adminlte.min.css" />
        <link rel="stylesheet" href="/assets/css/app.css" />
      </head>
      <I18nProvider initialLocale={locale} initialMessages={initialMessages}>
        <AppLayout>
          {children}

          <Script src="/assets/js/overlayscrollbars.browser.es6.min.js" type="text/javascript" strategy="lazyOnload" />
          <Script src="/assets/js/popper.min.js" type="text/javascript" strategy="lazyOnload" />
          <Script src="/assets/js/bootstrap.min.js" type="text/javascript" strategy="lazyOnload" />
          <Script src="/assets/js/apexcharts.min.js" type="text/javascript" strategy="lazyOnload" />

          <Script src="/assets/js/adminlte.min.js" type="text/javascript" strategy="lazyOnload" />
        </AppLayout>
      </I18nProvider>
    </html>
  );
}
