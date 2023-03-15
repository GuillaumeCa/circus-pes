import { useState } from "react";
import { PatchVersionFilter } from "../../components/Filters";
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
        <PatchVersionFilter
          patchVersions={patchVersions}
          versionIndex={patchVersionId}
          onSelect={(index) => {
            setPatchVersionId(index);
          }}
        />
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
