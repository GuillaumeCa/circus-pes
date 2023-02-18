import { useState } from "react";
import { ItemList } from "../../components/Items";
import AccountLayout from "../../components/layouts/AccountLayout";
import { trpc } from "../../utils/trpc";

export default function Account() {
  const [patchVersionId, setPatchVersionId] = useState(0);
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatch = patchVersions?.[patchVersionId];

  const {
    data: items,
    isError,
    isLoading,
    refetch,
  } = trpc.item.byUser.useQuery(
    { patchVersionId: selectedPatch?.id ?? "" },
    {
      enabled: !!selectedPatch,
    }
  );

  return (
    <AccountLayout>
      <div className="mb-3">
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
      </div>

      <ItemList
        isLoading={isLoading}
        items={items}
        hasItems={items?.length !== 0}
        hasError={isError}
        onLike={() => refetch()}
        onUpdateItems={() => refetch()}
      />
    </AccountLayout>
  );
}
