'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import DataTable from "@/components/DataTable";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { use, useEffect , useState , useRef} from "react";

export default function UsersListPage() {
  const columns = [
    { 'column': 'user_type', 'label': 'User Type' },
    { 'column': 'username', 'label': 'User Name' },
    { 'column': 'first_name', 'label': 'First Name' },
    { 'column': 'last_name', 'label': 'Last Name' },
    { 'column': 'email', 'label': 'Email Address' },
    { 'column': 'mobile_no', 'label': 'Mobile No' },
  ];

  const { setPageTitle, toggleProgressBar, confirm, toast ,closeModal } = useAppLayoutContext();
  const tableRef = useRef(null);

  useEffect(() => {
    setPageTitle('Users');
    toggleProgressBar(false);
  }, []);
  
  const onDeleteUserClicked = (e, id) => {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    confirm({
      title: "Delete User",
      message: "Are you sure you want to Delete the User?",
      positiveBtnOnClick: () => {
        toggleProgressBar(true);
        try {
          HttpClient({
            url: '/users/delete',
            method: "POST",
            data: { id: id },
          }).then(res => {
            toast('success', res.message || 'The User record has been deleted successfully.');
            toggleProgressBar(false);
            closeModal();
            tableRef.current?.refreshTable();
          }).catch(err => {
            closeModal();
            toggleProgressBar(false);
            let message = 'Error occurred when trying to delete the User.';
            if (err.response && err.response.data && err.response.data.message) {
              message = err.response.data.message;
            }
            toast('error', message);
          });
        } catch (error) {
          toast('error', 'Error occurred when trying to save the User data.');
        }
      },
    });
  };


  useEffect(() => {
    setPageTitle('Users');
    toggleProgressBar(false);
  }, []);


  return (
    <>
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
                  ref={tableRef}
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
                        <a href="#" className="text-danger" onClick={(e) => onDeleteUserClicked(e, rowData.id)}>
                          <AppIcon ic="delete" />
                        </a>
                      </>
                    );
                  }} />

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
