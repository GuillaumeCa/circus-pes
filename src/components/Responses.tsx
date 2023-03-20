import {
  ClockIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { TrashIcon } from "./Icons";
import { ConfirmModal } from "./Modal";
import { TimeFormatted } from "./TimeFormatted";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { FormattedMessage, useIntl } from "react-intl";
import { ResponseRouterOutput } from "../server/routers/response";
import {
  formatImageUrl,
  formatPreviewResponseImageUrl,
} from "../utils/storage";
import { UserRole } from "../utils/user";
import { cls } from "./cls";

export function ResponsesList({
  itemId,
  onAnswer,
}: {
  itemId: string;
  onAnswer(): void;
}) {
  const {
    data: histories,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = trpc.response.getForItem.useInfiniteQuery(
    { itemId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (isLoading) {
    return <p className="py-3 text-gray-400">Chargement...</p>;
  }

  if (error) {
    return (
      <p className="py-3 text-gray-400">
        Les réponses n&apos;ont pas pu être récupérées
      </p>
    );
  }

  if (!histories || histories.pages.some((p) => p.responses.length === 0)) {
    return (
      <p className="py-3 text-gray-400">Aucune réponse pour l&apos;instant !</p>
    );
  }

  return (
    <>
      <ul className="divide-y-2 divide-gray-500/30">
        {histories?.pages.map((page) =>
          page.responses.map((response) => (
            <ResponseRow
              key={response.id}
              response={response}
              onAnswer={() => {
                refetch();
                onAnswer();
              }}
            />
          ))
        )}
      </ul>
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-800 font-semibold uppercase text-gray-300"
        >
          <FormattedMessage id="answers.seemore" defaultMessage="Voir plus" />
        </button>
      )}
    </>
  );
}

export function ResponseRow({
  response,
  onAnswer,
}: {
  response: ResponseRouterOutput["getForItem"]["responses"][number];
  onAnswer(): void;
}) {
  const { data: session } = useSession();
  const intl = useIntl();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const deleteResponse = trpc.response.delete.useMutation();

  return (
    <li className="py-2 flex flex-col md:flex-row items-start">
      <div
        className={cls(
          "py-2 px-4 w-auto lg:w-40 flex items-center justify-center rounded-full",
          response.isFound
            ? "text-green-500 bg-green-400/10"
            : "text-red-500 bg-red-400/10"
        )}
      >
        {response.isFound ? (
          <>
            <HandThumbUpIcon className="h-7 w-7" />
            <span className="font-semibold ml-2">
              <FormattedMessage id="answer.found" defaultMessage="Trouvé" />
            </span>
          </>
        ) : (
          <>
            <HandThumbDownIcon className="h-7 w-7" />
            <span className="font-semibold ml-2">
              <FormattedMessage
                id="answer.notfound"
                defaultMessage="Pas trouvé"
              />
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col px-3 mb-3">
        {response.comment && <p className="p-2 mb-2">{response.comment}</p>}
        {response.image && (
          <Link href={formatImageUrl(response.image)} target="_blank">
            <Image
              width={400}
              height={250}
              className="overflow-hidden rounded-lg shadow-md h-auto"
              alt="image de la réponse"
              src={formatPreviewResponseImageUrl(response.id)}
              unoptimized={true}
            />
          </Link>
        )}
        {!response.public && (
          <div className="mt-2">
            <div className="inline-flex items-center bg-gray-500 p-1 px-2 rounded-md">
              <ClockIcon className="w-4 h-4" />
              <span className="ml-1 text-sm uppercase font-bold">
                <FormattedMessage
                  id="answer.validating"
                  defaultMessage="En validation"
                />
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeletePopup}
        title={intl.formatMessage({
          id: "answer.prompt-delete.title",
          defaultMessage: "Voulez vous supprimer cette réponse ?",
        })}
        description={intl.formatMessage({
          id: "answer.prompt-delete.desc",
          defaultMessage: "Cette opération ne peut être annulé",
        })}
        acceptLabel={intl.formatMessage({
          id: "action.delete",
          defaultMessage: "Supprimer",
        })}
        onAccept={async () => {
          await deleteResponse.mutateAsync(response.id);
          onAnswer();
          setShowDeletePopup(false);
        }}
        onClose={() => {
          setShowDeletePopup(false);
        }}
      />

      <div className="ml-auto flex items-center">
        <p className="text-gray-400 p-2">
          {response.user.image && (
            <img
              alt="photo de profil"
              className="inline w-5 h-5 rounded-full"
              src={response.user.image}
            />
          )}{" "}
          <span className="italic font-bold text-gray-300">
            {response.user.name}
          </span>
          <TimeFormatted className="ml-3 text-sm">
            {response.createdAt}
          </TimeFormatted>
        </p>
        {session &&
          (response.userId === session.user?.id ||
            session.user?.role === UserRole.ADMIN) && (
            <button className="ml-2" onClick={() => setShowDeletePopup(true)}>
              <TrashIcon />
            </button>
          )}
      </div>
    </li>
  );
}
