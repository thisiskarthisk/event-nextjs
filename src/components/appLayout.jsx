'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { APP_NAME, DEFAULT_TOAST_TIME } from "@/constants";

import { SessionProvider } from 'next-auth/react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { ToastContainer, toast as toastify } from 'react-toastify';

const AppLayoutContext = createContext({
  pageTitle: '',
  setPageTitle: (title) => {},
  setBodyClass: (className) => {},
  toggleProgressBar: (show) => {},
  toast: () => {},
  modal: () => {},
  closeModal: () => {},
  appBarMenuItems: [],
  setAppBarMenuItems: (items) => {},
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
  const [ bodyClass, setBodyClass ] = useState('');

  const [ isLoading, toggleProgressBar ] = useState(true);

  const [ appBarMenuItems, setAppBarMenuItems ] = useState([]);

  const setPageTitle = (title) => {
    title = (title || '');

    setTitle(title);
    document.title = `${title} | ${APP_NAME}`;
  };

  const toast = (type, message, time = DEFAULT_TOAST_TIME) => {
    /* SwalToast.fire({
      icon: type,
      title: message,
      timer: time
    }); */

    toastify(message, {
      type,
      position: 'top-right',
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
    });
  };

  const closeModal = () => {
    SwalModal.close();
  };

  const modal = ({title, body, okBtn = {label: 'Ok', onClick: () => {}}, cancelBtn = null, closeOnEsc = false}) => {
    let options = {
      title: title,
      html: body,
      focusConfirm: false,
      showCloseButton: true,
      allowOutsideClick: closeOnEsc,
      allowEscapeKey: closeOnEsc,
      preConfirm: async (value) => {
        if (okBtn && okBtn.onClick) {
          await okBtn.onClick();

          // SwalModal.close();

          return false;
        }

        return value;
      },
      preDeny: async (value) => {
        if (cancelBtn && cancelBtn.onClick) {
          await cancelBtn.onClick();

          // SwalModal.close();

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

  return (
    <SessionProvider basePath="/api/v1/auth">
      <AppLayoutContext.Provider value={{ pageTitle: title, setPageTitle, setBodyClass, toggleProgressBar, toast, modal, appBarMenuItems, setAppBarMenuItems, closeModal }}>
        <body className={bodyClass}>
        
          {
            isLoading &&
            <div className="loader-overlay">
              <span className="loader"></span>
            </div>
          }
          {children}
          <ToastContainer />
        </body>
      </AppLayoutContext.Provider>
    </SessionProvider>
  );
}

export function useAppLayoutContext() {
  return useContext(AppLayoutContext);
}
