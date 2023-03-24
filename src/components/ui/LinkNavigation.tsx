import { CogIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { cls } from "../../utils/cls";
import { trpc } from "../../utils/trpc";
import { LinkButton } from "./Button";

export function AdminPageLink() {
  const itemsPending = trpc.item.pendingCount.useQuery();
  const responsesPending = trpc.response.pendingCount.useQuery();
  const isLoading = itemsPending.isLoading && responsesPending.isLoading;

  const pendingTotal =
    (itemsPending?.data ?? 0) + (responsesPending?.data ?? 0);

  return (
    <div className="relative">
      {!isLoading && pendingTotal > 0 && (
        <span
          className={cls(
            "absolute z-10 -top-2 -right-3 px-1 min-w-[1.25rem] h-5 mr-1 text-sm shadow-md rounded-full inline-flex justify-center font-bold items-center bg-white text-gray-800"
          )}
        >
          {pendingTotal}
        </span>
      )}
      <LinkButton href="/admin/items" btnType="secondary">
        <CogIcon className="h-6 w-6" />
        <span className="ml-1">Admin</span>
      </LinkButton>
    </div>
  );
}

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
