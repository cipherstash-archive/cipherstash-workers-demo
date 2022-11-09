import { useState } from "react";
import { useQuery } from "react-query";

type Operator = "lt" | "lte" | "gt" | "gte" | "eq" | "between";

export default function Admin() {
  const [dateOperator, setDateOperator] = useState<Operator>("lt");

  const { refetch } = useQuery([], async () => {}, {
    enabled: false,
  });

  return (
    <div className="py-4 px-6 max-w-full w-[800px] drop-shadow bg-white rounded mx-auto">
      <h2 className="text-2xl mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 gap-3">
        <h3 className="text-xl">Patient Search</h3>
        <input className="py-2 px-4 text-lg w-full" placeholder="Search..." />

        <label className="grid gap-1">
          <span className="text-sm">Search type</span>
          <select className="w-fit" defaultValue="fuzzy">
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
                  onChange={(e) => setDateOperator(e.target.value as Operator)}
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
                    <input type="date" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">Max Date</span>
                    <input type="date" />
                  </label>
                </>
              )}

              {dateOperator !== "between" && (
                <label className="grid gap-1">
                  <span className="text-sm">Date</span>
                  <input type="date" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <span className="text-md">Ordering</span>

            <div className="flex flex-wrap gap-2 border rounded p-2 w-fit">
              <label className="grid gap-1">
                <span className="text-sm">Order by</span>
                <select className="w-fit" defaultValue="fuzzy">
                  <option value="name">Name</option>
                  <option value="dob">Date of Birth</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Direction</span>
                <select className="w-fit" defaultValue="asc">
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <button
          className="px-6 py-2 rounded drop-shadow-sm bg-blue-500 text-white font-bold hover:bg-blue-600"
          onClick={() => refetch()}
        >
          Search
        </button>

        <h3 className="text-lg mt-8">Results</h3>

        <div>No results. Please try a different query.</div>

        <div></div>
      </div>
    </div>
  );
}
