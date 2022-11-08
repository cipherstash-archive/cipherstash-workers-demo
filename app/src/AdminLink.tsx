import { Link } from "react-router-dom";

export default function AdminLink() {
  return (
    <Link to={"/admin"}>
      <span
        className="flex items-center justify-center bg-white w-8 h-8 pb-1 border-2 border-black rounded-full text-center mb-4"
        aria-label="secret button"
      >
        <span className="text-lg font-bold">π</span>
      </span>
    </Link>
  );
}
