'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import SelectPicker from "@/components/form/SelectPicker";
import TextField from "@/components/form/TextField";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChartSettings() {
  const { setPageTitle, toggleProgressBar , toast } = useAppLayoutContext();
  const { t, locale } = useI18n();

  const [isEditing, setEditing] = useState(false);

  // Define initial state for Chart settings with defaults
  // These keys correspond to field_name values in your database
  const [form, setForm] = useState({
    ucl_colour: "", 
    ucl_style: "",  
    lcl_colour: "", 
    lcl_style: "" ,
    outlier_colour: ""

  });

  useEffect(() => {
    setPageTitle(t('Settings'));
    toggleProgressBar(false);
    loadSettings();
  }, [locale, t, setPageTitle, toggleProgressBar]);

  /** Handle input/select changes */
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  /** LOAD SETTINGS (group=chart) */
  async function loadSettings() {
    try {
      const res = await HttpClient({
        url: '/settings/get',
        method: "GET",
        params: { group: "chart" },
      }); // Assumes HttpClient returns a Promise that resolves to the response object

      if (res.success) {
        const settings = res.data;
        setForm({
          ucl_colour: settings.ucl_colour || "#0000ffff",
          ucl_style: settings.ucl_style || "Line",
          lcl_colour: settings.lcl_colour || "#FF0000",
          lcl_style: settings.lcl_style || "Line",
          outlier_colour: settings.outlier_colour || "#ff5100ff"
        });
      }
    } catch (e) {
      console.error("Load settings failed:", e);
      toast(error ? "error" : "warning", e.message || "Load chart settings failed");
    } finally {
      // loading
      toggleProgressBar(false);
    }
  }


  const ChartSettingsSave = async (e) => {
    e.preventDefault();
    toggleProgressBar(true);

    // Transform form object into the array structure required by the backend API
    const settingsArray = Object.keys(form).map(key => ({
      field_name: key, // The key from the form state (e.g., ucl_colour)
      value: form[key]  // The user-entered or selected value
    }));
    
    const payload = {
      setting_group: "chart", // Sends the group name to the backend
      settings: settingsArray
    };

    // Use await with your custom HttpClient
    try {
      HttpClient({
        url: '/settings/save',
        method: "POST",
        data: { ...payload },
      }).then(res => {
        toggleProgressBar(false);
        if (res.success) {
          setEditing(false);
          loadSettings(); 
          toast('success', 'Settings saved successfully.');
        } else {
          toast('error', res.message || 'Error saving settings');
        }
      }).catch(err => {
        toggleProgressBar(false);
        const errors = err.response.errors;
        if (errors) {
          toast('error', errors);
        }
      });
    } catch (error) {
      toggleProgressBar(false);

      toast('error', 'Error occurred when trying to save the User data.');
    }
  };


  return (
    <AuthenticatedPage>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="d-flex align-items-center mb-4">
                {t("Chart Settings")}
                {!isEditing && (
                  <button 
                    className="btn btn-primary ms-3" 
                    onClick={() => setEditing(true)}
                  >
                    <AppIcon ic="pencil" /> {t("Edit")}
                  </button>
                )}
              </h5>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        {/* --- Employee ID Card --- */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Upper Control Limit</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField 
                    label={t("Colour")} 
                    type="color" 
                    value={form.ucl_colour}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_colour", value)}
                    className="mb-3" 
                  />
                </div>

                <div className="col-6">
                  <SelectPicker
                    label={t("Style")}
                    options={["Line", "Dotted"]}
                    value={form.ucl_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_style", value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Upper Control Limit</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField 
                    label={t("Colour")} 
                    type="color" 
                    value={form.lcl_colour}
                    disabled={!isEditing}
                    onChange={value => handleChange("lcl_colour", value)}
                    className="mb-3" 
                  />
                </div>

                <div className="col-6">
                  <SelectPicker
                    label={t("Style")}
                    options={["Line", "Dotted"]}
                    value={form.lcl_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("lcl_style", value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Outlier Color</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-12">
                  <TextField 
                    label={t("Exceeding outlier Identification color")} 
                    type="color" 
                    value={form.outlier_colour}
                    disabled={!isEditing}
                    onChange={value => handleChange("outlier_colour", value)}
                    className="mb-3" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-3">
        {isEditing && (
          <div className="col-12 flex-space-between">
            <Link 
                href="#" 
                className="btn btn-secondary"
                onClick = {() => {setEditing(false);
                  loadSettings();
                }}>
              Cancel
            </Link>

            <button className="btn btn-primary" type="submit" onClick={ChartSettingsSave}>
              <AppIcon ic="check" /> Save
            </button>
          </div>
        )}
      </div>
    </AuthenticatedPage>
  );
}