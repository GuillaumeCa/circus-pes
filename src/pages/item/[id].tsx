import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { LinkButton } from "../../components/Button";
import { ItemRow } from "../../components/ItemRow";
import { BaseLayout } from "../../components/layouts/BaseLayout";
import { SEO } from "../../components/Seo";
import { formatImageUrl, formatPreviewImageUrl } from "../../utils/storage";
import { trpc } from "../../utils/trpc";

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
    <BaseLayout overrideSEO={true}>
      {isLoading && <p className="text-gray-300 mt-5">Chargement en cours..</p>}
      {!isLoading && !item && (
        <p className="text-gray-300 mt-5">
          La création n&apos;a pas pu être trouvé
        </p>
      )}
      {item && (
        <>
          <SEO
            title={`Une création près de ${item.location} sur la shard ${item.shardId} (${item.patchVersion})`}
            desc={item.description}
            url={window.location.href}
            imageUrl={formatPreviewImageUrl(item.patchVersionId, item.id)}
          />

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
