import { useQuery } from "react-query";

export default function Admin() {
  // const data = useQuery();

  return (
    <div className="py-4 px-6 max-w-full drop-shadow bg-white rounded mx-auto">
      <h2 className="text-xl mb-2">Admin Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg">Patient Search</h3>
        </div>
        <div>
          <h3>Current Thing</h3>
        </div>
      </div>
    </div>
  );
}
