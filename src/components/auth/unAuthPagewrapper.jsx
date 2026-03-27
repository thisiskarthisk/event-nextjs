'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppFooter from "../appFooter";
import { useAppLayoutContext } from "../appLayout";

export default function UnAuthenticatedPage({ children, ignoreIfAuthenticated = true }) {
  const router = useRouter();

  const { pageTitle, setBodyClass } = useAppLayoutContext();

  const { data: session, status } = useSession();

  useEffect(() => {
    if (ignoreIfAuthenticated && status == 'authenticated') {
      router.push('/');
    } else if (status == 'unauthenticated') {
      setBodyClass('login-page bg-body-secondary app-loaded');
    }
  }, [status]);

  return (
    <>
      {
        status == 'unauthenticated' &&
        <>
          {children}

          <AppFooter />
        </>
      }
    </>
  );
}
