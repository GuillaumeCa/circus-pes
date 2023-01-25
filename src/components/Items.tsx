import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { formatImageUrl, formatPreviewItemImageUrl } from "../utils/storage";
import { getParagraphs } from "../utils/text";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";
import { AddResponseForm } from "./AddResponseForm";
import { TrashIcon } from "./Icons";
import { ConfirmModal, Modal } from "./Modal";
import { ResponsesList } from "./Responses";
import { TimeFormatted } from "./TimeFormatted";

import type { LocationInfo } from "../server/db/item";
import type { ItemRouterInput } from "../server/routers/item";
import type { PatchVersionRouterOutput } from "../server/routers/patch-version";
import { FoundIndicator } from "./FoundIndicator";

export type SortOption = ItemRouterInput["getItems"]["sortBy"];
export type SortShard = "az" | "num";

type PatchVersion = PatchVersionRouterOutput["getPatchVersions"][number];

export function calculateIndicator(found: number, notFound: number) {
  if (found === 0 && notFound === 0) {
    return null;
  }
  const sum = found - notFound;

  if (sum === 0) {
    return 1;
  }

  if (sum < 0) {
    return 0;
  } else {
    return 2;
  }
}

export function ItemList({
  isLoading,
  hasError,
  selectedPatch,
  itemsFiltered,
  sortOpt,
  onUpdateItems,
}: {
  isLoading: boolean;
  hasError: boolean;
  selectedPatch?: PatchVersion;
  itemsFiltered: LocationInfo[];
  sortOpt: SortOption;
  onUpdateItems(): void;
}) {
  const utils = trpc.useContext();

  return (
    <>
      {isLoading && <p className="text-gray-400">Chargement...</p>}
      {hasError && (
        <p className="text-gray-400">
          Erreur de chargement, veuillez recharger la page
        </p>
      )}
      {!hasError &&
        !isLoading &&
        (!selectedPatch || itemsFiltered.length === 0) && (
          <p className="text-gray-400">Aucune création</p>
        )}

      {!hasError && itemsFiltered && (
        <ul className="bg-gray-600 rounded-none sm:rounded-xl -mx-3 sm:mx-auto divide-y-2 divide-gray-700">
          {itemsFiltered.map((item) => (
            <ItemRow
              key={item.id}
              id={item.id}
              location={item.location}
              description={item.description}
              authorId={item.userId}
              author={item.userName}
              avatarUrl={item.userImage}
              shard={item.shardId}
              likes={item.likesCount}
              hasLiked={item.hasLiked === 1}
              foundIndicator={calculateIndicator(item.found, item.notFound)}
              imagePath={item.image ? formatImageUrl(item.image) : undefined}
              previewImagePath={
                item.image
                  ? formatPreviewItemImageUrl(item.patchVersionId, item.id)
                  : undefined
              }
              date={new Date(item.createdAt)}
              isPublic={item.public}
              onAnswer={onUpdateItems}
              onLike={(like) => {
                if (!selectedPatch) {
                  return;
                }

                const currentInput: ItemRouterInput["getItems"] = {
                  patchVersion: selectedPatch.id ?? "",
                  sortBy: sortOpt,
                };

                const items = utils.item.getItems.getData(currentInput);

                if (items) {
                  utils.item.getItems.setData(
                    currentInput,
                    items.map((it) => {
                      if (it.id === item.id) {
                        return {
                          ...it,
                          hasLiked: like === 1 ? 1 : 0,
                          likesCount: it.likesCount + like,
                        };
                      }

                      return it;
                    })
                  );
                }
              }}
              onDelete={onUpdateItems}
            />
          ))}
        </ul>
      )}
    </>
  );
}

interface ItemRowProps {
  id: string;
  authorId?: string;
  location: string;
  description: string;
  author?: string;
  avatarUrl?: string;
  date: Date;
  shard: string;
  likes: number;
  hasLiked: boolean;
  previewImagePath?: string;
  imagePath?: string;
  isPublic: boolean;
  foundIndicator: number | null;

  onDelete(): void;
  onLike(like: number): void;
  onAnswer(): void;
}

export function ItemRow({
  id,
  location,
  description,
  authorId,
  author,
  avatarUrl,
  shard,
  date,
  likes,
  hasLiked,
  previewImagePath,
  imagePath,
  isPublic,
  foundIndicator,

  onDelete,
  onLike,
  onAnswer,
}: ItemRowProps) {
  const { data, status } = useSession();
  const { mutateAsync: deleteItem } = trpc.item.deleteItem.useMutation();
  const { mutateAsync: likeItem } = trpc.item.like.useMutation();
  const { mutateAsync: unLikeItem } = trpc.item.unLike.useMutation();
  const trpcCtx = trpc.useContext();

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const [history, setHistory] = useState(false);

  function handleLike() {
    if (hasLiked) {
      unLikeItem(id).then(() => onLike(-1));
    } else {
      likeItem(id).then(() => onLike(1));
    }
  }

  function handleDelete() {
    deleteItem(id).then(() => onDelete());
  }

  return (
    <li className="flex flex-col p-4">
      <div className="flex justify-between">
        <div className="flex items-center">
          <p
            title="Lieu"
            className="bg-rose-700 px-3 py-1 rounded-full uppercase font-bold text-sm"
          >
            {location}
          </p>
          <p
            title="ID de Shard"
            className="ml-2 text-sm font-bold bg-gray-700 py-1 px-2 rounded-md"
          >
            <span>{shard}</span>
          </p>
          {!isPublic && (
            <div className="inline-flex items-center ml-2 bg-gray-500 p-1 px-2 rounded-md">
              <ClockIcon className="w-4 h-4" />
              <span className="ml-1 text-sm uppercase font-bold">
                En validation
              </span>
            </div>
          )}
          {foundIndicator !== null && <FoundIndicator value={foundIndicator} />}
        </div>

        <div className="flex space-x-4">
          <button
            title="Copier le lien"
            className="active:text-gray-500"
            onClick={() => {
              const url =
                typeof window !== undefined
                  ? `${window.location.origin}/item/${id}`
                  : "";
              navigator.clipboard.writeText(url).then(
                () => {
                  toast.success(
                    "Le lien vers la création à été copié dans votre presse papier !"
                  );
                },
                () => {
                  toast.error("Le lien vers la création n'a pas pu être copié");
                }
              );
            }}
          >
            <LinkIcon className="w-5 h-5" />
          </button>
          {data &&
            (authorId === data.user?.id ||
              data.user?.role === UserRole.ADMIN) && (
              <button
                className="active:text-gray-500"
                title="Supprimer"
                onClick={() => setShowDeletePopup(true)}
              >
                <TrashIcon />
              </button>
            )}
        </div>
      </div>

      <ConfirmModal
        open={showDeletePopup}
        title="Voulez vous supprimer cette création ?"
        description="Cette opération ne peut être annulé"
        acceptLabel="Supprimer"
        onAccept={() => {
          handleDelete();
          setShowDeletePopup(false);
        }}
        onClose={() => {
          setShowDeletePopup(false);
        }}
      />

      <div className="flex flex-col lg:flex-row mt-4 space-y-2 lg:space-y-0">
        {imagePath && previewImagePath && (
          <div className="mr-4 w-full lg:w-auto lg:min-w-fit max-w-md">
            <Link href={imagePath} target="_blank">
              <Image
                width={500}
                height={281}
                className="overflow-hidden rounded-lg shadow-md h-auto"
                alt="image de la création"
                src={previewImagePath}
                unoptimized={true}
              />
            </Link>
          </div>
        )}

        <div>
          {getParagraphs(description).map((paragraph, i) => (
            <p key={i} className="w-full lg:w-auto text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-4 items-center">
        <div className="flex space-x-2 items-center">
          <button
            disabled={status === "unauthenticated"}
            onClick={handleLike}
            className="flex px-1 py-1 text-gray-200 disabled:bg-gray-700 bg-gray-700 hover:bg-gray-800 rounded-md"
          >
            <span className="mx-2 font-semibold">{likes}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={
                hasLiked || status === "unauthenticated"
                  ? "currentColor"
                  : "none"
              }
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 inline text-yellow-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
          <button
            className="flex items-center px-2 py-1 font-semibold text-gray-200 disabled:bg-gray-700 bg-gray-700 hover:bg-gray-800 rounded-md"
            onClick={() => setShowResponseForm(true)}
          >
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 inline-block text-yellow-500" />
            <span className="ml-2">Répondre</span>
          </button>
          <button
            className="flex items-center px-2 py-1 font-semibold text-gray-200 bg-gray-700 hover:bg-gray-800 rounded-md"
            onClick={() => setHistory(!history)}
          >
            {history ? (
              <ArrowUpIcon className="h-5 w-5 inline-block text-yellow-500" />
            ) : (
              <ArrowDownIcon className="h-5 w-5 inline-block text-yellow-500" />
            )}
            <span className="ml-2">Historique</span>
          </button>
        </div>

        <Modal
          onClose={() => setShowResponseForm(false)}
          open={showResponseForm}
          className="max-w-2xl p-6"
        >
          <AddResponseForm
            itemId={id}
            onSuccess={() => {
              setHistory(true);
              onAnswer();
              trpcCtx.response.getForItem.refetch();
            }}
            onClose={() => setShowResponseForm(false)}
          />
        </Modal>

        <p className="text-gray-400">
          <img
            alt="photo de profil"
            className="inline w-5 h-5 rounded-full"
            src={avatarUrl}
          />{" "}
          <span className="italic font-bold text-gray-300">{author}</span>
          <TimeFormatted className="ml-3 text-sm">{date}</TimeFormatted>
        </p>
      </div>

      {history && (
        <div className="mt-3 border-t-4 border-gray-500/30">
          <ResponsesList itemId={id} onAnswer={onAnswer} />
        </div>
      )}
    </li>
  );
}
