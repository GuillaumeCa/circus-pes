import {
  ChatBubbleLeftEllipsisIcon,
  InboxArrowDownIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { trpc } from "../../utils/trpc";
import { UserRole } from "../../utils/user";
import { LinkNavigation } from "../LinkNavigation";
import { BaseLayout } from "./BaseLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data, status } = useSession();
  const { replace } = useRouter();

  const itemsPending = trpc.item.pendingCount.useQuery();
  const responsesPending = trpc.response.pendingCount.useQuery();

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
      <div className="my-5 flex flex-col sm:flex-row gap-3">
        <LinkNavigation
          path="/admin/items"
          icon={<InboxArrowDownIcon className="h-6 w-6 inline" />}
          name="Publications"
          badge={!itemsPending.isLoading ? itemsPending.data : undefined}
        />
        <LinkNavigation
          path="/admin/responses"
          icon={<ChatBubbleLeftEllipsisIcon className="h-6 w-6 inline" />}
          name="Réponses"
          badge={
            !responsesPending.isLoading ? responsesPending.data : undefined
          }
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
