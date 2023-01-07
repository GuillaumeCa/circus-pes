import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { TabBar } from "../../components/TabBar";
import { LocationInfo } from "../../server/routers/item";
import { STORAGE_BASE_URL } from "../../utils/config";
import { trpc } from "../../utils/trpc";

function ItemMgtRow({
  item,
  onUpdate,
}: {
  item: LocationInfo;
  onUpdate(): void;
}) {
  const { mutateAsync: updateVisibility } =
    trpc.item.updateVisibility.useMutation();
  const { mutateAsync: deleteItem } = trpc.item.deleteItem.useMutation();

  return (
    <li key={item.id} className="p-3 flex justify-between">
      <div className="flex items-center">
        {item.image && (
          <Link href={STORAGE_BASE_URL + item.image} target="_blank">
            <img
              className="rounded-lg shadow-md"
              src={STORAGE_BASE_URL + item.image}
              width={200}
            />
          </Link>
        )}
        <div className="ml-2 flex flex-col h-full">
          <div className="flex space-x-3">
            <span
              title="Lieu"
              className="bg-rose-700 px-3 py-1 rounded-full uppercase font-bold text-sm"
            >
              {item.location}
            </span>
            <span
              title="ID de Shard"
              className="text-sm font-bold bg-gray-700 p-1 rounded-md"
            >
              {item.shardId}
            </span>
            <p className="text-gray-400">
              <img
                className="inline w-5 h-5 rounded-full"
                src={item.userImage}
              />{" "}
              <span className="italic font-bold text-gray-300">
                {item.userName}
              </span>{" "}
              le {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="p-2">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!item.public ? (
          <Button
            onClick={async () => {
              await updateVisibility({ itemId: item.id, public: true });
              onUpdate();
            }}
          >
            Accepter
          </Button>
        ) : (
          <Button
            btnType="secondary"
            onClick={async () => {
              await updateVisibility({ itemId: item.id, public: false });
              onUpdate();
            }}
          >
            Bloquer
          </Button>
        )}

        <Button
          icon={<TrashIcon className="w-5 h-5" />}
          onClick={async () => {
            await deleteItem(item.id);
            onUpdate();
          }}
          btnType="secondary"
        >
          Supprimer
        </Button>
      </div>
    </li>
  );
}

export default function ItemsManagement() {
  const [patchVersionId, setPatchVersionId] = useState(0);
  const [filterPublic, setFilterPublic] = useState<
    "all" | "public" | "private"
  >("all");
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();

  const selectedPatchId = patchVersions?.[patchVersionId];

  let isPublic: boolean | undefined;
  if (filterPublic === "private") {
    isPublic = false;
  } else if (filterPublic === "public") {
    isPublic = true;
  }

  const {
    data: items,
    error,
    refetch,
    isLoading,
  } = trpc.item.getAllItems.useQuery(
    {
      sortBy: "recent",
      patchVersion: selectedPatchId?.id ?? "",
      public: isPublic,
    },
    {
      enabled: !!selectedPatchId,
    }
  );

  return (
    <AdminLayout title="Gestion des publications">
      <div className="flex space-x-2 items-end justify-between">
        <div>
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
                {v.name} {!v.visible ? "(Archivé)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <TabBar
            items={[
              {
                key: "all",
                label: "Tout",
              },
              {
                key: "public",
                label: "Validé",
              },
              {
                key: "private",
                label: "En attente",
              },
            ]}
            selectedItem={filterPublic}
            onSelect={(item) => setFilterPublic(item)}
          />
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <p className="text-gray-400">Chargement...</p>}
        {items && error && (
          <p className="text-gray-400">
            Erreur de chargement, veuillez recharger la page
          </p>
        )}
        {!isLoading && items?.length === 0 && (
          <p className="text-gray-400">Aucune création</p>
        )}

        {items && (
          <ul className="space-y-2 overflow-hidden bg-gray-600 rounded-lg divide-y-2 divide-gray-700">
            {items?.map((item) => (
              <ItemMgtRow
                key={item.id}
                item={item}
                onUpdate={() => refetch()}
              />
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
