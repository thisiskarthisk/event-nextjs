'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import DataTable from "@/components/DataTable";
import AppIcon from "@/components/icon";
import { encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { useEffect } from "react";

export default function UsersListPage() {
  const columns = [
    { 'column': 'employee_id', 'label': 'ID' },
    { 'column': 'first_name', 'label': 'First Name' },
    { 'column': 'last_name', 'label': 'Last Name' },
    { 'column': 'email', 'label': 'Email Address' },
    { 'column': 'mobile_no', 'label': 'Mobile No' },
  ];

  const { setPageTitle, toggleProgressBar, confirm } = useAppLayoutContext();

  const onDeleteUserClicked = (e) => {
    e.preventDefault();

    if (document.activeElement) document.activeElement.blur();

    confirm({
      title: 'Delete User',
      message: 'Are you sure you want to Delete the User?',
      positiveBtnOnClick: () => {
        // toggleProgressBar(true);
        // TODO: Implement delete functionality
      },
    });
  };

  useEffect(() => {
    setPageTitle('Users');

    toggleProgressBar(false);
  }, []);

  return (
    <AuthenticatedPage>
      <div className="row mb-3">
        <div className="col-12 text-right">
          <Link href="/admin/users/add" className="btn btn-primary">
            <AppIcon ic="plus" />&nbsp;Add User
          </Link>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">

              <DataTable
                  apiPath="/users/list"
                  dataKeyFromResponse="users"
                  columns={columns}
                  paginationType="client"
                  actionColumnFn={(rowData) => {
                    return (
                      <>
                        <Link href={"/admin/users/edit/" + encodeURLParam(rowData.id)} className="text-primary">
                          <AppIcon ic="pencil" />
                        </Link>
                        &nbsp;|&nbsp;
                        <a href="#" className="text-danger" onClick={onDeleteUserClicked}>
                          <AppIcon ic="delete" />
                        </a>
                      </>
                    );
                  }} />

            </div>
          </div>
        </div>
      </div>
    </AuthenticatedPage>
  );
}
