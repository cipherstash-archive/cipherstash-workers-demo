import { useForm, FieldError } from "react-hook-form";
import { cn } from "./utils";
import z from "zod";

function dateString() {
  return z.preprocess((x): Date | undefined => {
    if (typeof x === "string") {
      const date = new Date(x);

      if (!isNaN(Number(date))) {
        return date;
      }
    }

    return undefined;
  }, z.date());
}

export const PatientRecord = z.object({
  name: z.string(),
  dob: dateString(),
  phone: z.string(),
  gender: z.string(),
  socialSecurityNumber: z.string(),
  medicalConditions: z.string(),
  comments: z.string(),
});

export type FormType = z.TypeOf<typeof PatientRecord>;

function renderError(error?: FieldError) {
  if (error?.message) {
    return <span className="error">{error.message}</span>;
  }

  return null;
}

const TODAY = new Date().toISOString().split("T")[0];

export function PatientForm({
  disabled = false,
  hideSubmit,
  onSubmit,
  value,
}: {
  disabled?: boolean;
  hideSubmit?: boolean;
  value?: FormType;
  onSubmit?: (value: FormType) => void;
}) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormType>({
    mode: "onBlur",
    defaultValues: value,
  });

  return (
    <form
      className="relative grid gap-4 grid-cols-1"
      onSubmit={handleSubmit((data) => {
        onSubmit?.(data);
      })}
    >
      <label>
        <span>Name</span>
        <input
          type="text"
          className={cn(errors.name && "invalid")}
          {...register("name", {
            required: "Please enter your name",
            disabled,
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
            disabled,
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
            disabled,
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
            disabled,
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
            disabled,
          })}
        />
        {renderError(errors.socialSecurityNumber)}
      </label>
      <label>
        <span>Medial Conditions</span>
        <input
          type="text"
          className={cn(errors.medicalConditions && "invalid")}
          {...register("medicalConditions", { disabled })}
        />
        {renderError(errors.medicalConditions)}
      </label>
      <label>
        <span>Comments</span>
        <textarea
          className={cn(errors.comments && "invalid")}
          {...register("comments", { disabled })}
        />
        {renderError(errors.comments)}
      </label>
      {!hideSubmit && (
        <button type="submit" disabled={disabled}>
          Submit
        </button>
      )}
    </form>
  );
}
