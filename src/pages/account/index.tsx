import { useState } from "react";
import { PatchVersionFilter } from "../../components/Filters";
import { ItemListPaginated } from "../../components/Items";
import AccountLayout from "../../components/layouts/AccountLayout";
import { trpc } from "../../utils/trpc";

export default function Account() {
  const [patchVersionId, setPatchVersionId] = useState(0);
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatch = patchVersions?.[patchVersionId];

  const {
    data: items,
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = trpc.item.byUser.useInfiniteQuery(
    { patchVersionId: selectedPatch?.id ?? "" },
    {
      enabled: !!selectedPatch,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
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

      <ItemListPaginated
        itemPages={items}
        isLoading={isLoading}
        isFetching={isFetching}
        hasError={isError}
        hasNextPage={hasNextPage}
        onUpdateItems={() => refetch()}
        onLike={() => refetch()}
        onFetchNextPage={fetchNextPage}
      />
    </AccountLayout>
  );
}
