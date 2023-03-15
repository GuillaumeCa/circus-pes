import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AccountLayout from "../../components/layouts/AccountLayout";
import { useOpts } from "../../utils/storage";
import { formatRole, formatRoleDescription } from "../../utils/user";

const finleyLabels = [
  "J'aime les baleines flambés",
  "J'aime les sushis de baleine",
  "J'aime le steak de baleine",
  "J'aime le bouillon de baleine",
  "J'aime les brochettes de baleine",
];

export default function AccountSettings() {
  const { data, status } = useSession();
  const [opt, setOpt] = useOpts();
  const [finleyLabel, setFinleyLabel] = useState(finleyLabels[0]);

  useEffect(() => {
    setFinleyLabel(
      finleyLabels[Math.floor(Math.random() * finleyLabels.length)]
    );
  }, []);

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
            <h3
              onClick={() => {
                setFinleyLabel(
                  finleyLabels[Math.floor(Math.random() * finleyLabels.length)]
                );
              }}
              className="text-sm text-gray-400 uppercase"
            >
              {finleyLabel}
            </h3>
            <label className="text-lg cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-rose-500 cursor-pointer"
                checked={!opt.likeFinley}
                onChange={() => setOpt({ ...opt, likeFinley: !opt.likeFinley })}
              />
              <span className="ml-2">Oui</span>
            </label>
          </li>
          <li className="bg-gray-600 p-5 font-semibold rounded-lg">
            <h3 className="text-sm text-gray-400 uppercase">Mon email</h3>
            <span className="text-lg">{data.user.email}</span>
          </li>
        </ul>
      )}
    </AccountLayout>
  );
}
