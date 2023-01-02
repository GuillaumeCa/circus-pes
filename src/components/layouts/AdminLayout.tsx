import {
  InboxArrowDownIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { LinkButton } from "../Button";
import { BaseLayout } from "./BaseLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <BaseLayout>
      <div className="mt-2 flex space-x-2">
        <LinkButton href="/admin/items" btnType="secondary">
          <InboxArrowDownIcon className="h-6 w-6" />
          <span className="ml-1">Publications</span>
        </LinkButton>
        <LinkButton href="/admin/game-versions" btnType="secondary">
          <RectangleStackIcon className="h-6 w-6" />
          <span className="ml-1">Versions</span>
        </LinkButton>
        <LinkButton href="/admin/users" btnType="secondary">
          <UserCircleIcon className="h-6 w-6" />
          <span className="ml-1">Utilisateurs</span>
        </LinkButton>
      </div>

      <h2 className="text-2xl mt-3">{title}</h2>

      {children}
    </BaseLayout>
  );
}
