'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import AuthenticatedPage from "@/components/auth/authPageWrapper";
import SelectPicker from "@/components/form/SelectPicker";
import TextField from "@/components/form/TextField";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
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
    lcl_style: ""   
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
          lcl_style: settings.lcl_style || "Line"
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
                {t("Control Limit Styles")}
                {!isEditing && (
                  <button 
                    className="btn btn-primary ms-3" 
                    onClick={() => setEditing(true)}
                  >
                    <AppIcon ic="pencil" /> {t("Edit")}
                  </button>
                )}
              </h5>

              <div className="row">
                {/* Upper Control Limit (UCL) Settings */}
                <div className="col-md-6 border-end">
                  <h5 className="text-center mb-4 text-primary">
                    {t("UCL")} (Upper Control Limit)
                  </h5>

                  <TextField 
                    label={t("Colour")} 
                    type="color" 
                    value={form.ucl_colour}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_colour", value)}
                    className="mb-3" 
                  />
                   
                  <SelectPicker
                    label={t("Style")}
                    options={["Line", "Dotted"]}
                    value={form.ucl_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_style", value)}
                  />
                </div>

                {/* Lower Control Limit (LCL) Settings */}
                <div className="col-md-6">
                  <h5 className="text-center mb-4 text-danger">
                    {t("LCL")} (Lower Control Limit)
                  </h5>
                  <TextField 
                    label={t("Colour")} 
                    type="color" 
                    value={form.lcl_colour}
                    disabled={!isEditing}
                    onChange={value => handleChange("lcl_colour", value)}
                    className="mb-3" 
                  />
                   
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

          {/* SAVE/CANCEL BUTTONS */}
          {isEditing && (
            <div className="text-end mt-3">
               <button 
                className="btn btn-secondary me-2" 
                onClick={() => {
                  setEditing(false);
                  loadSettings(); // Reloads original data to discard user changes
                }}
              >
                {t("Cancel")}
              </button>

              <button className="btn btn-primary" onClick={ChartSettingsSave}>
                <AppIcon ic="save" /> {t("Save")}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedPage>
  );
}