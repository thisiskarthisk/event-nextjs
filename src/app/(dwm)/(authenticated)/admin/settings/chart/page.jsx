'use client';

import { useAppLayoutContext } from "@/components/appLayout";
import SelectPicker from "@/components/form/SelectPicker";
import TextField from "@/components/form/TextField";
import { useI18n } from "@/components/i18nProvider";
import AppIcon from "@/components/icon";
import { HttpClient } from "@/helper/http";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CHART_LINE_TYPES, CHART_RESPONSES_LINE_STYLE, DEFAULT_CHART_SETTINGS } from "@/constants";
import { useSession } from "next-auth/react";
export default function ChartSettings() {
  const { setPageTitle, toggleProgressBar , toast, setLHSAppBarMenuItems } = useAppLayoutContext();
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  const [isEditing, setEditing] = useState(false);

  const [form, setForm] = useState({
    ...DEFAULT_CHART_SETTINGS,
  });

  // console.log(form.ucl_line_style);

  useEffect(() => {
    setPageTitle(t('Chart Settings'));
    toggleProgressBar(false);
  }, []);

  useEffect(() => {
    if (status == 'authenticated') {
      loadSettings();
    }
  }, [status]);

  useEffect(() => {
    if (!isEditing) {
      setLHSAppBarMenuItems([
        {
          icon: "pencil",
          className: "text-primary",
          tooltip: "Edit",
          text: "Edit",
          onClick: () => setEditing(true)
        }
      ]);
    } else {
      setLHSAppBarMenuItems([]);
    }

    return () => {
      setLHSAppBarMenuItems([]);
    }
  }, [isEditing]);

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
          ...DEFAULT_CHART_SETTINGS,
          ...settings
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

    const settingsArray = Object.keys(form)
      .filter(key => form[key] !== undefined && form[key] !== null)
      .map(key => ({
        field_name: key,
        value: form[key]
    }));

    console.log("Settings Array:", settingsArray);
    
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
    <>
      <div className="row">
        {/* --- Employee ID Card --- */}
        <h5> Trand and Control Chart </h5>
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
                    label={t("Color")} 
                    type="color"
                    value={form.ucl_line_color}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_line_color", value)}
                    className="mb-3" 
                  />
                </div>

                <div className="col-6">
                  <SelectPicker
                    label={t("Style")}
                    options={CHART_LINE_TYPES}
                    value={form.ucl_line_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("ucl_line_style", value)}
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
                  <h6>Lower Control Limit</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField 
                    label={t("Color")} 
                    type="color" 
                    value={form.lcl_line_color}
                    disabled={!isEditing}
                    onChange={value => handleChange("lcl_line_color", value)}
                    className="mb-3" 
                  />
                </div>

                <div className="col-6">
                  <SelectPicker
                    label={t("Style")}
                    options={CHART_LINE_TYPES}
                    value={form.lcl_line_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("lcl_line_style", value)}
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
                    value={form.outlier_dot_color}
                    disabled={!isEditing}
                    onChange={value => handleChange("outlier_dot_color", value)}
                    className="mb-3" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="col-lg-4 mt-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Responses Line Style</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField 
                    label={t("Line Color")} 
                    type="color" 
                    value={form.responses_line_color}
                    disabled={!isEditing}
                    onChange={value => handleChange("responses_line_color", value)}
                    className="mb-3" 
                  />
                </div>
                <div className="col-6">
                  <SelectPicker
                    label={t("Line Style")}
                    options={CHART_RESPONSES_LINE_STYLE}
                    value={form.responses_line_curve_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("responses_line_curve_style", value)}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
        
        <hr className="my-4" />

        <h5> Trand Chart </h5>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <h6>Target Color</h6>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-6">
                  <TextField 
                    label={t("Target Line Color")} 
                    type="color" 
                    value={form.target_line_color}
                    disabled={!isEditing}
                    onChange={value => handleChange("target_line_color", value)}
                    className="mb-3" 
                  />
                </div>

                <div className="col-6">
                  <SelectPicker
                    label={t("Style")}
                    options={CHART_LINE_TYPES}
                    value={form.target_line_style}
                    disabled={!isEditing}
                    onChange={value => handleChange("target_line_style", value)}
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
    </>
  );
}