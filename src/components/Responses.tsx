import {
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { ResponseRouterOutput } from "../server/routers/response";
import { trpc } from "../utils/trpc";
import { TrashIcon } from "./Icons";
import { ConfirmModal } from "./Modal";
import { TimeFormatted } from "./TimeFormatted";

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
    refetch,
  } = trpc.response.getForItem.useQuery(itemId);

  if (isLoading) {
    return null;
  }

  if (!histories || histories.length === 0) {
    return (
      <p className="py-3 text-gray-400">Aucune réponse pour l&apos;instant !</p>
    );
  }

  return (
    <ul className="divide-y-2 divide-gray-500/30">
      {histories?.map((response) => (
        <ResponseRow
          key={response.id}
          response={response}
          onAnswer={() => {
            refetch();
            onAnswer();
          }}
        />
      ))}
    </ul>
  );
}

export function ResponseRow({
  response,
  onAnswer,
}: {
  response: ResponseRouterOutput["getForItem"][number];
  onAnswer(): void;
}) {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const deleteResponse = trpc.response.delete.useMutation();

  return (
    <li className="py-2 flex items-start">
      <div className="py-2 px-4 w-auto lg:w-40 flex items-center justify-center rounded-full text-yellow-500 bg-yellow-400/20">
        {response.isFound ? (
          <>
            <HandThumbUpIcon className="h-7 w-7" />
            <span className="font-semibold ml-2 hidden lg:inline">Trouvé</span>
          </>
        ) : (
          <>
            <HandThumbDownIcon className="h-7 w-7" />
            <span className="font-semibold ml-2 hidden lg:inline">
              Pas trouvé
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col px-3 mb-3">
        {response.comment && <p className="p-2 mb-2">{response.comment}</p>}
        {/* {response.image && (
            <Link href={imagePath!} target="_blank">
              <Image
                width={400}
                height={250}
                className="overflow-hidden rounded-lg shadow-md h-auto"
                alt="image de la création"
                src={previewImagePath!}
                unoptimized={true}
              />
            </Link>
          )} */}
      </div>

      <ConfirmModal
        open={showDeletePopup}
        title="Voulez vous supprimer cette réponse ?"
        description="Cette opération ne peut être annulé"
        acceptLabel="Supprimer"
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
        <button className="ml-2" onClick={() => setShowDeletePopup(true)}>
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
