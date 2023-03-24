import { Prisma } from "@prisma/client";
import { z } from "zod";
import { itemFilterSchema } from "../routers/item";
import type { MyPrismaClient } from "./client";

function getItemBaseQuery(userId?: string) {
  return Prisma.sql`
    select 
    i.id,
    pv.id as "patchVersionId",
    pv.name as "patchVersion",
    i.description,
    i.location,
    i."shardId",
    i.public,
    i."createdAt",
    i."updatedAt",
    i."userId",
    i.image,
    u.image as "userImage",
    u.name as "userName",
    count(l."itemId")::int as "likesCount",
    (select count(*)::int from response r where r."itemId" = i.id and r.public = true) as "responsesCount",
    coalesce((select sum(case when r."isFound" = true then 1 else 0 end) 
    from response r where r.id in (SELECT r.id from response r where r."itemId" = i.id and r."public" = true order by r."createdAt" desc limit 2)), 0)::int as "found",
    coalesce((select sum(case when r."isFound" = false then 1 else 0 end) 
    from response r where r.id in (SELECT r.id from response r where r."itemId" = i.id and r."public" = true order by r."createdAt" desc limit 2)), 0)::int as "notFound"
    ${
      userId
        ? Prisma.sql`, (select count(*)::int from "like" l1 where l1."itemId" = i.id and l1."userId" = ${userId}) as "hasLiked"`
        : Prisma.empty
    }
  from item i
  left join patch_version pv on pv.id = i."patchVersionId"
  left join "like" l on l."itemId" = i.id
  left join "user" u on u.id = i."userId"
  `;
}

export interface LocationInfo {
  id: string;
  patchVersionId: string;
  patchVersion: string;
  shardId: string;
  location: string;
  description: string;
  image: string | null;
  userId?: string;
  userImage: string | null;
  userName: string | null;
  likesCount: number;
  hasLiked?: number;
  public: boolean;
  found: number;
  notFound: number;
  responsesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const sortOptions = ["recent", "like", "found"] as const;

export type SortType = typeof sortOptions[number];

function getOrder(sort: SortType) {
  switch (sort) {
    case "like":
      return Prisma.sql`"likesCount" desc`;
    case "recent":
      return Prisma.sql`i."createdAt" desc`;
    case "found":
      return Prisma.sql`"found" desc, "notFound" asc`;
  }
}

type ItemFilter = z.infer<typeof itemFilterSchema>;

export function getItemsQuery(
  prismaClient: MyPrismaClient,
  patchVersionId: string,
  sortBy: SortType,
  filter: ItemFilter,
  pagination?: { take: number; skip: number },
  userId?: string,
  filterPublic?: boolean,
  showPrivateForCurrentUser = false
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
  ${getItemBaseQuery(userId)}
  where i."patchVersionId" = ${patchVersionId}
  ${
    filterPublic === undefined
      ? Prisma.empty
      : showPrivateForCurrentUser
      ? Prisma.sql` and (i.public = ${filterPublic} or (i."userId" = ${userId} and i.public = false))`
      : Prisma.sql` and (i.public = ${filterPublic})`
  }
  ${
    filter.region
      ? Prisma.sql` and (i."shardId" like ${filter.region + "%"})`
      : Prisma.empty
  }
  ${
    filter.shard
      ? Prisma.sql` and (i."shardId" = ${filter.shard})`
      : Prisma.empty
  }
  ${
    filter.location
      ? Prisma.sql` and (i.location = ${filter.location})`
      : Prisma.empty
  }
  group by (i.id, u.id, pv.id)
  order by ${getOrder(sortBy)}
  ${
    pagination
      ? Prisma.sql`offset ${pagination.skip} limit ${pagination.take}`
      : Prisma.empty
  }
`;
}

export function getItemById(
  prismaClient: MyPrismaClient,
  itemId: string,
  userId?: string
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
  ${getItemBaseQuery(userId)}
  where i.id = ${itemId}
  group by (i.id, u.id, pv.id)
`;
}

export function getItemsByUser(
  prismaClient: MyPrismaClient,
  userId: string,
  patchVersionId: string,
  pagination?: { take: number; skip: number }
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
  ${getItemBaseQuery(userId)}
  where u.id = ${userId} and i."patchVersionId" = ${patchVersionId}
  group by (i.id, u.id, pv.id)
  order by i."createdAt" desc
  ${
    pagination
      ? Prisma.sql`offset ${pagination.skip} limit ${pagination.take}`
      : Prisma.empty
  }
`;
}

export function getShardsForRegion(
  prismaClient: MyPrismaClient,
  patchVersionId: string,
  region: ItemFilter["region"],
  userId?: string,
  filterPublic?: boolean,
  showPrivateForCurrentUser = false
) {
  return prismaClient.$queryRaw<{ shardId: string; itemCount: number }[]>`
  select 
    count(*)::int as "itemCount", 
    i."shardId"
  from item i
  left join patch_version pv on pv.id = i."patchVersionId"
  where i."patchVersionId" = ${patchVersionId}
  ${
    filterPublic === undefined
      ? Prisma.empty
      : showPrivateForCurrentUser
      ? Prisma.sql` and (i.public = ${filterPublic} or (i."userId" = ${userId} and i.public = false))`
      : Prisma.sql` and (i.public = ${filterPublic})`
  }
  ${region ? Prisma.sql` and i."shardId" like ${region + "%"}` : Prisma.empty}
  group by (i."shardId", pv.id)
`;
}

export function getItemLocations(
  prismaClient: MyPrismaClient,
  patchVersionId: string,
  region: ItemFilter["region"],
  shard: ItemFilter["shard"],
  userId?: string,
  filterPublic?: boolean,
  showPrivateForCurrentUser = false
) {
  return prismaClient.$queryRaw<{ location: string }[]>`
  select distinct i.location
  from item i
  left join patch_version pv on pv.id = i."patchVersionId"
  where i."patchVersionId" = ${patchVersionId}
  ${
    filterPublic === undefined
      ? Prisma.empty
      : showPrivateForCurrentUser
      ? Prisma.sql` and (i.public = ${filterPublic} or (i."userId" = ${userId} and i.public = false))`
      : Prisma.sql` and (i.public = ${filterPublic})`
  }
  ${region ? Prisma.sql` and i."shardId" like ${region + "%"}` : Prisma.empty}
  ${shard ? Prisma.sql` and (i."shardId" = ${shard})` : Prisma.empty}
  group by (i.id, pv.id)
`;
}
