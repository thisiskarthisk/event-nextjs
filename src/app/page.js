'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import { useI18n } from "@/components/i18nProvider";
import { useEffect } from "react";

export default function Home() {
  const { setPageTitle, setPageType, toggleProgressBar } = useAppLayoutContext();
  const { t, locale } = useI18n();

  useEffect(() => {
    setPageType('dashboard');

    setPageTitle(t('dashboard'));

    toggleProgressBar(false);
  }, [locale]);

  return (
    <AuthenticatedPage>
      <div className="row">
        <div className="col-12">
          Dashboard comes here...
        </div>
      </div>
    </AuthenticatedPage>
  );
}
