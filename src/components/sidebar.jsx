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
                <AppIcon ic="speedometer" className="nav-icon" />
                <p>{t('dashboard')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/capa" className="nav-link">
                <AppIcon ic="shield-sun" className="nav-icon" />
                <p>{t('CAPA')}</p>
              </Link>
            </li>

            <li className="nav-item">
              <Link href="/rca" className="nav-link">
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
