'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppBar from "@/components/appbar";
import AppBreadCrumb from "@/components/breadcrumb";
import AppSidebar from "@/components/sidebar";
import AppFooter from "@/components/appFooter";
import { useAppLayoutContext } from "../appLayout";
import { createContext, useContext, useEffect, useState } from "react";
import { toggleSidebar } from "@/helper/utils";

const AuthPageLayoutContext = createContext({
  toggleBreadcrumbs: (value) => {},
});

export default function AuthenticatedPage({ children }) {
  const router = useRouter();

  const { pageTitle, setBodyClass } = useAppLayoutContext();
  const [ breadcrumbs, setBreadcrumbs ] = useState({});

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/login');
    }
  });

  const toggleBreadcrumbs = (newBreadcrumbs) => {
    setBreadcrumbs({...newBreadcrumbs});
  };

  useEffect(() => {
    if (status == 'authenticated') {
      setBodyClass('layout-fixed sidebar-expand-lg sidebar-open bg-body-tertiary');
    }
  }, [status]);

  useEffect(() => {
    // console.log('breadcrumbs:', breadcrumbs);
  }, [breadcrumbs]);

  return (
    <AuthPageLayoutContext.Provider value={{ toggleBreadcrumbs }}>
      {
        status == 'authenticated' &&
        <div className="app-wrapper">
          <AppBar pageTitle={pageTitle} />
          <AppSidebar />
  
          <main className="app-main">
            <div className="app-content-header">
              <div className="container-fluid">
                <AppBreadCrumb breadcrumbs={breadcrumbs} />
              </div>
            </div>
    
            <div className="app-content">
              <div className="container-fluid">
              {children}
              </div>
            </div>
          </main>
  
          <AppFooter />

          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        </div>
      }
    </AuthPageLayoutContext.Provider>
  );
}

export function useAuthPageLayoutContext() {
  return useContext(AuthPageLayoutContext);
}
