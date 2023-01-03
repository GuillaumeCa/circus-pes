import { useState } from "react";
import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { LocationInfo } from "../../server/routers/item";
import { STORAGE_BASE_URL } from "../../utils/config";
import { trpc } from "../../utils/trpc";

function ItemMgtRow({ item }: { item: LocationInfo }) {
  // const itemImageUrl = getItemImageUrl(item.item_capture_url);

  return (
    <li key={item.id} className="p-3 flex justify-between">
      <div className="flex items-start">
        {item.image && (
          <img
            className="rounded-lg shadow-md"
            src={STORAGE_BASE_URL + item.image}
            width={200}
          />
        )}
        <p className="ml-2">{item.description}</p>
        <span>{item.shardId}</span>
        <span>{item.location}</span>
        <span>
          De {item.userName} le {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button>Accepter</Button>
        <Button btnType="secondary">Bloquer</Button>
      </div>
    </li>
  );
}

export default function ItemsManagement() {
  const [patchVersionId, setPatchVersionId] = useState(0);
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatchId = patchVersions?.[patchVersionId];

  const {
    data: items,
    error,
    refetch,
  } = trpc.item.getItems.useQuery(
    { sortBy: "recent", patchVersion: selectedPatchId?.id ?? "" },
    {
      enabled: !!selectedPatchId,
    }
  );

  return (
    <AdminLayout title="Gestion des publications">
      <label
        htmlFor="gameVersion"
        className="text-xs uppercase font-bold text-gray-400"
      >
        Version
      </label>
      <select
        id="gameVersion"
        value={patchVersionId}
        onChange={(e) => {
          setPatchVersionId(parseInt(e.target.value, 10));
        }}
      >
        {patchVersions && patchVersions?.length === 0 && (
          <option disabled>Aucune</option>
        )}
        {patchVersions?.map((v, i) => (
          <option key={v.id} value={i}>
            {v.name}
          </option>
        ))}
      </select>

      <div className="mt-4">
        {!items && <p>Chargement...</p>}
        {items && error && (
          <p>Erreur de chargement, veuillez recharger la page</p>
        )}
        {items?.length === 0 && <p>Aucune création</p>}

        {items && (
          <ul className="space-y-2 overflow-hidden bg-gray-600 rounded-lg divide-y-[1px] divide-gray-700">
            {items?.map((item) => (
              <ItemMgtRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
