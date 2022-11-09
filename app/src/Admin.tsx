import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";

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
  dob: { op: Operator; date?: Date; min?: Date; max?: Date };
  ordering: { orderBy: "name" | "dob"; direction: "asc" | "desc" };
};

export default function Admin() {
  const { register, handleSubmit, watch } = useForm<FormValue>();

  const dateOperator = watch("dob.op");

  const [query, setQuery] = useState<Query>({});

  const { mutate, ...result } = useMutation(async (query: Query) => {
    const res = await fetch("/search", {
      method: "POST",
      body: JSON.stringify(query),
      headers: {
        "content-type": "application/json",
      },
    });

    return (await res.json()).records as unknown[];
  });

  return (
    <div className="py-4 px-6 max-w-full w-[800px] drop-shadow bg-white rounded mx-auto">
      <h2 className="text-2xl mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 gap-3">
        <h3 className="text-xl">Patient Search</h3>
        <form
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
                  max: value.dob.max.toISOString(),
                  min: value.dob.min.toISOString(),
                };
              }
            } else if (value.dob.date) {
              query.dob = {
                op: value.dob.op,
                value: value.dob.date.toISOString(),
              };
            }

            mutate(query);
          })}
        >
          <input
            className="py-2 px-4 text-lg w-full"
            placeholder="Search..."
            {...register("search")}
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
        <h3 className="text-lg mt-8">Results</h3>
        <div>No results. Please try a different query.</div>
        Data:
        {result.data?.map((x: any) => (
          <div className="p-2 border rounded">
            <span>{x.name}</span>
            <span>{x.comments}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
