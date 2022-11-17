import { useState } from "react";
import { useMutation } from "react-query";
import AdminLink from "./AdminLink";
import { FormType, PatientForm } from "./PatientForm";
import { Spinner } from "./Spinner";
import { apiUrl } from "./utils";

export default function Home() {
  const [formId, setFormId] = useState(0);
  const { mutate, ...result } = useMutation(async (data: FormType) => {
    const response = await fetch(apiUrl("/secure"), {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
    });

    if (response.status !== 200) {
      throw new Error(`Recieved non-200 status code: ${response.status}`);
    }

    setFormId((x) => x + 1);
  });

  return (
    <>
      <AdminLink />
      <div className="py-4 px-6 max-w-full w-[800px] drop-shadow bg-white rounded mx-auto">
        <h2 className="text-2xl mb-4">Patient Information</h2>
        <p className="mb-4 text-sm text-gray-600">
          We want to collect your medical information for totally non-malicious
          reasons.
        </p>
        <div className="relative">
          <PatientForm
            key={formId}
            onSubmit={mutate}
            disabled={result.status === "loading"}
          />
          {result.status === "loading" && (
            <div className="flex absolute bg-white/60 left-0 top-0 w-full h-full z-10 items-center justify-center">
              <div className="flex flex-col gap-6 p-8 bg-white drop-shadow border items-center">
                <span className="text-xl">Submitting</span>
                <Spinner />
              </div>
            </div>
          )}
          {result.status === "success" && (
            <div className="text-green-500 py-4 font-bold">
              Successfully submitted form.
            </div>
          )}
          {result.status === "error" && (
            <div className="text-red-500 py-4">
              <span>Failed to submit patient information.</span>
              <br />
              Error: {String(result.error)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
