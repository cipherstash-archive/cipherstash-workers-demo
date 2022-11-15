import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { PatientForm, PatientRecord } from "./PatientForm";
import { apiUrl } from "./utils";
import { Dialog } from "@headlessui/react";
import z from "zod";

type Operator = "lt" | "lte" | "gt" | "gte" | "eq" | "between";

type Query = Partial<{
  name: { op: "eq" | "match"; value: string };
  fuzzy: string;
  dob:
    | { value: string; op: "eq" | "gt" | "gte" | "lt" | "lte" }
    | { op: "between"; min: string; max: string };
  limit: number;
  offset: number;
  ordering: { orderBy: "name" | "dob"; direction: "asc" | "desc" };
}>;

type FormValue = {
  search: string;
  searchType: "fuzzy" | "name-fuzzy" | "name-exact";
  dob: { op: Operator; date?: string; min?: string; max?: string };
  ordering: { orderBy: "name" | "dob"; direction: "asc" | "desc" };
};

const SearchResponse = z.object({ records: z.array(PatientRecord) });
type SearchResponse = z.TypeOf<typeof SearchResponse>;

export function AdminSearch({ authorization }: { authorization: string }) {
  const { register, handleSubmit, watch } = useForm<FormValue>();

  const [selected, setSelected] = useState<SearchResponse["records"][number]>();

  const dateOperator = watch("dob.op");

  const { mutate, ...result } = useMutation(async (query: Query) => {
    const res = await fetch(apiUrl("/search"), {
      method: "POST",
      body: JSON.stringify(query),
      headers: {
        "content-type": "application/json",
        authorization,
        // authorization: `Basic ${btoa(`admin:${password}`)}`,
      },
      credentials: "include",
    });

    if (res.status !== 200) {
      throw new Error(`Search return non-200 status code: ${res.status}`);
    }

    return SearchResponse.parse(await res.json()).records;
  });

  return (
    <>
      <form
        className="grid grid-cols-1 gap-3"
        onSubmit={handleSubmit((value) => {
          const query: Query = {};

          if (value.searchType === "fuzzy") {
            query.fuzzy = value.search;
          }

          if (value.searchType === "name-fuzzy") {
            query.name = { op: "match", value: value.search };
          }

          if (value.searchType === "name-exact") {
            query.name = { op: "eq", value: value.search };
          }

          if (value.dob.op === "between") {
            if (value.dob.min && value.dob.max) {
              query.dob = {
                op: "between",
                max: new Date(value.dob.max).toISOString(),
                min: new Date(value.dob.min).toISOString(),
              };
            }
          } else if (value.dob.date) {
            query.dob = {
              op: value.dob.op,
              value: new Date(value.dob.date).toISOString(),
            };
          }

          if (value.ordering) {
            query.ordering = {
              ...value.ordering,
            };
          }

          mutate(query);
        })}
      >
        <input
          className="py-2 px-4 text-lg w-full"
          placeholder="Search..."
          {...register("search", { required: true })}
        />

        <label className="grid gap-1">
          <span className="text-sm">Search type</span>
          <select
            className="w-fit"
            defaultValue="fuzzy"
            {...register("searchType")}
          >
            <option value="fuzzy">Fuzzy</option>
            <option value="name-fuzzy">Name (fuzzy)</option>
            <option value="name-exact">Name (exact)</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <div className="grid grid-cols-1 gap-1">
            <span className="text-md">Date of Birth</span>
            <div className="flex flex-wrap gap-2 border rounded p-2 w-fit">
              <label className="grid gap-1">
                <span className="text-sm">Operator</span>
                <select
                  className="w-fit"
                  value={dateOperator}
                  {...register("dob.op")}
                >
                  <option value="eq">Eq</option>
                  <option value="lt">Lt</option>
                  <option value="lte">Lte</option>
                  <option value="gt">Gt</option>
                  <option value="gte">Gte</option>
                  <option value="between">Between</option>
                </select>
              </label>

              {dateOperator === "between" && (
                <>
                  <label className="grid gap-1">
                    <span className="text-sm">Min Date</span>
                    <input type="date" {...register("dob.min")} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm" {...register("dob.max")}>
                      Max Date
                    </span>
                    <input type="date" />
                  </label>
                </>
              )}

              {dateOperator !== "between" && (
                <label className="grid gap-1">
                  <span className="text-sm">Date</span>
                  <input type="date" {...register("dob.date")} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <span className="text-md">Ordering</span>

            <div className="flex flex-wrap gap-2 border rounded p-2 w-fit">
              <label className="grid gap-1">
                <span className="text-sm">Order by</span>
                <select
                  className="w-fit"
                  defaultValue="name"
                  {...register("ordering.orderBy")}
                >
                  <option value="name">Name</option>
                  <option value="dob">Date of Birth</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Direction</span>
                <select
                  className="w-fit"
                  defaultValue="asc"
                  {...register("ordering.direction")}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2 rounded drop-shadow-sm bg-blue-500 text-white font-bold hover:bg-blue-600"
        >
          Search
        </button>
      </form>
      {result.status !== "idle" && (
        <>
          <h3 className="text-lg mt-8">Results</h3>
          {result.status === "loading" && <div>Loading...</div>}
          {result.status === "error" && (
            <div>
              Search failed. <br />
              {String(result.error)}
            </div>
          )}
          {result.status === "success" && (
            <>
              {result.data.length === 0 && (
                <div>No results. Please try a different query.</div>
              )}
              {result.data.length > 0 && (
                <table className="rounded border overflow-hidden">
                  <thead>
                    <tr>
                      <td>Name</td>
                      <td>Date of Birth</td>
                      <td>Comments</td>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((x) => (
                      <tr className="pointer" onClick={() => setSelected(x)}>
                        <td>{x.name}</td>
                        <td>{new Date(x.dob).toLocaleDateString()}</td>
                        <td>{x.comments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
      <Dialog open={!!selected} onClose={() => setSelected(undefined)}>
        <div
          className="fixed inset-0 overflow-y-auto flex justify-center items-center bg-black/10"
          onClick={() => setSelected(undefined)}
        >
          <Dialog.Panel>
            <div
              className={
                "bg-white rounded drop-shadow max-w-full w-[600px] p-4"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <Dialog.Title>
                <h3 className={"text-xl"}>Selected Patient</h3>
              </Dialog.Title>
              <Dialog.Description>
                {selected && <PatientForm disabled hideSubmit value={selected} />}
              </Dialog.Description>
              <button onClick={() => setSelected(undefined)}>Close</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
