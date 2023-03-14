import Link from "next/link";
import { useRouter } from "next/router";
import { cls } from "./cls";

export function LinkNavigation({
  path,
  name,
  icon,
  badge,
}: {
  path: string;
  name: string;
  badge?: number;
  icon: React.ReactNode;
}) {
  const { pathname } = useRouter();
  const isActive = pathname === path;
  return (
    <div className="relative">
      {badge !== undefined && badge > 0 && (
        <span
          className={cls(
            "absolute z-10 -top-2 -right-3 px-1 min-w-[1.25rem] h-5 mr-1 text-sm shadow-md rounded-full inline-flex justify-center font-bold items-center",
            isActive
              ? "bg-rose-600 text-gray-700/90"
              : "bg-gray-300 text-gray-600"
          )}
        >
          {badge}
        </span>
      )}
      <Link
        href={path}
        className={cls(
          "flex font-semibold p-2 rounded-lg outline-transparent",
          isActive
            ? "text-rose-600 bg-rose-500/10"
            : "text-gray-300 bg-gray-500/20 hover:bg-gray-500/50"
        )}
      >
        {icon}

        <span className="ml-2">{name}</span>
      </Link>
    </div>
  );
}
