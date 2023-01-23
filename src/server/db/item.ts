import { Prisma } from "@prisma/client";
import type { MyPrismaClient } from "./client";

export interface LocationInfo {
  id: string;
  patchVersionId: string;
  patchVersion: string;
  shardId: string;
  location: string;
  description: string;
  image?: string;
  userId?: string;
  userImage?: string;
  userName?: string;
  likesCount: number;
  hasLiked?: number;
  createdAt: number;
  public: boolean;
  found?: number;
  notFound?: number;
}

export function getItemsQuery(
  prismaClient: MyPrismaClient,
  patchVersionId: string,
  sortBy: "recent" | "like",
  userId?: string,
  filterPublic?: boolean,
  showPrivateForCurrentUser = false
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
  select 
    i.id,
    pv.id as "patchVersionId",
    pv.name as "patchVersion",
    i.description,
    i.location,
    i."shardId",
    i.public,
    i."createdAt",
    i."userId",
    i.image,
    u.image as "userImage",
    u.name as "userName",
    count(l."itemId")::int as "likesCount",
    coalesce((select sum(case when r."isFound" = true then 1 else 0 end) 
    from response r where r.id in (SELECT r.id from response r where r."itemId" = i.id order by r."createdAt" limit 2)), 0)::int as "found",
    coalesce((select sum(case when r."isFound" = false then 1 else 0 end) 
    from response r where r.id in (SELECT r.id from response r where r."itemId" = i.id order by r."createdAt" limit 2)), 0)::int as "notFound"
    ${
      userId
        ? Prisma.sql`, (select count(*)::int from "like" l1 where l1."itemId" = i.id and l1."userId" = ${userId}) as "hasLiked"`
        : Prisma.empty
    }
  from item i
  left join patch_version pv on pv.id = i."patchVersionId"
  left join "like" l on l."itemId" = i.id
  left join "user" u on u.id = i."userId"
  where i."patchVersionId" = ${patchVersionId} ${
    filterPublic === undefined
      ? Prisma.empty
      : showPrivateForCurrentUser
      ? Prisma.sql`and (i.public = ${filterPublic} or (i."userId" = ${userId} and i.public = false))`
      : Prisma.sql`and (i.public = ${filterPublic})`
  }
  group by (i.id, u.id, pv.id)
  order by ${
    sortBy === "recent" ? Prisma.sql`i."createdAt"` : Prisma.sql`"likesCount"`
  } desc
`;
}

export function getItemById(
  prismaClient: MyPrismaClient,
  itemId: string,
  userId?: string
) {
  return prismaClient.$queryRaw<LocationInfo[]>`
  select 
    i.id,
    pv.id as "patchVersionId",
    pv.name as "patchVersion",
    i.description,
    i.location,
    i."shardId",
    i.public,
    i."createdAt",
    i."userId",
    i.image,
    u.image as "userImage",
    u.name as "userName",
    count(l."itemId")::int as "likesCount"
    ${
      userId
        ? Prisma.sql`, (select count(*)::int from "like" l1 where l1."itemId" = i.id and l1."userId" = ${userId}) as "hasLiked"`
        : Prisma.empty
    }
  from item i
  left join patch_version pv on pv.id = i."patchVersionId"
  left join "like" l on l."itemId" = i.id
  left join "user" u on u.id = i."userId"
  where i.id = ${itemId}
  group by (i.id, u.id, pv.id)
`;
}
