import { useState } from "react";
import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { trpc } from "../../utils/trpc";

export default function PatchVersions() {
  const {
    data: patchVersions,
    isLoading,
    refetch,
  } = trpc.patchVersion.getAllPatchVersions.useQuery();
  const { mutateAsync: create } = trpc.patchVersion.create.useMutation();
  const { mutateAsync: updateVisibility } =
    trpc.patchVersion.updateVisibility.useMutation();

  const [patchName, setPatchName] = useState("");

  return (
    <AdminLayout title="Versions de patch">
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
      {isLoading && <p>Chargement...</p>}
      {patchVersions && (
        <ul className="mt-3 space-y-2">
          {patchVersions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
            >
              <span className="font-bold text-lg">{v.name}</span>
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
                    checked={v.visible}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      await updateVisibility({
                        id: v.id,
                        visible: checked,
                      });
                      refetch();
                    }}
                    className="form-checkbox cursor-pointer ml-2 rounded text-rose-600 focus:ring-rose-600 bg-gray-500"
                  />
                </div>
                {/* <button className="ml-8">
                  <TrashIcon />
                </button> */}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
