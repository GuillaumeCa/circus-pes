import {
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import SuperJSON from "superjson";

import { createServerSideHelpers } from "@trpc/react-query/server";
import {
  CategoryFilterV2,
  FilterMessageDisplay,
  LocationFilter,
  PatchVersionFilter,
  RegionFilter,
  ShardFilter,
} from "../components/Filters";
import { ItemForm } from "../components/ItemForm";
import { ItemListPaginated, SortOption } from "../components/Items";
import { BaseLayout } from "../components/layouts/BaseLayout";
import { AddButton } from "../components/ui/Button";
import { AdminPageLink } from "../components/ui/LinkNavigation";
import { Modal } from "../components/ui/Modal";
import { TabBar } from "../components/ui/TabBar";
import { createStaticContext } from "../server/context";
import { appRouter } from "../server/routers/_app";
import { ItemRouterInput } from "../server/routers/item";
import { cls } from "../utils/cls";
import { CATEGORIES, REGIONS } from "../utils/constants";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";

const DEFAULT_REGION = "EU";

export default function Home() {
  // filters
  const [showFilters, setShowFilters] = useState(true);
  const [gameVersionId, setGameVersion] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selectedShard, setSelectedShard] = useState("");
  const [location, setLocation] = useState("");

  // sorting
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");

  // form
  const [showAddForm, setShowAddForm] = useState(false);

  const intl = useIntl();

  // data
  const util = trpc.useContext();
  const { data, status } = useSession();

  const { data: patchVersions, isLoading: isLoadingVersions } =
    trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatch = patchVersions?.[gameVersionId];

  const selectedCategory =
    categoryIndex === 0 ? undefined : CATEGORIES[categoryIndex - 1];

  // fetch shards with count of items per shard
  const shardsForItems = trpc.item.shards.useQuery(
    {
      patchVersion: selectedPatch?.id ?? "",
      category: selectedCategory?.id,
      region: region !== "" ? (region as any) : undefined,
    },
    {
      enabled: !!selectedPatch,
    }
  );

  // fetch locations of items
  const locationsForItems = trpc.item.locations.useQuery(
    {
      patchVersion: selectedPatch?.id ?? "",
      category: selectedCategory?.id,
      region: region !== "" ? (region as any) : undefined,
      shard: selectedShard !== "" ? selectedShard : undefined,
    },
    {
      enabled: !!selectedPatch,
    }
  );

  useEffect(() => {
    // only show filters by default on desktop view
    if (window.innerWidth < 700) {
      setShowFilters(false);
    }
  }, []);

  // shards grouped by id and with count
  const groupedShards =
    shardsForItems.data?.reduce((all, current) => {
      all[current.shardId] = current.itemCount;
      return all;
    }, {} as any) ?? {};

  const shardIds = Object.keys(groupedShards);

  // filtered location list
  const locationsList = locationsForItems.data?.map((d) => d.location) ?? [];

  return (
    <BaseLayout>
      {status === "authenticated" && (
        <div className="mt-2 flex space-x-2 justify-end">
          {data.user.role !== UserRole.INVITED && (
            <AddButton
              disabled={showAddForm}
              onClick={() => setShowAddForm(true)}
            >
              <FormattedMessage
                id="new-item"
                defaultMessage="Nouvelle création"
              />
            </AddButton>
          )}
          {data.user.role === UserRole.ADMIN && <AdminPageLink />}
        </div>
      )}

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        className="max-w-2xl"
      >
        {showAddForm && patchVersions && (
          <ItemForm
            shardIds={shardIds}
            onCancel={() => setShowAddForm(false)}
            onCreated={() => {
              util.item.getItems.refetch();
              setCategoryIndex(0);
              setRegion("");
              shardsForItems.refetch();
              locationsForItems.refetch();
              setShowAddForm(false);
            }}
          />
        )}
      </Modal>

      <CategoryFilterV2
        categoryIndex={categoryIndex}
        onSelect={(index) => {
          setCategoryIndex(index);
          setSelectedShard("");
          setLocation("");
        }}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end">
        <div className="flex space-x-3 items-end">
          <div>
            <PatchVersionFilter
              patchVersions={patchVersions}
              versionIndex={gameVersionId}
              onSelect={(index) => {
                setGameVersion(index);
                setSelectedShard("");
                setLocation("");
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cls(
              "p-2 font-semibold rounded-lg outline-offset-2 outline-white/0",
              showFilters ? "bg-rose-700 " : "bg-gray-500 "
            )}
          >
            <FunnelIcon className="w-6 h-6 inline" />
            <span className="ml-2">
              <FormattedMessage
                id="filter.showbutton"
                defaultMessage="Filtres"
              />
            </span>
          </button>
        </div>

        <div className="mt-2 lg:mt-0">
          <span className="block text-xs uppercase font-bold text-gray-400">
            <FormattedMessage
              id="filter.sortby.label"
              defaultMessage="Trier par"
            />
          </span>
          <TabBar
            className="mt-1"
            items={[
              {
                key: "found",
                label: intl.formatMessage({
                  id: "filter.sortby.options.reliable",
                  defaultMessage: "Fiable",
                }),
                icon: <CheckCircleIcon className="w-5 h-5 inline" />,
              },
              {
                key: "recent",
                label: intl.formatMessage({
                  id: "filter.sortby.options.new",
                  defaultMessage: "Récents",
                }),
                icon: <ClockIcon className="w-5 h-5 inline" />,
              },
              {
                key: "like",
                label: intl.formatMessage({
                  id: "filter.sortby.options.likes",
                  defaultMessage: "Likes",
                }),
                icon: (
                  <HeartIcon fill="currentColor" className="w-5 h-5 inline" />
                ),
              },
            ]}
            selectedItem={sortOpt}
            onSelect={(item) => setSortOpt(item)}
          />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row">
        {showFilters && (
          <div className="mt-4 max-w-full xl:max-w-xs">
            <div className="sticky top-3 max-h-screen overflow-auto flex flex-col gap-1 xl:gap-3 pb-3">
              <RegionFilter
                selectedRegion={region}
                regions={REGIONS}
                onSelect={(prefix) => {
                  setRegion(prefix);
                  setSelectedShard("");
                  setLocation("");
                }}
              />

              <ShardFilter
                selectedShardId={selectedShard}
                groupedShards={groupedShards}
                onSelect={(shard) => {
                  setSelectedShard(shard);
                  setLocation("");
                }}
                maxDisplayedShard={10}
              />

              <LocationFilter
                selectedLocation={location}
                locations={locationsList}
                onSelect={(selected) => setLocation(selected)}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex-1">
          {!showFilters && (
            <FilterMessageDisplay
              region={REGIONS.find((r) => r.prefix === region)?.name ?? {}}
              shard={selectedShard}
              location={location}
            />
          )}

          <ItemList
            patchId={selectedPatch?.id}
            categoryId={selectedCategory?.id}
            sortOpt={sortOpt}
            region={region}
            shard={selectedShard}
            location={location}
            onUpdateItems={() => {
              shardsForItems.refetch();
              locationsForItems.refetch();
            }}
          />
        </div>
      </div>
    </BaseLayout>
  );
}

export function ItemList({
  patchId,
  categoryId,
  sortOpt = "recent",
  region = "EU",
  shard,
  location,
  onUpdateItems,
}: {
  patchId?: string;
  categoryId?: string;
  sortOpt?: SortOption;
  region?: string;
  shard?: string;
  location?: string;
  onUpdateItems(): void;
}) {
  const utils = trpc.useContext();

  const filter = {
    region: region !== "" ? (region as any) : undefined,
    shard: shard !== "" ? shard : undefined,
    location: location !== "" ? location : undefined,
  };

  const {
    data: items,
    isLoading,
    isFetching,
    hasNextPage,
    isError,
    refetch,
    fetchNextPage,
  } = trpc.item.getItems.useInfiniteQuery(
    {
      patchVersion: patchId ?? "",
      category: categoryId,
      sortBy: sortOpt,
      filter,
    },
    {
      enabled: !!patchId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <ItemListPaginated
      itemPages={items}
      isLoading={isLoading}
      isFetching={isFetching}
      hasError={isError}
      hasNextPage={hasNextPage}
      onUpdateItems={() => {
        refetch();
        onUpdateItems();
      }}
      onLike={(item, like) => {
        if (!patchId) {
          return;
        }

        const currentInput: ItemRouterInput["getItems"] = {
          patchVersion: patchId ?? "",
          sortBy: sortOpt,
          filter,
        };

        const itemPages = utils.item.getItems.getInfiniteData(currentInput);

        // doing an optimistic update for the likes
        if (itemPages) {
          utils.item.getItems.setInfiniteData(currentInput, {
            ...itemPages,
            pages: itemPages.pages.map((p) => ({
              ...p,
              responses: p.responses.map((it) => {
                if (it.id === item.id) {
                  return {
                    ...it,
                    hasLiked: like === 1 ? 1 : 0,
                    likesCount: it.likesCount + like,
                  };
                }
                return it;
              }),
            })),
          });
        }
      }}
      onFetchNextPage={fetchNextPage}
    />
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: await createStaticContext(),
    transformer: SuperJSON,
  });

  await ssg.patchVersion.getPatchVersions.prefetch();
  const patch = await ssg.patchVersion.getPatchVersions.fetch();
  if (patch.length > 0) {
    await ssg.item.getItems.prefetchInfinite({
      sortBy: "recent",
      patchVersion: patch[0].id,
      filter: {
        region: DEFAULT_REGION,
      },
    });
    await ssg.item.shards.prefetch({
      patchVersion: patch[0].id,
      region: DEFAULT_REGION,
    });
    await ssg.item.locations.prefetch({
      patchVersion: patch[0].id,
      region: DEFAULT_REGION,
    });
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // refresh at most every 1min,
  };
};
