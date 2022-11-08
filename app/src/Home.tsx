import { useState } from "react";
import { useForm, FieldError } from "react-hook-form";
import AdminLink from "./AdminLink";
import { Spinner } from "./Spinner";
import { cn } from "./utils";

interface FormType {
  name: string;
  dob: Date;
  phone: string;
  gender: string;
  socialSecurityNumber: string;
  medicalConditions: string;
  comments: string;
}

function renderLabel(error?: FieldError) {
  if (error?.type === "required") {
    return <span className="error">*</span>;
  }

  return null;
}

function renderError(error?: FieldError) {
  if (error?.message) {
    return <span className="error">{error.message}</span>;
  }

  return null;
}

const TODAY = new Date().toISOString().split("T")[0];

export default function Home() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormType>({
    mode: "onBlur",
  });

  const [data, setData] = useState<unknown>();
  const [loading, setLoading] = useState(false);

  return (
    <>
      <AdminLink />
      <div className="py-4 px-6 max-w-full w-[800px] drop-shadow bg-white rounded mx-auto">
        <h2 className="text-xl mb-2">Patient Information</h2>
        <p className="mb-4 text-sm text-gray-600">
          We want to collect your medical information for totally non-malicious
          reasons.
        </p>
        <form
          className="relative grid gap-4 grid-cols-1"
          onSubmit={handleSubmit((data) => {
            setData(data);
            setLoading(true);
          })}
        >
          {loading && (
            <div className="flex absolute bg-white/60 left-0 top-0 w-full h-full z-10 items-center justify-center">
              <div className="flex flex-col gap-6 p-8 bg-white drop-shadow border items-center">
                <span className="text-xl">Submitting</span>
                <Spinner />
              </div>
            </div>
          )}
          <label>
            <span>Name</span>
            <input
              type="text"
              className={cn(errors.name && "invalid")}
              {...register("name", {
                required: "Please enter your name",
              })}
            />
            {renderError(errors.name)}
          </label>
          <label>
            <input
              type="date"
              max={TODAY}
              className={cn(errors.dob && "invalid")}
              {...register("dob", {
                validate: (date) => {
                  if (isNaN(Number(date))) {
                    return "Please enter a valid date";
                  }
                },
                valueAsDate: true,
              })}
            />
            {renderError(errors.dob)}
          </label>
          <label>
            <span>Phone number</span>
            <input
              type="text"
              className={cn(errors.phone && "invalid")}
              {...register("phone", {
                required: "Please enter your phone number",
              })}
            />
            {renderError(errors.phone)}
          </label>
          <label>
            <span>Gender</span>
            <input
              type="text"
              className={cn(errors.gender && "invalid")}
              {...register("gender", {
                required: "Please enter your gender",
              })}
            />
            {renderError(errors.gender)}
          </label>
          <label>
            <span>Social Security Number</span>
            <input
              type="text"
              className={cn(errors.socialSecurityNumber && "invalid")}
              {...register("socialSecurityNumber", {
                required: "Please enter your social security number",
              })}
            />
            {renderError(errors.socialSecurityNumber)}
          </label>
          <label>
            <span>Medial Conditions</span>
            <input
              type="text"
              className={cn(errors.medicalConditions && "invalid")}
              {...register("medicalConditions")}
            />
            {renderError(errors.medicalConditions)}
          </label>
          <label>
            <span>Comments</span>
            <textarea
              className={cn(errors.comments && "invalid")}
              {...register("comments")}
            />
            {renderError(errors.comments)}
          </label>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <button type="submit" disabled={loading}>
            Submit
          </button>
        </form>
      </div>
    </>
  );
}
