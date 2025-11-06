'use client';

import { useI18n } from "./i18nProvider";

export default function AppBreadCrumb({ pageTitle, showBreadCrumb = true }) {
  const { t } = useI18n();

  return (
    <div className="app-content-header">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-6"><h3 className="mb-0">{ pageTitle }</h3></div>
          {
            pageTitle && showBreadCrumb &&
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-end">
                <li className="breadcrumb-item">{ t('home') }</li>
                <li className="breadcrumb-item active">{ pageTitle }</li>
              </ol>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
