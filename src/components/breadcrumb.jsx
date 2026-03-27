'use client';

export default function AppBreadCrumb({ breadcrumbs = {} }) {
  return (
    <div className="row">
      <div className="col-sm-6"></div>
      {
        breadcrumbs && Object.keys(breadcrumbs).length > 0 && 
        <div className="col-sm-6">
          <ol className="breadcrumb float-sm-end">
            {
              Object.keys(breadcrumbs).map((b, i) => {
                return (
                  <li key={`breadcrumb-${i}`} className={"breadcrumb-item" + (!breadcrumbs[b] ? ' active' : '')}>
                    {
                      breadcrumbs[b] ? <a href={breadcrumbs[b]}>{b}</a> : b
                    }
                  </li>
                );
              })
            }
          </ol>
        </div>
      }
    </div>
  );
}
