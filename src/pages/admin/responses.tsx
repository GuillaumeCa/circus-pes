import {
  HandThumbDownIcon,
  HandThumbUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/Button";
import { cls } from "../../components/cls";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { TabBar } from "../../components/TabBar";
import { TimeFormatted } from "../../components/TimeFormatted";
import {
  formatImageUrl,
  formatPreviewResponseImageUrl,
} from "../../utils/storage";
import { trpc } from "../../utils/trpc";
import { AdminItemRow } from "./items";

export default function ResponseManagement() {
  const [filterPublic, setFilterPublic] = useState<
    "all" | "public" | "private"
  >("private");

  let isPublic: boolean | undefined;
  if (filterPublic === "private") {
    isPublic = false;
  } else if (filterPublic === "public") {
    isPublic = true;
  }

  const {
    data: responsePages,
    error,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = trpc.response.getAdminResponses.useInfiniteQuery(
    { public: isPublic },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  const { mutateAsync: updateVisibility } =
    trpc.response.updateVisibility.useMutation();
  const { mutateAsync: deleteResponse } = trpc.response.delete.useMutation();

  return (
    <AdminLayout>
      <div className="flex justify-end mb-2">
        <TabBar
          items={[
            {
              key: "private",
              label: "En attente",
            },
            {
              key: "public",
              label: "Validé",
            },
            {
              key: "all",
              label: "Tout",
            },
          ]}
          selectedItem={filterPublic}
          onSelect={(item) => setFilterPublic(item)}
        />
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}
      {responsePages && error && (
        <p className="text-gray-400">
          Erreur de chargement, veuillez recharger la page
        </p>
      )}
      {!isLoading &&
        responsePages?.pages.some((p) => p.responses.length === 0) && (
          <>
            {filterPublic === "private" && (
              <p className="text-gray-400">
                Aucune réponse en attente de validation, c&apos;est tout bon !
              </p>
            )}
            {filterPublic === "public" && (
              <p className="text-gray-400">Aucune réponse validé</p>
            )}
            {filterPublic === "all" && (
              <p className="text-gray-400">Aucune réponse</p>
            )}
          </>
        )}

      <ul className="space-y-4">
        {responsePages?.pages.map((p) =>
          p.responses?.map((r) => (
            <li key={r.id} className="p-3 bg-gray-600 rounded-lg">
              <div className="flex flex-col lg:flex-row mb-3">
                <div className="flex-1">
                  <div className="flex space-x-2 items-center">
                    <p
                      className={cls(
                        "uppercase flex items-center font-bold rounded-md px-2 py-1",
                        r.isFound
                          ? "text-green-500 bg-green-400/10"
                          : "text-red-500 bg-red-400/10"
                      )}
                    >
                      {r.isFound ? (
                        <>
                          <HandThumbUpIcon className="w-5 h-5 mr-2" />
                          <span>Trouvé</span>
                        </>
                      ) : (
                        <>
                          <HandThumbDownIcon className="w-5 h-5 mr-2" />
                          <span>Pas trouvé</span>
                        </>
                      )}
                    </p>
                    <p className="text-gray-400 flex items-center">
                      {r.user.image && (
                        <img
                          alt="photo de profil"
                          className="inline w-5 h-5 rounded-full"
                          src={r.user.image}
                        />
                      )}
                      <span className="ml-1 italic font-bold text-gray-300">
                        {r.user.name}
                      </span>
                      <TimeFormatted className="ml-2">
                        {r.createdAt}
                      </TimeFormatted>
                    </p>
                  </div>
                  <div className="flex mt-2">
                    {r.image && (
                      <Link href={formatImageUrl(r.image)} target="_blank">
                        <img
                          alt="image de la réponse"
                          className="mr-3 rounded-lg shadow-md w-full lg:w-60"
                          src={formatPreviewResponseImageUrl(r.id)}
                          width={200}
                        />
                      </Link>
                    )}
                    <p className="p-1">{r.comment}</p>
                  </div>
                </div>

                <div className="flex mt-2 ml-auto lg:mt-0 items-center justify-end lg:justify-start space-x-2">
                  {!r.public ? (
                    <Button
                      onClick={async () => {
                        await updateVisibility({ id: r.id, public: true });
                        refetch();
                      }}
                    >
                      Accepter
                    </Button>
                  ) : (
                    <Button
                      btnType="secondary"
                      onClick={async () => {
                        await updateVisibility({ id: r.id, public: false });
                        refetch();
                      }}
                    >
                      Bloquer
                    </Button>
                  )}

                  <Button
                    icon={<TrashIcon className="w-5 h-5" />}
                    onClick={async () => {
                      await deleteResponse(r.id);
                      refetch();
                    }}
                    btnType="secondary"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
              <div className="border-t-2 border-gray-500 pt-3 flex">
                <AdminItemRow
                  id={r.itemId}
                  image={r.item.image}
                  patchVersionId={r.item.patchVersionId}
                  location={r.item.location}
                  shardId={r.item.shardId}
                  createdAt={r.item.createdAt.getTime()}
                  description={r.item.description}
                  userImage={r.item.user.image}
                  userName={r.item.user.name}
                />
              </div>
            </li>
          ))
        )}
      </ul>
      {hasNextPage && (
        <div className="flex justify-center mt-3">
          <Button onClick={() => fetchNextPage()} btnType="secondary">
            Charger plus
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
