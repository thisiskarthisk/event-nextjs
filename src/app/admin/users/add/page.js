'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage, { useAuthPageLayoutContext } from "@/components/auth/authPageWrapper";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use ,useEffect, useState } from "react";

export default function UserAddOrEditForm({ params }) {
  const initialData = {
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_no: "",
    password: "",
    conf_password: ""
  };

  const router = useRouter();
  // const { user_id } = use(params);
  const { user_id } = use(params);

  const searchParams = useSearchParams();

  const [decryptedUserId, setDecryptedUserId] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [showPasswordFields, setShowPasswordFields] = useState(true);

  const [formErrors, setFormErrors] = useState({});

  const isEdit = !!user_id;

  const { setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();
  const { toggleBreadcrumbs } = useAuthPageLayoutContext();

  const onFieldValueChanged = (value, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: typeof value === "object" ? value.target.value : value
    }));
  };

  /** LOAD USER FOR EDIT **/
  // const loadExistingUser = async (id) => {
  //   try {
  //     const res = await fetch(`/api/v1/users/get?id=${id}`);
  //     const json = await res.json();

  //     if (json.success) {
  //       setFormData({
  //         ...json.data,
  //         password: "",
  //         conf_password: ""
  //       });
  //     } else {
  //       toast("error", "Failed to load user data.");
  //     }
  //   } catch (err) {
  //     toast("error", "Error loading user data.");
  //   }
  // };

  const loadExistingUser = async (id) => {
    try {
      HttpClient({
        url: '/users/get',
        method: "GET",
        params: { id: id },
      }).then(res => {
        if (res.success) {
        setFormData({
          ...res.data,
          password: "",
          conf_password: ""
        });
      } else {
        toast("error", "Failed to load user data.");
      }
      }).catch(err => {
        toast("error", "Error loading user data.");
      }).finally(() => {
        toggleProgressBar(false);
      })
    } catch (err) {
      toast("error", "Error loading user data.");
    }
  };

  const backURL = (userId) => {
    let fromPath = searchParams.has('from') ? decodeURLParam(searchParams.get('from')) : null;

    try {
      if (fromPath) {
        let fromSearchQuery;

        [fromPath, fromSearchQuery] = fromPath.split('?');

        const fromSearchParams = new URLSearchParams(fromSearchQuery);

        if (decodeURLParam(fromSearchParams.get('action')) == 'assign' && userId) {
          fromSearchParams.set('user', encodeURLParam(userId));
        }

        return `${fromPath}?${fromSearchParams.toString()}`;
      }
    } catch (error) {
      console.log('[backURL]: Error', error);
    }

    return fromPath || '/admin/users';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    toggleProgressBar(true);
    try {
      HttpClient({
        url: '/users/save',
        method: "POST",
        data: { id: decryptedUserId, ...formData },
      }).then(res => {
        let success = false, message = 'Unable to save the user data!', newErrors = {}, userId = decryptedUserId;

        if (res) {
          if (res.success) {
            userId = res.data.id || decryptedUserId;
          } else if (res.errors) {
            newErrors = { ...res.errors };
          }

          success = res.success;
          message = res.message || (success ? 'The User record has been updated successfully.' : 'Unable to save the user data!');
        }

        setFormErrors({...newErrors});

        toast(success ? 'success' : 'error', message);

        toggleProgressBar(false);

        if (success) {
          router.push(backURL(userId));
        }
      }).catch(err => {
        toggleProgressBar(false);
        const errors = err.response.errors;
        setFormErrors(errors);
      });
    } catch (error) {
      toggleProgressBar(false);

      toast('error', 'Error occurred when trying to save the User data.');
    }
  };

  useEffect(() => {
    if (isEdit) {
      console.log('user_id:',user_id);
      const dec = decodeURLParam(user_id);   // ❗ decode encrypted ID
      console.log("DECODED USER ID =>", dec);

      setDecryptedUserId(dec);

      if (dec) {
        loadExistingUser(dec);
      }

      setShowPasswordFields(false);
    } else {
      setShowPasswordFields(true);
    }

    setPageTitle(isEdit ? "Edit User" : "Add User");
    toggleProgressBar(false);
    toggleBreadcrumbs({ Users: "/admin/users" });

  }, [user_id]);


  

  return (
    <AuthenticatedPage>
      <form onSubmit={onSubmit}>
        <div className="card">
          <div className="card-body">

            {/* BASIC DETAILS */}
            <div className="row mt-3">
              <div className="col-lg-4">
                <TextField
                  label="Employee ID"
                  value={formData.employee_id}
                  onChange={(e) => onFieldValueChanged(e, "employee_id")}
                  isRequired
                  autoFocus
                  error={formErrors.employee_id}
                />
              </div>

              <div className="col-lg-4">
                <TextField label="First Name" value={formData.first_name}
                  onChange={(e) => onFieldValueChanged(e, "first_name")}
                  isRequired
                  error={formErrors.first_name}
                />
              </div>

              <div className="col-lg-4">
                <TextField label="Last Name" value={formData.last_name}
                  onChange={(e) => onFieldValueChanged(e, "last_name")}
                  isRequired
                  error={formErrors.last_name}
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-lg-4">
                <TextField label="Email Address" type="email"
                  value={formData.email}
                  onChange={(e) => onFieldValueChanged(e, "email")}
                  isRequired
                  error={formErrors.email}
                />
              </div>

              <div className="col-lg-4">
                <TextField
                  label="Mobile Number"
                  type="tel"
                  subType="mobile"
                  value={formData.mobile_no}
                  onChange={(e) => onFieldValueChanged(e, "mobile_no")}
                  isRequired
                  error={formErrors.mobile_no}
                />
              </div>
            </div>

            {/* SHOW "CHANGE PASSWORD" IN EDIT MODE */}
            {isEdit && !showPasswordFields && (
              <div className="row mt-3">
                <div className="col-12">
                  <a href="#" className="btn btn-primary" onClick={(e) => {
                    e.preventDefault();
                    setShowPasswordFields(true);
                  }}>
                    <AppIcon ic="lock-open-variant" /> Change Password
                  </a>
                </div>
              </div>
            )}

            {/* PASSWORD FIELDS */}
            {showPasswordFields && (
              <div className="row mt-3">
                <div className="col-lg-4">
                  <TextField
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => onFieldValueChanged(e, "password")}
                    isRequired={!isEdit}
                  error={formErrors.password}
                  />
                </div>

                <div className="col-lg-4">
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={formData.conf_password}
                    onChange={(e) => onFieldValueChanged(e, "conf_password")}
                    isRequired={!isEdit}
                  error={formErrors.conf_password}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BUTTONS */}
        <div className="row mt-3">
          <div className="col-12 flex-space-between">
            <Link href={backURL()} className="btn btn-secondary">
              Cancel
            </Link>

            <button className="btn btn-primary" type="submit">
              <AppIcon ic="check" /> {isEdit ? "Save" : "Add"} User
            </button>
          </div>
        </div>
      </form>
    </AuthenticatedPage>
  );
}

