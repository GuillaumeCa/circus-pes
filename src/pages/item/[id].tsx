import Head from "next/head";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { LinkButton } from "../../components/Button";
import { ItemRow } from "../../components/ItemRow";
import { BaseLayout } from "../../components/layouts/BaseLayout";
import { formatImageUrl, formatPreviewImageUrl } from "../../utils/storage";
import { trpc } from "../../utils/trpc";

const BASE_URL = process.env.VERCEL_URL || "localhost:3000";

function getId(query: ParsedUrlQuery): string | undefined {
  const id = query["id"];
  if (id && Array.isArray(id)) {
    return id[0];
  }
  return id;
}

export default function Item() {
  const router = useRouter();
  const id = getId(router.query);
  const {
    data: item,
    isLoading,
    refetch,
  } = trpc.item.byId.useQuery(id, {
    enabled: !!id,
  });

  return (
    <BaseLayout>
      {isLoading && <p className="text-gray-300 mt-5">Chargement en cours..</p>}
      {!isLoading && !item && (
        <p className="text-gray-300 mt-5">
          La création n&apos;a pas pu être trouvé
        </p>
      )}
      {item && (
        <>
          <Head>
            <meta
              property="og:title"
              content={`Une création à ${item.location} sur la shard ${item.shardId} (${item.patchVersion})`}
            />
            <meta property="og:site_name" content="Circus PES" />
            <meta property="og:url" content={`https://${BASE_URL}/`} />
            <meta property="og:description" content={item.description} />
            <meta property="og:type" content="place" />
            <meta
              property="og:image"
              content={formatPreviewImageUrl(item.patchVersionId, item.id)}
            />
          </Head>

          <ul className="mt-5 space-y-2 bg-gray-600 rounded-lg divide-y-2 divide-gray-700">
            <ItemRow
              id={item.id}
              location={item.location}
              description={item.description}
              authorId={item.userId}
              author={item.userName}
              avatarUrl={item.userImage}
              shard={item.shardId}
              likes={item.likesCount}
              hasLiked={item.hasLiked === 1}
              imagePath={item.image ? formatImageUrl(item.image) : undefined}
              previewImagePath={
                item.image
                  ? formatPreviewImageUrl(item.patchVersionId, item.id)
                  : undefined
              }
              date={new Date(item.createdAt).toLocaleDateString("fr")}
              isPublic={item.public}
              onLike={() => {
                refetch();
              }}
              onDelete={() => {
                router.push("/");
              }}
            />
          </ul>
        </>
      )}
      <div className="flex mt-3">
        <LinkButton href="/" btnType="primary">
          <span className="font-bold">Voir plus de créations</span>
        </LinkButton>
      </div>
    </BaseLayout>
  );
}
