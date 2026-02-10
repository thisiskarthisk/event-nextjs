'use client';

import {use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAppLayoutContext } from "@/components/appLayout";
import { useAuthPageLayoutContext } from "@/components/auth/authPageWrapper";
import TextField from "@/components/form/TextField";
import SelectPicker from "@/components/form/SelectPicker";
import AppIcon from "@/components/icon";

import { HttpClient } from "@/helper/http";
import { decodeURLParam } from "@/helper/utils";
import { ACTIVITY_CATEGORIES, MEAL_TYPES } from "@/constants";

export default function EventActivityAddOrEditForm({ params }) {

  const { event_id, id } = use(params); // const { event_id, id } = params;

  // const decodedEventId = decodeURLParam(event_id);
  // const decodedActivityId = id
  //   ? decodeURLParam(id)
  //   : null;

  // const isEdit = Boolean(decodedActivityId);
  const isEdit = Boolean(id);

  const router = useRouter();

  const { setPageTitle, toggleProgressBar, toast } =
    useAppLayoutContext();

  const { toggleBreadcrumbs } =
    useAuthPageLayoutContext();

  // -----------------------
  // STATE
  // -----------------------
  const [formData, setFormData] = useState({
    activity_name: "",
    description: "",
    start_datetime: "",
    end_datetime: "",
    activity_category: "",
    meal_type: "",
    multiple_allowed: false,
  });

  // -----------------------
  // Helpers
  // -----------------------
  const toLocalDatetime = (val) => {
    if (!val) return "";
    const d = new Date(val);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const onFieldValueChanged = (value, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -----------------------
  // LOAD EDIT DATA
  // -----------------------
  const loadExistingActivity = async () => {
    toggleProgressBar(true);

    try {
      const res = await HttpClient({
        url: `/events/${event_id}/event_activities/get`,
        method: "GET",
        params: { id },
      });

      if (!res?.success || !res.data) {
        toast("error", "Failed to load activity.");
        return;
      }

      const act = res.data;

      setFormData({
        activity_name: act.activity_name ?? "",
        description: act.description ?? "",
        start_datetime: toLocalDatetime(act.start_datetime),
        end_datetime: toLocalDatetime(act.end_datetime),
        activity_category: act.activity_category ?? "",
        meal_type: act.meal_type ?? "",
        multiple_allowed: Boolean(act.multiple_allowed),
      });

    } catch (err) {
      console.error(err);
      toast("error", "Error loading activity.");
    } finally {
      toggleProgressBar(false);
    }
  };

  // -----------------------
  // INIT
  // -----------------------
  useEffect(() => {
    toggleProgressBar(false);
    setPageTitle(isEdit ? "Edit Activity" : "Add Activity");

    toggleBreadcrumbs({
      Events: "/events",
      Activities: `/events/${event_id}/event_activities`,
      [isEdit ? "Edit Activity" : "Add Activity"]: null,
    });

    if (isEdit) {
      loadExistingActivity();
    }
  }, []);

  // -----------------------
  // SUBMIT
  // -----------------------
  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      id,
    };

    if (isEdit) {
      payload.id = id;
    }

    try {
      const res = await HttpClient({
        url: `/events/${event_id}/event_activities/save`,
        method: "POST",
        data: payload,
      });

      toast(
        res.success ? "success" : "error",
        res.message || "Save failed"
      );

      if (res.success) {
        router.push(
          `/events/${event_id}/event_activities`
        );
      }

    } catch (err) {
      console.error(err);
      toast("error", "Save failed.");
    }
  };

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <form onSubmit={onSubmit}>

      <div className="card">
        <div className="card-body">

          <div className="row mt-3">
            <div className="col-lg-4">
              <TextField
                label="Activity Name"
                value={formData.activity_name}
                onChange={(v) => onFieldValueChanged(v, "activity_name")}
                isRequired
              />
            </div>

            <div className="col-lg-4">
              <TextField
                label="Description"
                value={formData.description}
                onChange={(v) => onFieldValueChanged(v, "description")}
              />
            </div>

            <div className="col-lg-4">
              <TextField
                label="Start Date"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(v) => onFieldValueChanged(v, "start_datetime")}
                isRequired
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-lg-4">
              <TextField
                label="End Date"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(v) => onFieldValueChanged(v, "end_datetime")}
                isRequired
              />
            </div>

            <div className="col-lg-4">
              <SelectPicker
                label="Activity Category"
                value={formData.activity_category}
                onChange={(v) => onFieldValueChanged(v, "activity_category")}
                options={ACTIVITY_CATEGORIES}
                isRequired
              />
            </div>

            {formData.activity_category === "food" && (
              <div className="col-lg-4">
                <SelectPicker
                  label="Meal Type"
                  value={formData.meal_type}
                  onChange={(v) => onFieldValueChanged(v, "meal_type")}
                  options={MEAL_TYPES}
                  isRequired
                />
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12 d-flex justify-content-between">
          <Link
            href={`/events/${event_id}/event-activities`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>

          <button className="btn btn-primary" type="submit">
            <AppIcon ic="check" />
            {isEdit ? " Save" : " Add"} Activity
          </button>
        </div>
      </div>

    </form>
  );
}
