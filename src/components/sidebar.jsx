'use client';

import AppIcon from "./icon";
import { useI18n } from "./i18nProvider";
import Link from "next/link";

export default function AppSidebar() {
  const { t } = useI18n();

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
              <Link href="/" className="nav-link active">
                <AppIcon ic="family-tree" className="nav-icon" />
                <p>{ t('organizationChart') }</p>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
