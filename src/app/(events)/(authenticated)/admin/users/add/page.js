'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import { useAuthPageLayoutContext } from "@/components/auth/authPageWrapper";
import SelectPicker from "@/components/form/SelectPicker";
import TextField from "@/components/form/TextField";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import { decodeURLParam, encodeURLParam } from "@/helper/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use ,useEffect, useState } from "react";
import {USERTYPE} from "@/constants";


export default function UserAddOrEditForm({ params }) {
  const initialData = {
    username: "",
    user_type: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_no: "",
    password: "",
    conf_password: ""
  };

  const router = useRouter();
  const { user_id } = use(params);

  const [decryptedUserId, setDecryptedUserId] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [showPasswordFields, setShowPasswordFields] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  const isEdit = !!user_id;

  const { setPageTitle, toggleProgressBar, toast } = useAppLayoutContext();
  const { toggleBreadcrumbs } = useAuthPageLayoutContext();

  const onFieldValueChanged = (value, fieldName) => {
    const newVal = typeof value === "object" ? value.target.value : value;

    setFormData(prev => {
      const updated = { ...prev, [fieldName]: newVal };

      // 🔄 Live remove mismatch error when passwords match
      if (updated.password === updated.conf_password) {
        setFormErrors(prevErr => {
          const { password, conf_password, ...rest } = prevErr;
          return rest;
        });
      }

      return updated;
    });
  };


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


  const onSubmit = async (e) => {
    e.preventDefault();
    toggleProgressBar(true);

    // ----------------------------
    //Validate Password Fields
    // ----------------------------
    let errors = {};
    let hasError = false;

    if (showPasswordFields) {
      const { password, conf_password } = formData;

      // Required only on Add (not Edit)
      if (!isEdit) {
        if (!password) {
          errors.password = "Password is required";
          hasError = true;
        }
        if (!conf_password) {
          errors.conf_password = "Confirm Password is required";
          hasError = true;
        }
      }

      // Check match only if both filled
      if ((password || conf_password) && password !== conf_password) {
        errors.password = "Passwords do not match";
        errors.conf_password = "Passwords do not match";
        hasError = true;
      }
    }

    //Stop submit if password errors
    if (hasError) {
      setFormErrors(errors);
      toast("error", "Please fix the errors before submitting.");
      toggleProgressBar(false);
      return;
    }

    // ----------------------------
    // Prepare Submit Data
    // ----------------------------
    try {
      const submitData = {
        id: decryptedUserId,
        ...formData
      };
      
      // ----------------------------
      // API Request
      // ----------------------------
      HttpClient({
        url: "/users/save",
        method: "POST",
        data: submitData,
      })
        .then((res) => {
          let success = false,
            message = "Unable to save the user data!",
            newErrors = {},
            userId = decryptedUserId;

          if (res) {
            if (res.success) {
              userId = res.data.id || decryptedUserId;
            } else if (res.errors) {
              newErrors = { ...res.errors };
            }

            success = res.success;
            message =
              res.message ||
              (success
                ? "The User record has been updated successfully."
                : "Unable to save the user data!");
          }

          setFormErrors({ ...newErrors });
          toast(success ? "success" : "error", message);

          toggleProgressBar(false);

          if (success) {
            router.push("/admin/users");
          }
        })
        .catch((err) => {
          toggleProgressBar(false);

          const errors = err.response?.errors;
          const message =
            err.response?.message ||
            "Error occurred when trying to save the User data.";

          if (message) {
            toast("error", message);
          } else {
            setFormErrors(errors || {});
          }
        });
    } catch (error) {
      toggleProgressBar(false);
      toast("error", "Error occurred when trying to save the User data.");
    }
  };


  useEffect(() => {
    if (isEdit) {
      const dec = decodeURLParam(user_id);
      setDecryptedUserId(dec);
      if (dec) {
        loadExistingUser(dec);
      }
      setShowPasswordFields(false);
      // setShowAlert(false); // Hide alert in edit mode
    } else {
      setShowPasswordFields(true);
    }

    setPageTitle(isEdit ? "Edit User" : "Add User");
    toggleProgressBar(false);
    toggleBreadcrumbs({ Users: "/admin/users", [`${(isEdit ? 'Edit': 'Add')} User`] : null });

  }, [user_id, isEdit]);

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="card">
          <div className="card-body">


            {/* BASIC DETAILS */}
            <div className="row mt-3">

              <div className="col-lg-4">
                <TextField
                  label="User Name"
                  value={formData.username}
                  name="username"
                  onChange={(e) => onFieldValueChanged(e, "username")}
                  isRequired
                  autoFocus
                  error={formErrors.username}
                />
              </div>

              <div className="col-lg-4">
                <TextField 
                  label="First Name" 
                  value={formData.first_name}
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

              <div className="col-lg-4">
                <SelectPicker
                  options={USERTYPE}
                  label="User Type"
                  placeholder="Select User Type"
                  isRequired
                  value={formData.user_type}
                  onChange={(e) => onFieldValueChanged(e, "user_type")}
                  error={formErrors.user_type}
                />
              </div>

            </div>

            {/* ... (Rest of the form structure: Change Password, Password Fields, Buttons) */}

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
            <Link href={"/admin/users"} className="btn btn-secondary">
              Cancel
            </Link>

            <button className="btn btn-primary" type="submit">
              <AppIcon ic="check" /> {isEdit ? "Save" : "Add"} User
            </button>
          </div>
        </div>
      </form>
    </>
  );
}