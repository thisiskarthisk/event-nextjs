'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage, { useAuthPageLayoutContext } from "@/components/auth/authPageWrapper";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { decodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function UserAddOrEditForm({ params }) {
  const initialData = {
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
  };

  const { user_id } = use(params);

  const [ decryptedUserId, setDecryptedUserId ] = useState(null);

  const { setPageTitle, toggleProgressBar } = useAppLayoutContext();
  const { toggleBreadcrumbs } = useAuthPageLayoutContext();

  const [ formData, setFormData ] = useState({ ...initialData });

  const [ isPasswordFieldVisible, togglePassword ] = useState(false);

  const onFieldValueChanged = (e, fieldName) => {
    setFormData(prevData => {
      return {
        ...prevData,
        [fieldName]: (typeof(e) === 'object' && e.target ? (e.target.value || '') : e),
      }
    });
  };

  const onFormSubmitted = (e) => {
    e.preventDefault();

    if (document.activeElement) document.activeElement.blur();

    //
  };

  useEffect(() => {
    let decUserId = null;

    if (user_id) {
      decUserId = decodeURLParam(user_id);

      setDecryptedUserId(decUserId);
    }

    setPageTitle((decUserId ? 'Edit' : 'Add') + ' User');

    toggleProgressBar(false);
    toggleBreadcrumbs({
      'Users': '/admin/users'
    });
  }, [user_id]);

  return (
    <AuthenticatedPage>
      <form onSubmit={onFormSubmitted}>
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">

                <div className="row mt-3">
                  <div className="col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      label="Employee ID"
                      value={formData.employee_id}
                      onChange={e => onFieldValueChanged(e, 'employee_id')}
                      isRequired={true}
                      autoFocus={true} />
                  </div>

                  <div className="col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      label="First Name"
                      value={formData.first_name}
                      onChange={e => onFieldValueChanged(e, 'first_name')}
                      isRequired={true} />
                  </div>

                  <div className="col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      label="Last Name"
                      value={formData.last_name}
                      onChange={e => onFieldValueChanged(e, 'last_name')}
                      isRequired={true} />
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      label="Email Address"
                      value={formData.email}
                      onChange={e => onFieldValueChanged(e, 'email')}
                      isRequired={true}
                      type="email" />
                  </div>

                  <div className="col-lg-4 col-md-6 col-sm-12">
                    <TextField
                      label="Mobile Number"
                      value={formData.mobile_no}
                      onChange={e => onFieldValueChanged(e, 'mobile_no')}
                      isRequired={true}
                      type="tel"
                      subType="mobile" />
                  </div>
                </div>

                {
                  !isPasswordFieldVisible && <div className="row mt-3">
                    <div className="col-12">
                      <a href="#" className="btn btn-primary" onClick={e => {
                        e.preventDefault();

                        if (document.activeElement) document.activeElement.blur();

                        togglePassword(true);
                      }}>
                        <AppIcon ic="lock-open-variant" />&nbsp;Change Password
                      </a>
                    </div>
                  </div>
                }

                {
                  isPasswordFieldVisible && <div className="row mt-3">
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <TextField
                        label="Password"
                        value={formData.password || ''}
                        onChange={e => onFieldValueChanged(e, 'password')}
                        isRequired={true}
                        type="password"
                        autoComplete="new-password"
                        autoFocus />
                    </div>

                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <TextField
                        label="Confirm Password"
                        value={formData.conf_password || ''}
                        onChange={e => onFieldValueChanged(e, 'conf_password')}
                        isRequired={true}
                        type="password"
                        autoComplete="new-password" />
                    </div>
                  </div>
                }

              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-12 flex-space-between">
              <Link href="/admin/users" className="btn btn-secondary" type="submit">Cancel</Link>

              <button className="btn btn-primary" type="submit"><AppIcon ic="check" />&nbsp;{decryptedUserId ? 'Save' : 'Add'} User</button>
          </div>
        </div>
      </form>
    </AuthenticatedPage>
  );
}
