import {
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import SuperJSON from "superjson";

import { AddButton } from "../components/Button";
import { cls } from "../components/cls";
import {
  FilterMessageDisplay,
  LocationFilter,
  PatchVersionFilter,
  RegionFilter,
  ShardFilter,
} from "../components/Filters";
import { ItemForm } from "../components/ItemForm";
import { ItemList, SortOption } from "../components/Items";
import { BaseLayout } from "../components/layouts/BaseLayout";
import { AdminPageLink } from "../components/LinkNavigation";
import { Modal } from "../components/Modal";
import { TabBar } from "../components/TabBar";
import { createStaticContext } from "../server/context";
import { ItemRouterInput } from "../server/routers/item";
import { appRouter } from "../server/routers/_app";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";

const regions = [
  {
    name: "Europe",
    prefix: "EU",
  },
  {
    name: "USA",
    prefix: "US",
  },
  {
    name: "Asie",
    prefix: "APE1",
  },
  {
    name: "Australie",
    prefix: "APSE2",
  },
];

export default function Home() {
  // filters
  const [showFilters, setShowFilters] = useState(true);
  const [gameVersionId, setGameVersion] = useState(0);
  const [region, setRegion] = useState("EU");
  const [selectedShard, setSelectedShard] = useState("");
  const [location, setLocation] = useState("");

  // sorting
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");

  // form
  const [showAddForm, setShowAddForm] = useState(false);

  const intl = useIntl();

  // data
  const utils = trpc.useContext();
  const { data, status } = useSession();
  const { data: patchVersions, isLoading: isLoadingVersions } =
    trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatch = patchVersions?.[gameVersionId];
  const {
    data: items,
    error,
    isLoading: isLoadingItems,
    refetch,
  } = trpc.item.getItems.useQuery(
    {
      patchVersion: selectedPatch?.id ?? "",
      sortBy: sortOpt,
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
  const groupedShards = useMemo(() => {
    const shards: { [key: string]: number } = {};
    items
      ?.filter((i) => i.patchVersion === selectedPatch?.name)
      .filter((i) => !region || i.shardId.startsWith(region))
      .filter((i) => !location || i.location === location)
      .map((i) => i.shardId)
      .forEach((sid) => {
        if (!shards[sid]) {
          shards[sid] = 0;
        }

        shards[sid]++;
      });
    return shards;
  }, [items, selectedPatch, region, location]);

  const shardIds = Object.keys(groupedShards);

  // filtered location list
  const locationsList = Array.from(
    new Set(
      items
        ?.filter((i) => i.patchVersion === selectedPatch?.name)
        .filter((i) => !region || i.shardId.startsWith(region))
        .filter((i) => !selectedShard || i.shardId === selectedShard)
        .map((i) => i.location)
    )
  );

  const itemsFiltered =
    items?.filter(
      (i) =>
        (region === "" || i.shardId.startsWith(region)) &&
        (selectedShard === "" || i.shardId === selectedShard) &&
        i.patchVersion === selectedPatch?.name &&
        (!location || i.location === location)
    ) ?? [];

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
              refetch();
              setShowAddForm(false);
            }}
          />
        )}
      </Modal>

      <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-end">
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
                regions={regions}
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
              region={region}
              shard={selectedShard}
              location={location}
            />
          )}

          <ItemList
            isLoading={isLoadingItems && isLoadingVersions}
            items={itemsFiltered}
            hasItems={!!selectedPatch && itemsFiltered.length !== 0}
            hasError={!!error}
            onLike={(item, like) => {
              if (!selectedPatch) {
                return;
              }

              const currentInput: ItemRouterInput["getItems"] = {
                patchVersion: selectedPatch.id ?? "",
                sortBy: sortOpt,
              };

              const items = utils.item.getItems.getData(currentInput);

              if (items) {
                utils.item.getItems.setData(
                  currentInput,
                  items.map((it) => {
                    if (it.id === item.id) {
                      return {
                        ...it,
                        hasLiked: like === 1 ? 1 : 0,
                        likesCount: it.likesCount + like,
                      };
                    }

                    return it;
                  })
                );
              }
            }}
            onUpdateItems={() => refetch()}
          />
        </div>
      </div>
    </BaseLayout>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createStaticContext(),
    transformer: SuperJSON,
  });

  await ssg.patchVersion.getPatchVersions.prefetch();
  const patch = await ssg.patchVersion.getPatchVersions.fetch();
  if (patch.length > 0) {
    await ssg.item.getItems.prefetch({
      sortBy: "recent",
      patchVersion: patch[0].id,
    });
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // refresh at most every 1min,
  };
};
