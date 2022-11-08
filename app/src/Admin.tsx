import { useQuery } from "react-query";

export default function Admin() {
  // const data = useQuery();

  return (
    <div className="py-4 px-6 max-w-full drop-shadow bg-white rounded mx-auto">
      <h2 className="text-xl mb-2">Admin Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <h3 className="text-lg">Patient Search</h3>
          <input className="py-2 px-4 text-lg w-full" placeholder="Search..." />
          Type: fuzzy
          <br />
          <label className="grid gap-1 w-fit">
            <span className="text-sm">Date</span>
            <input type="date" />
          </label>
        </div>
        <div>
          <h3>Current Thing</h3>
        </div>
      </div>
    </div>
  );
}
