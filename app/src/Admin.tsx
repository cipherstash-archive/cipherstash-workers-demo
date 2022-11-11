import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { apiUrl } from "./utils";
import { AdminSearch } from "./AdminSearch";

function SignIn({ onSuccess }: { onSuccess: (header: string) => void }) {
  type FormValue = { username: string; password: string };

  const { register, handleSubmit } = useForm<FormValue>({
    mode: "onBlur",
  });

  const { mutate, isLoading, isError } = useMutation(
    async (value: FormValue) => {
      const authorization = `Basic ${btoa(
        `${value.username}:${value.password}`
      )}`;

      const res = await fetch(apiUrl("/login"), {
        method: "POST",
        headers: {
          authorization,
        },
      });

      if (res.status !== 200) {
        throw new Error(`Search return non-200 status code: ${res.status}`);
      }

      onSuccess(authorization);
    }
  );

  return (
    <div className="border p-4 rounded grid gap-2">
      <h3 className="text-xl">Login</h3>
      <form
        className="grid grid-cols-1 gap-2"
        onSubmit={handleSubmit((value) => mutate(value))}
      >
        <label>
          <span>Username</span>
          <input
            type="text"
            disabled
            {...register("username", { value: "admin" })}
          />
        </label>
        <label>
          <span>Password</span>
          <input type="text" {...register("password", { required: true })} />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading && "Loading..."}
          {!isLoading && "Sign in"}
        </button>
      </form>
      {isError && (
        <span className="text-red-500">
          Failed to sign in. Please check your credentials
        </span>
      )}
    </div>
  );
}

export default function Admin() {
  const [authorization, setAuthorization] = useState<string>();

  return (
    <div className="py-4 px-6 drop-shadow bg-white rounded max-w-full w-[800px] mx-auto grid gap-2">
      <h2 className="text-2xl mb-2">Admin Dashboard</h2>
      {!authorization && <SignIn onSuccess={setAuthorization} />}
      {authorization && <AdminSearch authorization={authorization} />}
    </div>
  );
}
