import Link from "next/link";
import { useRouter } from "next/router";
import { cls } from "./cls";

export function LinkNavigation({
  path,
  name,
  icon,
}: {
  path: string;
  name: string;
  icon: React.ReactNode;
}) {
  const { pathname } = useRouter();
  return (
    <Link
      href={path}
      className={cls(
        "font-semibold p-2 rounded-lg outline-transparent",
        pathname === path
          ? "text-rose-600 bg-rose-500/10"
          : "text-gray-300 hover:bg-gray-500/20"
      )}
    >
      {icon}

      <span className="ml-2">{name}</span>
    </Link>
  );
}
