'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppBar from "@/components/appbar";
import AppBreadCrumb from "@/components/breadcrumb";
import AppSidebar from "@/components/sidebar";
import AppFooter from "@/components/appFooter";
import { useAppLayoutContext } from "../appLayout";
import { createContext, useContext, useEffect, useState } from "react";

const AuthPageLayoutContext = createContext({
  toggleBreadCrumb: (show) => {},
});

export default function AuthenticatedPage({ children }) {
  const router = useRouter();

  const { pageTitle, setBodyClass } = useAppLayoutContext();
  const [ isBreadCrumpVisible, toggleBreadCrumb ] = useState(false);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/login');
    }
  });

  useEffect(() => {
    if (status == 'authenticated') {
      setBodyClass('layout-fixed sidebar-expand-lg sidebar-open bg-body-tertiary');
    }
  }, [status]);

  return (
    <AuthPageLayoutContext.Provider value={{ toggleBreadCrumb }}>
      {
        status == 'authenticated' &&
        <div className="app-wrapper">
          <AppBar pageTitle={pageTitle} />
          <AppSidebar />
  
          <main className="app-main">
            <div className="app-content-header">
              <div className="container-fluid">
                {/* <AppBreadCrumb pageTitle={pageTitle} showBreadCrumb={isBreadCrumpVisible} /> */}
              </div>
            </div>
    
            <div className="app-content">
              <div className="container-fluid">
              {children}
              </div>
            </div>
          </main>
  
          <AppFooter />
        </div>
      }
    </AuthPageLayoutContext.Provider>
  );
}

export function useAuthPageLayoutContext() {
  return useContext(AuthPageLayoutContext);
}
