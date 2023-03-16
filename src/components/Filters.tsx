import {
  ArrowsUpDownIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { cls } from "./cls";
import { SortShard } from "./Items";

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
  return (
    <>
      <label
        htmlFor="gameVersion"
        className="text-xs uppercase font-bold text-gray-400"
      >
        Version
      </label>
      <select
        id="gameVersion"
        value={versionIndex}
        onChange={(e) => {
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        {patchVersions && patchVersions?.length === 0 && (
          <option disabled>Aucune</option>
        )}
        {patchVersions?.map((v, i) => (
          <option key={v.id} value={i}>
            {v.name} {showHidden && !v.visible && " (Archivé)"}
          </option>
        ))}
      </select>
    </>
  );
}

export function RegionFilter({
  selectedRegion,
  regions,
  onSelect,
}: {
  selectedRegion: string;
  regions: { prefix: string; name: string }[];
  onSelect(prefix: string): void;
}) {
  return (
    <div>
      <p className="uppercase font-bold text-xs text-gray-400">Régions</p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => onSelect("")}
          className={cls(
            "rounded-lg px-2 py-1 font-bold mr-2 mb-3",
            selectedRegion === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          Toutes
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
              {reg.name}
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
          Toutes
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
            <span className="ml-1">Afficher plus</span>
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
      <p className="uppercase font-bold text-xs text-gray-400">Lieu</p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => onSelect("")}
          className={cls(
            "rounded-full px-3 py-1 font-bold mr-3 mb-3",
            selectedLocation === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          Tout
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
  region: string;
  shard: string;
  location: string;
}) {
  const filters = [
    region ? { prefix: "la région", value: region } : null,
    shard ? { prefix: "la shard", value: shard } : null,
    location ? { prefix: "le lieu", value: location } : null,
  ].filter(Boolean) as { prefix: string; value: string }[];

  if (filters.length > 0) {
    const filterMessage = filters
      .map((f) => (
        <>
          {f.prefix} <span className="font-bold">{f.value}</span>
        </>
      ))
      .reduce((a, b, idx) => {
        if (idx === filters.length - 1) {
          return (
            <>
              {a}, et {b}
            </>
          );
        }
        return (
          <>
            {a}, {b}
          </>
        );
      });
    return (
      <p className="text-sm text-gray-400 mb-3">Filtré par {filterMessage}</p>
    );
  }

  return null;
}
