'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { APP_NAME, DEFAULT_TOAST_TIME } from "@/constants";

import { SessionProvider } from 'next-auth/react';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { ToastContainer, toast as toastify } from 'react-toastify';
import { toggleSidebarBasedOnScreenSize } from "@/helper/utils";
import { useSession } from "next-auth/react";
import { HttpClient } from "@/helper/http";

const AppLayoutContext = createContext({
  pageTitle: '',
  setPageTitle: (title) => { },
  setBodyClass: (className) => { },
  toggleProgressBar: (show) => { },
  toast: () => { },
  modal: () => { },
  closeModal: () => { },
  rhsAppBarMenuItems: [],
  setRHSAppBarMenuItems: (items) => { },
  lhsAppBarMenuItems: [],
  setLHSAppBarMenuItems: (items) => { },
  confirm: () => {},
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
  const [title, setTitle] = useState('');
  const [bodyClass, setBodyClass] = useState('');

  const [isLoading, toggleProgressBar] = useState(true);

  const [rhsAppBarMenuItems, setRHSAppBarMenuItems] = useState([]);

  const [lhsAppBarMenuItems, setLHSAppBarMenuItems] = useState([]);

  const setPageTitle = (title) => {

    setTitle(title || '');
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

  const modal = ({ title, body, okBtn = { label: 'Ok', onClick: () => { } }, cancelBtn = null, closeOnEsc = false }) => {
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
    } else if (!okBtn) {
      options['showConfirmButton'] = false;
    }

    if (cancelBtn && cancelBtn.label) {
      options['showCancelButton'] = true;
      options['cancelButtonText'] = cancelBtn.label;
    }

    SwalModal.fire({
      ...options,
    });
  };

  const confirm = ({ title, message, positiveBtnOnClick = () => {}, negativeBtnOnClick = () => {}, positiveBtnLabel = 'Yes', negativeBtnLabel = 'No'}) => {
    modal({
      title: title,
      body: message,
      okBtn: {
        label: positiveBtnLabel,
        onClick: positiveBtnOnClick || (() => {})
      },
      cancelBtn: {
        label: negativeBtnLabel,
        onClick: negativeBtnOnClick || (() => {})
      }
    });
  };

  useEffect(() => {
    document.body.className = bodyClass;

    toggleSidebarBasedOnScreenSize();
  }, [bodyClass]);

  useEffect(() => {
    window.addEventListener('resize', () => toggleSidebarBasedOnScreenSize());

    return () => {
      window.removeEventListener('resize', () => toggleSidebarBasedOnScreenSize());
    }
  }, []);

  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);

  return (
    <SessionProvider basePath="/api/v1/auth">
      <AppLayoutContext.Provider value={{ pageTitle: title, setPageTitle, setBodyClass, toggleProgressBar, toast, modal, rhsAppBarMenuItems, setRHSAppBarMenuItems, lhsAppBarMenuItems, setLHSAppBarMenuItems, closeModal, confirm }}>
        
        {
          isLoading &&
          <div className="loader-overlay">
            <span className="loader"></span>
          </div>
        }
        {children}

        <ToastContainer />
        
      </AppLayoutContext.Provider>
    </SessionProvider>
  );
}

export function useAppLayoutContext() {
  return useContext(AppLayoutContext);
}

export function useCurrentUserRole() {
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    // Reset if user is not authenticated
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status !== 'authenticated') {
      setCurrentUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        // API returns { success: true, data: { user: {...} } }
        const res = await HttpClient({
          url: "auth/user",
          method: 'GET',
          params: {
            user_id: session.user.id,
          },
        });

        if (res && res.success && res.data && res.data.user) {
          console.log("Fetched current user role:", res.data.user);
          setCurrentUserRole(res.data.user);
        } else {
          console.warn('No user role returned from auth/user', res);
          setCurrentUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching current user role:", error);
        setCurrentUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [status, session?.user?.id]);

  return { currentUserRole, loading };
}

export function getChildrenRoles() {
  const [userChildrenRole, setUserChildrenRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    // Reset if user is not authenticated
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status !== 'authenticated') {
      setUserChildrenRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      setLoading(true);
      try {
        // API returns { success: true, data: { user: {...} } }
        const res = await HttpClient({
          url: "/organizationChart/childrenRoles",
          method: 'GET',
          params: {
            user_id: session.user.id,
          },
        });

        if (res && res.success && res.data) {
            const data = res.data || [];
            const roleIds = data.map(item => Number(item.role_id));
            console.log('childrenRoles roleIds:',roleIds);
            setUserChildrenRole(roleIds);
        } else {
          console.warn('No user role returned from /organizationChart/childrenRoles', res);
          setUserChildrenRole(null);
        }
      } catch (error) {
        console.error("Error fetching current user role:", error);
        setUserChildrenRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [status, session?.user?.id]);
  console.log("userChildrenRole in useGetChildrenRoles:", userChildrenRole);
  return { userChildrenRole, loading };
}
