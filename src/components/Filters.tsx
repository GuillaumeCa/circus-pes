import {
  ArrowsUpDownIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { cls } from "../utils/cls";
import { CATEGORIES } from "../utils/constants";
import { SortShard, useCategory } from "./Items";

export function PatchVersionFilter({
  versionIndex,
  patchVersions,
  onSelect,
  showHidden = false,
}: {
  versionIndex: number;
  patchVersions?: { id: string; name: string; visible?: boolean }[];
  showHidden?: boolean;
  onSelect(index: number): void;
}) {
  const intl = useIntl();
  return (
    <>
      <label
        htmlFor="gameVersion"
        className="text-xs uppercase font-bold text-gray-400"
      >
        <FormattedMessage id="filter.version.label" defaultMessage="Version" />
      </label>
      <select
        id="gameVersion"
        value={versionIndex}
        onChange={(e) => {
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        {patchVersions && patchVersions?.length === 0 && (
          <option disabled>
            <FormattedMessage
              id="filter.version.none"
              defaultMessage="Aucune"
            />
          </option>
        )}
        {patchVersions?.map((v, i) => (
          <option key={v.id} value={i}>
            {v.name}{" "}
            {showHidden &&
              !v.visible &&
              ` (${intl.formatMessage({
                id: "filter.version.archived",
                defaultMessage: "Archivé",
              })})`}
          </option>
        ))}
      </select>
    </>
  );
}

export function CategoryFilter({
  categoryIndex,
  categories,
  onSelect,
}: {
  categoryIndex: number;
  categories?: { id: string; name: string }[];
  onSelect(index: number): void;
}) {
  return (
    <>
      <label
        htmlFor="category"
        className="text-xs uppercase font-bold text-gray-400"
      >
        <FormattedMessage
          id="filter.category.label"
          defaultMessage="Catégorie"
        />
      </label>
      <select
        id="category"
        value={categoryIndex}
        onChange={(e) => {
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        {categories && categories?.length === 0 && (
          <option disabled>
            <FormattedMessage
              id="filter.version.none"
              defaultMessage="Aucune"
            />
          </option>
        )}
        <option value={0}>Toutes</option>
        {categories?.map((category, i) => (
          <option key={category.id} value={i + 1}>
            {category.name}
          </option>
        ))}
      </select>
    </>
  );
}

export function CategoryFilterV2({
  categoryIndex,
  onSelect,
}: {
  categoryIndex: number;
  onSelect(index: number): void;
}) {
  const selectedCategory =
    categoryIndex > 0 ? CATEGORIES[categoryIndex - 1] : null;

  const { description } = useCategory(selectedCategory?.id);

  return (
    <div>
      <p className="uppercase font-bold text-xs text-gray-400">
        <FormattedMessage
          id="filter.category.label"
          defaultMessage="Catégorie"
        />
      </p>
      <div className="mt-1 flex flex-wrap gap-3 mb-2">
        <button
          onClick={() => onSelect(0)}
          className={cls(
            "rounded-lg px-2 py-1 font-semibold",
            categoryIndex === 0
              ? "text-rose-600 bg-rose-500/10"
              : "text-gray-300 bg-gray-500/20 hover:bg-gray-500/50"
          )}
        >
          <SelectAllLabel gender="female" />
        </button>
        {CATEGORIES.map((category, index) => (
          <CategoryButton
            category={category}
            index={index}
            categoryIndex={categoryIndex}
            onSelect={onSelect}
          />
        ))}
      </div>
      {description && (
        <p className="text-sm text-gray-400 mb-2">{description}</p>
      )}
    </div>
  );
}

function CategoryButton({
  categoryIndex,
  category,
  index,
  onSelect,
}: {
  categoryIndex: number;
  category: typeof CATEGORIES[number];
  index: number;
  onSelect(index: number): void;
}) {
  const isActive = categoryIndex === index + 1;
  const cat = useCategory(category.id);

  return (
    <button
      key={category.id}
      onClick={() => onSelect(isActive ? 0 : index + 1)}
      className={cls(
        "relative rounded-lg px-2 py-1 font-semibold hover:shadow-md",
        isActive
          ? "text-rose-600 bg-rose-500/10"
          : "text-gray-300 bg-gray-500/20 hover:bg-gray-500/50"
      )}
    >
      {cat.name}
    </button>
  );
}

export function RegionFilter({
  selectedRegion,
  regions,
  onSelect,
}: {
  selectedRegion: string;
  regions: { prefix: string; name: { fr: string; en: string } }[];
  onSelect(prefix: string): void;
}) {
  const { locale } = useRouter();
  return (
    <div>
      <p className="uppercase font-bold text-xs text-gray-400">
        <FormattedMessage id="filter.region.label" defaultMessage="Régions" />
      </p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => onSelect("")}
          className={cls(
            "rounded-lg px-2 py-1 font-bold mr-2 mb-3",
            selectedRegion === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          <SelectAllLabel gender="female" />
        </button>
        {regions.map((reg) => {
          const isActive = selectedRegion === reg.prefix;
          return (
            <button
              key={reg.prefix}
              onClick={() => onSelect(isActive ? "" : reg.prefix)}
              className={cls(
                "relative rounded-lg px-2 py-1 font-bold mr-3 mb-3 hover:shadow-md",
                isActive ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              {locale && reg.name[locale as "fr" | "en"]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ShardFilter({
  selectedShardId,
  groupedShards,
  onSelect,
  maxDisplayedShard = 10,
}: {
  selectedShardId: string;
  groupedShards: { [key: string]: number };
  onSelect(shardId: string): void;
  maxDisplayedShard?: number;
}) {
  const [sortShard, setSortShard] = useState<SortShard>("az");
  const [showMoreShards, setShowMoreShards] = useState(false);

  const shardIds = Object.keys(groupedShards).sort((a, b) =>
    sortShard === "az"
      ? a.localeCompare(b)
      : groupedShards[b] - groupedShards[a]
  );

  return (
    <div>
      <p className="uppercase font-bold text-xs text-gray-400">Shards</p>
      <div className="mt-1 flex flex-wrap items-center">
        <button
          onClick={() => {
            onSelect("");
            setShowMoreShards(false);
          }}
          className={cls(
            "rounded-lg px-2 py-1 font-bold mr-2 mb-3",
            selectedShardId === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          <SelectAllLabel gender="female" />
        </button>
        <button
          onClick={() => setSortShard(sortShard === "az" ? "num" : "az")}
          className="flex px-2 py-1 items-center rounded-lg font-bold mr-3 mb-3 bg-gray-800 active:bg-gray-800"
        >
          <ArrowsUpDownIcon className="w-4 h-4 inline" />
          <span className="ml-1">{sortShard === "az" ? "aZ" : "Nb"}</span>
        </button>
        {shardIds
          .slice(0, !showMoreShards ? maxDisplayedShard : undefined)
          .map((shardId) => {
            const isActive = selectedShardId === shardId;
            return (
              <button
                key={shardId}
                onClick={() => {
                  onSelect(isActive ? "" : shardId);
                }}
                className={cls(
                  "relative rounded-lg px-2 py-1 font-bold mr-3 mb-3 hover:shadow-md",
                  isActive ? "bg-rose-700" : "bg-gray-500"
                )}
              >
                <span
                  className={cls(
                    "absolute z-10 -top-2 -right-3 px-1 min-w-[1.25rem] h-5 mr-1 text-sm shadow-md rounded-full inline-flex justify-center items-center bg-gray-200",
                    isActive ? "text-rose-700" : "text-gray-500"
                  )}
                >
                  {groupedShards[shardId]}
                </span>
                <span>{shardId}</span>
              </button>
            );
          })}
        {!showMoreShards && shardIds.length > maxDisplayedShard && (
          <button
            className="mr-3 mb-3 font-semibold text-sm bg-gray-500/30 hover:bg-gray-500/50 px-2 py-1 rounded-lg"
            onClick={() => setShowMoreShards(true)}
          >
            <EllipsisHorizontalIcon className="w-4 h-4 inline" />
            <span className="ml-1">
              <FormattedMessage
                id="filter.shard.show-more"
                defaultMessage="Afficher plus"
              />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function LocationFilter({
  selectedLocation,
  locations,
  onSelect,
}: {
  selectedLocation: string;
  locations: string[];
  onSelect(location: string): void;
}) {
  return (
    <div>
      <p className="uppercase font-bold text-xs text-gray-400">
        <FormattedMessage id="filter.location.label" defaultMessage="Lieu" />
      </p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => onSelect("")}
          className={cls(
            "rounded-full px-3 py-1 font-bold mr-3 mb-3",
            selectedLocation === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          <SelectAllLabel gender="male" />
        </button>
        {locations.map((locationId) => {
          const isActive = selectedLocation === locationId;
          return (
            <button
              key={locationId}
              onClick={() => onSelect(isActive ? "" : locationId)}
              className={cls(
                "relative uppercase rounded-full px-3 py-1 font-bold mr-3 mb-3 hover:shadow-md",
                isActive ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              {locationId}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterMessageDisplay({
  region,
  shard,
  location,
}: {
  region: { [lang: string]: string };
  shard: string;
  location: string;
}) {
  const intl = useIntl();

  const filters = [
    region[intl.locale]
      ? {
          prefix: intl.formatMessage({
            id: "filter.info.region",
            defaultMessage: "la region",
          }),
          value: region[intl.locale],
        }
      : null,
    shard
      ? {
          prefix: intl.formatMessage({
            id: "filter.info.shard",
            defaultMessage: "la shard",
          }),
          value: shard,
        }
      : null,
    location
      ? {
          prefix: intl.formatMessage({
            id: "filter.info.location",
            defaultMessage: "le lieu",
          }),
          value: location,
        }
      : null,
  ].filter(Boolean) as { prefix: string; value: string }[];

  if (filters.length > 0) {
    return (
      <p className="text-sm text-gray-400 mb-3">
        <FormattedMessage id="filter.info.text" defaultMessage="Filtré par" />{" "}
        <FormattedList
          value={filters.map((f) => (
            <>
              {f.prefix}{" "}
              <span className="font-bold text-gray-300">{f.value}</span>
            </>
          ))}
        />
      </p>
    );
  }

  return null;
}

function SelectAllLabel({ gender }: { gender: "male" | "female" }) {
  return (
    <FormattedMessage
      id="filter.select.all"
      defaultMessage="{gender, select, male {Tout} female {Toutes} other {Tout}}"
      values={{ gender }}
    />
  );
}
