'use client';

import AppIcon from "./icon";
import { useI18n } from "./i18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toggleSidebar } from "@/helper/utils";

export default function AppSidebar() {
  const pathName = usePathname();
  const { t } = useI18n();

  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <div className="sidebar-brand">
        <a href="/" className="brand-link">
          <img src="/assets/img/logo1.png" alt="App Logo" className="brand-image opacity-75 shadow" />
        </a>
      </div>

      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="navigation" aria-label="Main navigation" data-accordion="false" id="navigation">
            <li className="nav-item">
              <Link href="/events" className={"nav-link " + (pathName == '/' ? 'active' : '')} onClick={e => toggleSidebar()}>
                <AppIcon ic="calendar-multiple" className="nav-icon" />
                <p>{t('events')}</p>
              </Link>
            </li>

            {/* {session.user.user_type === "admin" && ( */}
              <li className="nav-item">
                <Link href="/admin/users" className={"nav-link " + (pathName == '/admin/users' ? 'active' : '')} onClick={e => toggleSidebar()}>
                  <AppIcon ic="account-group" className="nav-icon" />
                  <p>{t('Manage Users')}</p>
                </Link>
              </li>
            {/* )} */}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
