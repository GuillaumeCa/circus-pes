import { useState } from "react";
import { Button } from "../../components/Button";
import { TrashIcon } from "../../components/Icons";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { trpc } from "../../utils/trpc";

export default function GameVersions() {
  const {
    data: gameVersions,
    isLoading,
    refetch,
  } = trpc.patchVersion.getPatchVersions.useQuery();
  const { mutateAsync } = trpc.patchVersion.createPatchVersion.useMutation();
  const [patchName, setPatchName] = useState("");

  return (
    <AdminLayout title="Versions de patch">
      <div className="mt-3 flex space-x-2">
        <input
          placeholder="Nouvelle version"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          value={patchName}
          onChange={(e) => setPatchName(e.target.value)}
        />
        <Button
          onClick={async () => {
            await mutateAsync({ name: patchName });
            setPatchName("");
            refetch();
          }}
        >
          Ajouter
        </Button>
      </div>
      {isLoading && <p>Chargement...</p>}
      {gameVersions && (
        <ul className="mt-3 space-y-2">
          {gameVersions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
            >
              <span className="font-bold text-lg">{v.name}</span>
              <div className="flex space-x-2">
                <span className="block">
                  Visible: {v.visible ? "Oui" : "Non"}
                </span>
                <button>
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
