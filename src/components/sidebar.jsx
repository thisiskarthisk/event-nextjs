'use client';

import AppIcon from "./icon";
import { useI18n } from "./i18nProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const pathName = usePathname();

  const { t } = useI18n();
  const [roles, setRoles] = useState([]);

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
              <Link href="/" className={"nav-link " + (pathName == '/' ? 'active' : '')}>
                <AppIcon ic="family-tree" className="nav-icon" />
                <p>{t('organizationChart')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/admin/users" className={"nav-link " + (pathName == '/admin/users' ? 'active' : '')}>
                <AppIcon ic="account-group" className="nav-icon" />
                <p>{t('Manage Users')}</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/roles" className={"nav-link " + (pathName == '/roles' ? 'active' : '')}>
                <AppIcon ic="chart-line" className="nav-icon" />
                <p>{t('Role Sheet')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/capa" className={"nav-link " + (pathName == '/capa' ? 'active' : '')}>
                <AppIcon ic="shield-sun" className="nav-icon" />
                <p>{t('CAPA')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/rca" className={"nav-link " + (pathName == '/rca' ? 'active' : '')}>
                <AppIcon ic="chart-multiline" className="nav-icon" />
                <p>{t('RCA')}</p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
