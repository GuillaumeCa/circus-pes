import {
  ChatBubbleLeftEllipsisIcon,
  InboxArrowDownIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { UserRole } from "../../utils/user";
import { LinkNavigation } from "../LinkNavigation";
import { BaseLayout } from "./BaseLayout";

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
        <LinkNavigation
          path="/admin/items"
          icon={<InboxArrowDownIcon className="h-6 w-6 inline" />}
          name="Publications"
        />
        <LinkNavigation
          path="/admin/responses"
          icon={<ChatBubbleLeftEllipsisIcon className="h-6 w-6 inline" />}
          name="Réponses"
        />
        <LinkNavigation
          path="/admin/patch-versions"
          icon={<RectangleStackIcon className="h-6 w-6 inline" />}
          name="Versions"
        />
        <LinkNavigation
          path="/admin/users"
          icon={<UserCircleIcon className="h-6 w-6 inline" />}
          name="Utilisateurs"
        />
      </div>

      {children}
    </BaseLayout>
  );
}
