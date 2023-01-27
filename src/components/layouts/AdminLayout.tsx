import {
  ChatBubbleLeftEllipsisIcon,
  InboxArrowDownIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { UserRole } from "../../utils/user";
import { cls } from "../cls";
import { BaseLayout } from "./BaseLayout";

function AdminLinkItem({
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data, status } = useSession();
  const { replace } = useRouter();

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (data && data.user.role !== UserRole.ADMIN)
    ) {
      replace("/");
    }
  }, [data, status, replace]);

  return (
    <BaseLayout>
      <div className="my-5 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
        <AdminLinkItem
          path="/admin/items"
          icon={<InboxArrowDownIcon className="h-6 w-6 inline" />}
          name="Publications"
        />
        <AdminLinkItem
          path="/admin/responses"
          icon={<ChatBubbleLeftEllipsisIcon className="h-6 w-6 inline" />}
          name="Réponses"
        />
        <AdminLinkItem
          path="/admin/patch-versions"
          icon={<RectangleStackIcon className="h-6 w-6 inline" />}
          name="Versions"
        />
        <AdminLinkItem
          path="/admin/users"
          icon={<UserCircleIcon className="h-6 w-6 inline" />}
          name="Utilisateurs"
        />
      </div>

      {children}
    </BaseLayout>
  );
}
