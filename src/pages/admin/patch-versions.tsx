import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { FormattedMessage } from "react-intl";
import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { ConfirmModal } from "../../components/Modal";
import { trpc } from "../../utils/trpc";

function PatchVersionRow({
  id,
  name,
  isVisible,
  itemCount,
  onUpdate,
}: {
  id: string;
  name: string;
  isVisible: boolean;
  itemCount: number;
  onUpdate(): void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutateAsync: updateVisibility } =
    trpc.patchVersion.updateVisibility.useMutation();
  const { mutate: deleteVersion } = trpc.patchVersion.delete.useMutation({
    onError() {
      toast.error(
        "La version n'a pas pu être supprimée, verifiez si toutes les créations ont été supprimées",
        {
          duration: 3000,
        }
      );
      setShowDeleteConfirm(false);
    },
    onSuccess() {
      onUpdate();
      setShowDeleteConfirm(false);
    },
  });

  return (
    <li className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
      <div>
        <p className="font-bold text-lg">{name}</p>
        <p className="text-gray-400">
          {itemCount} publication{itemCount !== 1 && "s"}
        </p>
      </div>
      <div className="flex">
        <div className="flex items-center">
          <label
            htmlFor="visible"
            className="uppercase text-sm text-gray-400 font-bold"
          >
            Visible
          </label>
          <input
            id="visible"
            type="checkbox"
            checked={isVisible}
            onChange={async (e) => {
              const checked = e.target.checked;
              await updateVisibility({
                id,
                visible: checked,
              });
              onUpdate();
            }}
            className="form-checkbox cursor-pointer ml-2 rounded text-rose-600 focus:ring-rose-600 bg-gray-500"
          />
        </div>
        <button className="ml-8" onClick={() => setShowDeleteConfirm(true)}>
          <TrashIcon className="w-6 h-6" />
        </button>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Voulez vous supprimer cette version ?"
        description="Attention, si une version à des créations, elle ne peut actuellement pas être supprimée."
        acceptLabel="Supprimer"
        onAccept={() => deleteVersion(id)}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </li>
  );
}

export default function PatchVersions() {
  const {
    data: patchVersions,
    isLoading,
    refetch,
  } = trpc.patchVersion.getAllPatchVersions.useQuery();
  const { mutateAsync: create } = trpc.patchVersion.create.useMutation();

  const [patchName, setPatchName] = useState("");

  return (
    <AdminLayout>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (patchName !== "") {
            await create({ name: patchName });
            setPatchName("");
            refetch();
          }
        }}
      >
        <div className="mt-3 flex space-x-2">
          <input
            placeholder="Nouvelle version"
            className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
            value={patchName}
            onChange={(e) => setPatchName(e.target.value)}
          />
          <Button type="submit">Ajouter</Button>
        </div>
      </form>

      {isLoading && (
        <p>
          <FormattedMessage
            id="action.loading"
            defaultMessage="Chargement..."
          />
        </p>
      )}
      {patchVersions && (
        <ul className="mt-3 space-y-2">
          {patchVersions.map((v) => (
            <PatchVersionRow
              key={v.id}
              id={v.id}
              name={v.name}
              itemCount={v._count.Item}
              isVisible={v.visible}
              onUpdate={refetch}
            />
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
