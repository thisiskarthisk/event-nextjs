'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import DataTable from "@/components/DataTable";
import { useEffect } from "react";

export default function UsersListPage() {
  const columns = [
    { 'column': 'employee_id', 'label': 'ID' },
    { 'column': 'first_name', 'label': 'First Name' },
    { 'column': 'last_name', 'label': 'Last Name' },
    { 'column': 'email', 'label': 'Email Address' },
    { 'column': 'mobile_no', 'label': 'Mobile No' },
  ];
  // TODO: Add actions menu

  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();

  useEffect(() => {
    setPageTitle('Users');

    toggleProgressBar(false);
  }, []);

  return (
    <AuthenticatedPage>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">

              <DataTable
                  apiPath="/users/list"
                  dataKeyFromResponse="users"
                  columns={columns}
                  paginationType="client" />

            </div>
          </div>
        </div>
      </div>
    </AuthenticatedPage>
  );
}
