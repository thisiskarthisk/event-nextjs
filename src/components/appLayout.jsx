'use client';

import { createContext, useContext, useEffect, useState } from "react";
import AppBar from "./appbar";
import AppBreadCrumb from "./breadcrumb";
import AppSidebar from "./sidebar";
import AppFooter from "./appFooter";
import { APP_NAME, DEFAULT_TOAST_TIME } from "@/constants";

import { SessionProvider } from 'next-auth/react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const AppLayoutContext = createContext({
  setPageTitle: (title) => {},
  toggleBreadCrumb: (show) => {},
  setPageType: (pageType) => {},
  toggleProgressBar: (show) => {},
  toast: () => {},
  modal: () => {},
});

const SwalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: DEFAULT_TOAST_TIME,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const SwalModal = withReactContent(Swal);

export default function AppLayout({ children }) {
  const [ title, setTitle ] = useState('');
  const [ isBreadCrumpVisible, toggleBreadCrumb ] = useState(false);
  const [ bodyClass, setBodyClass ] = useState('');
  const [ pageType, setPageType ] = useState('');

  const [ isLoading, toggleProgressBar ] = useState(true);

  const setPageTitle = (title) => {
    title = (title || '');

    setTitle(title);
    document.title = `${title} | ${APP_NAME}`;
  };

  const toast = (type, message, time = DEFAULT_TOAST_TIME) => {
    SwalToast.fire({
      icon: type,
      title: message,
      timer: time
    });
  };

  const modal = ({title, body, okBtn = {label: 'Ok', onClick: () => {}}, cancelBtn = null, closeOnEsc = false}) => {
    let options = {
      title: title,
      html: body,
      focusConfirm: false,
      allowOutsideClick: closeOnEsc,
      allowEscapeKey: closeOnEsc,
      preConfirm: async (value) => {
        if (okBtn && okBtn.onClick) {
          await okBtn.onClick();

          SwalModal.close();

          return false;
        }

        return value;
      },
      preDeny: async (value) => {
        if (cancelBtn && cancelBtn.onClick) {
          await cancelBtn.onClick();

          SwalModal.close();

          return false;
        }

        return value;
      },
    };

    if (okBtn && okBtn.label) {
      options['confirmButtonText'] = okBtn.label;
    }

    if (cancelBtn && cancelBtn.label) {
      options['showCancelButton'] = true;
      options['cancelButtonText'] = cancelBtn.label;
    }

    SwalModal.fire({
      ...options,
    });
  };

  useEffect(() => {
    let newBodyClass = '';

    if (pageType == 'auth') {
      newBodyClass = 'login-page bg-body-secondary app-loaded';
    } else if (pageType == 'dashboard') {
      newBodyClass = 'layout-fixed sidebar-expand-lg sidebar-open bg-body-tertiary';
    }

    setBodyClass(newBodyClass);
  }, [pageType]);

  return (
    <SessionProvider basePath="/api/v1/auth">
      <AppLayoutContext.Provider value={{ setPageTitle, toggleBreadCrumb, setPageType, toggleProgressBar, toast, modal }}>
        <body className={bodyClass}>
          {
            isLoading &&
            <div className="loader-overlay">
              <span className="loader"></span>
            </div>
          }
          {
            !pageType &&
            <div className="c">{children}</div>
          }
          {
            pageType == 'auth' &&
            <>
              {children}
              <AppFooter />
            </>
          }
          {
            pageType == 'dashboard' &&
            <div className="app-wrapper">
              <AppBar />
              <AppSidebar />

              <main className="app-main">
                <AppBreadCrumb pageTitle={title} showBreadCrumb={isBreadCrumpVisible} />

                <div className="app-content">
                  <div className="container-fluid">
                    {children}
                  </div>
                </div>
              </main>

              <AppFooter />
            </div>
          }
        </body>
      </AppLayoutContext.Provider>
    </SessionProvider>
  );
}

export function useAppLayoutContext() {
  return useContext(AppLayoutContext);
}
