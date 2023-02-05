import { useSession } from "next-auth/react";
import AccountLayout from "../../components/layouts/AccountLayout";
import { TimeFormatted } from "../../components/TimeFormatted";
import { useOpts } from "../../utils/storage";
import { formatRole, formatRoleDescription } from "../../utils/user";

export default function AccountSettings() {
  const { data, status } = useSession();
  const [opt, setOpt] = useOpts();

  return (
    <AccountLayout>
      {status === "authenticated" && (
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
      )}
    </AccountLayout>
  );
}
