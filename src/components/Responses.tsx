import {
  ClockIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { TrashIcon } from "./ui/Icons";
import { ConfirmModal } from "./ui/Modal";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { FormattedMessage, useIntl } from "react-intl";
import { ResponseRouterOutput } from "../server/routers/response";
import { cls } from "../utils/cls";
import {
  formatImageUrl,
  formatPreviewResponseImageUrl,
} from "../utils/storage";
import { getParagraphs } from "../utils/text";
import { UserRole } from "../utils/user";
import { AuthorInfos } from "./Items";

type ResponseType = ResponseRouterOutput["getForItem"]["responses"][number];

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
    return (
      <p className="py-3 text-gray-400">
        <FormattedMessage id="action.loading" defaultMessage="Chargement..." />
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-3 text-gray-400">
        <FormattedMessage
          id="answers.error"
          defaultMessage="Les réponses n'ont pas pu être récupérées"
        />
      </p>
    );
  }

  if (!histories || histories.pages.some((p) => p.responses.length === 0)) {
    return (
      <p className="py-3 text-gray-400">
        <FormattedMessage
          id="answers.no-answers"
          defaultMessage="Aucune réponse pour l'instant !"
        />
      </p>
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
  response: ResponseType;
  onAnswer(): void;
}) {
  const { data: session } = useSession();
  const intl = useIntl();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const deleteResponse = trpc.response.delete.useMutation();

  return (
    <li className="py-2 flex flex-col md:flex-row items-start">
      <div className="flex items-center">
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
        <AuthorInfos
          className="pl-4 block md:hidden"
          avatarUrl={response.user.image}
          userName={response.user.name}
          date={response.createdAt}
        />
      </div>

      <div className="flex flex-col px-3 mb-3">
        <AuthorInfos
          className="p-2 hidden md:block"
          avatarUrl={response.user.image}
          userName={response.user.name}
          date={response.createdAt}
        />

        <div className="p-2 mb-2">
          {getParagraphs(response.comment ?? "").map((paragraph, i) => (
            <p key={i} className="w-full lg:w-auto">
              {paragraph}
            </p>
          ))}
        </div>
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
