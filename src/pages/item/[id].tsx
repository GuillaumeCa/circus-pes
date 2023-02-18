import { HomeIcon } from "@heroicons/react/24/outline";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetStaticPaths, GetStaticPropsContext } from "next";
import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import SuperJSON from "superjson";
import { LinkButton } from "../../components/Button";
import { ItemRow } from "../../components/Items";
import { BaseLayout } from "../../components/layouts/BaseLayout";
import { BASE_URL, SEO } from "../../components/Seo";
import { createStaticContext } from "../../server/context";
import { appRouter } from "../../server/routers/_app";
import { formatPreviewItemImageUrl } from "../../utils/storage";
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
            url={BASE_URL + "/item/" + item.id}
            imageUrl={formatPreviewItemImageUrl(item.patchVersionId, item.id)}
          />

          <div className="mt-5 bg-gray-600 inline-block p-3 rounded-lg">
            <p className="uppercase text-xs text-gray-400 font-bold mb-1">
              Version
            </p>
            <p className="text-lg font-semibold leading-none">
              {item.patchVersion}
            </p>
          </div>

          <ul className="mt-3 space-y-2 bg-gray-600 rounded-lg divide-y-2 divide-gray-700">
            <ItemRow
              item={item}
              pinnedResponses
              onUpdateItems={() => refetch()}
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
          <HomeIcon className="w-5 h-5 inline" />
          <span className="ml-2 text-md">Voir plus de créations</span>
        </LinkButton>
      </div>
    </BaseLayout>
  );
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const ssg = await createProxySSGHelpers({
    router: appRouter,
    ctx: await createStaticContext(),
    transformer: SuperJSON, // optional - adds superjson serialization
  });
  const id = context.params?.id as string;
  // prefetch `post.byId`
  await ssg.item.byId.prefetch(id);
  await ssg.response.getForItem.prefetchInfinite({ itemId: id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
    revalidate: 60,
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    // https://nextjs.org/docs/basic-features/data-fetching#fallback-blocking
    fallback: "blocking",
  };
};
