import {
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
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { data, status } = useSession();
  const { replace, pathname } = useRouter();

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
          path="/admin/patch-versions"
          icon={<RectangleStackIcon className="h-6 w-6 inline" />}
          name="Versions"
        />
        <AdminLinkItem
          path="/admin/users"
          icon={<UserCircleIcon className="h-6 w-6 inline" />}
          name="Utilisateurs"
        />

        {/* <LinkButton href="/admin/items" btnType="secondary">
          <InboxArrowDownIcon className="h-6 w-6" />
          <span className="ml-1">Publications</span>
        </LinkButton>
        <LinkButton href="/admin/patch-versions" btnType="secondary">
          <RectangleStackIcon className="h-6 w-6" />
          <span className="ml-1">Versions</span>
        </LinkButton>
        <LinkButton href="/admin/users" btnType="secondary">
          <UserCircleIcon className="h-6 w-6" />
          <span className="ml-1">Utilisateurs</span>
        </LinkButton> */}
      </div>

      {/* <h2 className="text-2xl mt-3">{title}</h2> */}

      {children}
    </BaseLayout>
  );
}
