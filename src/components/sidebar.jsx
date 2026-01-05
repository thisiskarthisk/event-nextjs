'use client';

import AppIcon from "./icon";
import { useI18n } from "./i18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useSession } from "next-auth/react";
import { toggleSidebar } from "@/helper/utils";


export default function AppSidebar() {
  const pathName = usePathname();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [roles, setRoles] = useState([]);

  const [open, setOpen] = useState(true); // Initial open state for Dashboard menu
  const [reportOpen, setReportOpen] = useState(true); // Initial open state for Dashboard menu

  const toggleMenu = (e) => {
      e.preventDefault();
      setReportOpen(!reportOpen);
  };

  const toggleSettings = (e) => {
    e.preventDefault();
    setOpen(!open);
  };


  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <div className="sidebar-brand">
        <a href="/" className="brand-link">
          <img src="/assets/img/logo.png" alt="App Logo" className="brand-image opacity-75 shadow" />
        </a>
      </div>

      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="navigation" aria-label="Main navigation" data-accordion="false" id="navigation">
            <li className="nav-item">
              <Link href="/" className={"nav-link " + (pathName == '/' ? 'active' : '')} onClick={e => toggleSidebar()}>
                <AppIcon ic="family-tree" className="nav-icon" />
                <p>{t('organizationChart')}</p>
              </Link>
            </li>
            {session.user.user_type === "admin" && (
              <li className="nav-item">
                <Link href="/admin/users" className={"nav-link " + (pathName == '/admin/users' ? 'active' : '')} onClick={e => toggleSidebar()}>
                  <AppIcon ic="account-group" className="nav-icon" />
                  <p>{t('Manage Users')}</p>
                </Link>
              </li>
            )}
       
            {/* <li className="nav-item">
              <Link href="/roles" className={"nav-link " + (pathName == '/roles' ? 'active' : '')} onClick={e => toggleSidebar()}>
                <AppIcon ic="chart-line" className="nav-icon" />
                <p>{t('Role Sheet')}</p>
              </Link>
            </li> */}

            <li className="nav-item">
              <Link href="/capa" className={"nav-link " + (pathName == '/capa' ? 'active' : '')} onClick={e => toggleSidebar()}>
                <AppIcon ic="shield-sun" className="nav-icon" />
                <p>{t('CAPA')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/rca" className={"nav-link " + (pathName == '/rca' ? 'active' : '')} onClick={e => toggleSidebar()}>
                <AppIcon ic="chart-multiline" className="nav-icon" />
                <p>{t('RCA')}</p>
              </Link>
            </li>

            {/* Admin Settings */}
            {session.user.user_type === "admin" && (
              <li className={`nav-item ${open ? "menu-open" : ""}`}>
                <Link href="/" className={"nav-link " + (open ? 'active' : '')} onClick={toggleSettings}>
                  <AppIcon ic="cog" className="nav-icon" />
                  <p>
                    {t('Settings')}
                    <AppIcon ic="chevron-right" className="nav-arrow" />
                  </p>
                </Link>
                {open && (
                    <ul className="nav nav-treeview">
                        <li className="nav-item">
                            <Link href="/admin/settings/general" className={"nav-link " + (pathName == '/settings/general' ? 'active' : '')} onClick={e => toggleSidebar()}>
                                <AppIcon ic="file-cog" className="nav-icon bi bi-journal-bookmark-fill"></AppIcon>
                                <p>{t('General Setting')}</p>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/admin/settings/chart" className={"nav-link " + (pathName == '/settings/chart' ? 'active' : '')} onClick={e => toggleSidebar()}>
                                <AppIcon ic="chart-bar" className="nav-icon bi bi-journal-bookmark-fill"></AppIcon>
                                <p>{t('Chart Setting')}</p>
                            </Link>
                        </li>
                    </ul>
                )}
              </li>
            )}
            {session.user.user_type === "admin" && (
              <li className={`nav-item ${reportOpen ? "menu-open" : ""}`}>
                <Link href="#" className={"nav-link " + (open ? 'active' : '')} onClick={toggleMenu}>
                    <AppIcon className="nav-icon bi bi-journal mdi mdi-chart-box-multiple"></AppIcon>
                    <p>
                        Reports
                        <AppIcon ic="chevron-right" className="nav-arrow" />
                    </p>
                </Link>
                {reportOpen && (
                  <ul className="nav nav-treeview">
                      <li className="nav-item">
                          <Link href="/reports/abnormalities-report" className={"nav-link " + (pathName == '/reports/abnormalities-report' ? 'active' : '')} onClick={e => toggleSidebar()}>
                              <AppIcon className="nav-icon bi bi-journal-bookmark-fill mdi mdi-file-chart-outline"></AppIcon>
                              <p>Abnormalities Report</p>
                          </Link>
                      </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
