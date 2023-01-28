import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "../components/Button";
import { BaseLayout } from "../components/layouts/BaseLayout";
import { TimeFormatted } from "../components/TimeFormatted";
import { useOpts } from "../utils/storage";
import { formatRole, formatRoleDescription } from "../utils/user";

export default function Account() {
  const { data, status } = useSession();
  const router = useRouter();
  const [opt, setOpt] = useOpts();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return (
      <BaseLayout>
        <div className="mt-5 p-4 bg-gray-600 rounded-lg">
          <h2 className="text-3xl font-semibold">Mon compte</h2>
          <p className="mt-2 text-gray-400 text-md">
            Bonjour, {data?.user.name}.
          </p>
          <div className="mt-3">
            <Button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              btnType="secondary"
            >
              Se déconnecter
            </Button>
          </div>
        </div>

        <ul className="space-y-2 mt-5">
          <li className="bg-gray-600 p-5 font-semibold rounded-lg">
            <h3 className="text-sm text-gray-400 uppercase">Mon rôle</h3>
            <span className="text-lg">{formatRole(data.user.role)}</span>
            <p className="text-gray-400 text-sm italic font-normal">
              {formatRoleDescription(data.user.role)}
            </p>
          </li>
          <li className="bg-gray-600 p-5 font-semibold rounded-lg">
            <h3 className="text-sm text-gray-400 uppercase">
              J&apos;aime finley
            </h3>
            <label className="text-lg cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-rose-500"
                checked={opt.likeFinley}
                onChange={() => setOpt({ ...opt, likeFinley: !opt.likeFinley })}
              />
              <span className="ml-2">Oui</span>
            </label>
          </li>
          <li className="bg-gray-600 p-5 font-semibold rounded-lg">
            <h3 className="text-sm text-gray-400 uppercase">Mon email</h3>
            <span className="text-lg">{data.user.email}</span>
          </li>
          <li className="bg-gray-600 p-5 font-semibold rounded-lg">
            <h3 className="text-sm text-gray-400 uppercase">
              Expiration de la session
            </h3>
            <span className="text-lg">
              <TimeFormatted>{new Date(data.expires)}</TimeFormatted>
            </span>
          </li>
        </ul>
      </BaseLayout>
    );
  }

  return null;
}
