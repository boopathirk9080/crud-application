"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

// MUI Components for Alerts
import { Alert, Snackbar } from "@mui/material";

// Interface for Employee
interface Employee {
  id?: string;
  name: string;
  age: number | ""; // Allow empty string for initial state
  gender: string;
  occupation: string;
  phone: string;
  mail: string;
}

// Interface for Snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().min(2, "Too Short!").required("Name is required"),
  age: Yup.number()
    .typeError("Age must be a number")
    .required("Age is required")
    .positive()
    .integer(),
  gender: Yup.string()
    .oneOf(["male", "female", "other"])
    .required("Gender is required"),
  occupation: Yup.string().required("Occupation is required"),
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{9,14}$/, "Invalid phone number")
    .required("Phone is required"),
  mail: Yup.string().email("Invalid email").required("Email is required"),
});

export default function EmployeeForm() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id?.[0]; // Get id from dynamic route

  // --- MUI Component State ---
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const formik = useFormik<Employee>({
    initialValues: {
      name: "",
      age: "",
      gender: "",
      occupation: "",
      phone: "",
      mail: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      let error;
      if (employeeId) {
        // Update existing employee
        ({ error } = await supabase
          .from("Employee")
          .update(values)
          .eq("id", employeeId));
      } else {
        // Insert new employee
        ({ error } = await supabase.from("Employee").insert([values]));
      }

      setSubmitting(false);
      if (error) {
        setSnackbar({
          open: true,
          message: `Failed to save data: ${error.message}`,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: `Employee ${employeeId ? "updated" : "saved"} successfully!`,
          severity: "success",
        });
        // Redirect after a short delay to allow user to see the message
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    },
  });

  // Fetch employee data if in edit mode
  useEffect(() => {
    if (employeeId) {
      const fetchEmployeeData = async () => {
        const { data, error } = await supabase
          .from("Employee")
          .select("*")
          .eq("id", employeeId)
          .single();

        if (error) {
          console.error("Error fetching employee:", error);
          setSnackbar({
            open: true,
            message: "Could not fetch employee data.",
            severity: "error",
          });
          router.push("/");
        } else if (data) {
          formik.setValues(data);
        }
      };
      fetchEmployeeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, router]);

  // --- Snackbar Handler ---
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Helper to check for form errors
  const hasError = (fieldName: keyof Employee) =>
    formik.touched[fieldName] && Boolean(formik.errors[fieldName]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {employeeId ? "Edit Employee" : "Add New Employee"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Form Fields */}
            {(Object.keys(formik.initialValues) as Array<keyof Employee>).map(
              (key) =>
                key !== "id" &&
                key !== "gender" && (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key} *
                    </Label>
                    <Input
                      id={key}
                      name={key}
                      type={
                        key === "age"
                          ? "number"
                          : key === "mail"
                          ? "email"
                          : "text"
                      }
                      placeholder={`Enter ${key}`}
                      value={formik.values[key]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={hasError(key) ? "border-red-500" : ""}
                    />
                    {hasError(key) && (
                      <p className="text-sm text-red-500">
                        {formik.errors[key]}
                      </p>
                    )}
                  </div>
                )
            )}

            {/* Gender Radio Group */}
            <div className="space-y-3">
              <Label>Gender *</Label>
              <RadioGroup
                name="gender"
                value={formik.values.gender}
                onValueChange={(value) => formik.setFieldValue("gender", value)}
                className="flex gap-6"
              >
                {["male", "female", "other"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="capitalize">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {hasError("gender") && (
                <p className="text-sm text-red-500">{formik.errors.gender}</p>
              )}
              <div className="flex flex-col  gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={formik.isSubmitting || !formik.isValid}
                >
                  {formik.isSubmitting ? "Saving..." : "Save Employee"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
          </form>
        </CardContent>
      </Card>

      {/* --- MUI NOTIFICATION COMPONENT --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
