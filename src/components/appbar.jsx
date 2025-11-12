'use client';

import { AVAILABLE_LANGUAGES } from "@/constants";
import AppIcon from "./icon";
import { useI18n } from "./i18nProvider";
import { useAppLayoutContext } from "./appLayout";
import { signOut } from "next-auth/react";

export default function AppBar({pageTitle}) {
  const { locale, changeLocale, t } = useI18n();
  const { modal } = useAppLayoutContext();

  const onLangChosen = (e, lang) => {
    e.preventDefault();

    changeLocale(lang);
  };

  const showLogoutConfirmPopup = (e) => {
    e.preventDefault();

    if (document.activeElement) document.activeElement.blur();

    modal({
      title: 'Logout',
      body: 'Are you sure you want to Logout?',
      okBtn: {
        label: 'Yes',
        onClick: async () => {
          await signOut({
            callbackUrl: '/auth/login',
          });
        },
      },
      cancelBtn: {
        label: 'No',
      },
    });
  };

  return (
    <nav className="app-header navbar navbar-expand bg-body">
      <div className="container-fluid">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-lte-toggle="sidebar" href="#" role="button">
              <AppIcon ic="menu" />
            </a>
          </li>

          {
            pageTitle &&
              <li className="nav-item">
                <span className="nav-link text-inherit">
                  {pageTitle}
                </span>
              </li>
          }
        </ul>

        <ul className="navbar-nav ms-auto">
          <li className="nav-item dropdown">
            <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="d-none d-md-inline">
                <AppIcon ic="translate" />
              </span>
            </a>
            <div className="dropdown-menu dropdown-menu-end" data-bs-popper="static">
              {
                Object.keys(AVAILABLE_LANGUAGES).map(l => {
                  return (
                    <a
                      key={l}
                      href="#"
                      className={"dropdown-item " + (l == locale ? 'active' : '')}
                      data-lang-code={l}
                      onClick={ e => onLangChosen(e, l) }>{ AVAILABLE_LANGUAGES[l] }</a>
                  )
                })
              }
            </div>
          </li>

          <li className="nav-item dropdown">
            <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="d-none d-md-inline">
                <AppIcon ic="account-circle" />
              </span>
            </a>
            <div className="dropdown-menu dropdown-menu-end" data-bs-popper="static">
              <a href="#" className="dropdown-item">{ t('profile') }</a>
              <div className="dropdown-divider"></div>
              <a href="#" className="dropdown-item" onClick={showLogoutConfirmPopup}>{ t('logout') }</a>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
}
