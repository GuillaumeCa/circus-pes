import { CogIcon, InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Button } from "../ui/Button";
import { LinkNavigation } from "../ui/LinkNavigation";
import { BaseLayout } from "./BaseLayout";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, status } = useSession();
  const router = useRouter();
  const intl = useIntl();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return (
      <BaseLayout>
        <div className="mt-5 p-4 bg-gray-600 rounded-lg flex justify-between">
          <div className="flex items-center">
            <img
              src={data.user.image ?? ""}
              className="rounded-full w-16 h-16"
            />
            <h2 className="text-3xl font-semibold ml-3">{data.user.name}</h2>
          </div>
          <div className="mt-3">
            <Button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              btnType="secondary"
            >
              <FormattedMessage id="logout" defaultMessage="Se déconnecter" />
            </Button>
          </div>
        </div>
        <div className="my-5 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
          <LinkNavigation
            path="/account"
            icon={<InboxArrowDownIcon className="h-6 w-6 inline" />}
            name={intl.formatMessage({
              id: "entries",
              defaultMessage: "Publications",
            })}
          />
          <LinkNavigation
            path="/account/settings"
            icon={<CogIcon className="h-6 w-6 inline" />}
            name={intl.formatMessage({
              id: "settings",
              defaultMessage: "Paramètres",
            })}
          />
        </div>

        {children}
      </BaseLayout>
    );
  }

  return null;
}
