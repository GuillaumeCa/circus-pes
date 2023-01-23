import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { getParagraphs } from "../utils/text";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";
import { AddResponseForm } from "./AddResponseForm";
import { TrashIcon } from "./Icons";
import { ConfirmModal, Modal } from "./Modal";
import { TimeFormatted } from "./TimeFormatted";

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

  onDelete(): void;
  onLike(like: number): void;
  onAnswer(): void;
}

function HistoryList({ itemId }: { itemId: string }) {
  const {
    data: histories,
    isLoading,
    refetch,
  } = trpc.response.getForItem.useQuery(itemId);
  const deleteResponse = trpc.response.delete.useMutation();

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
        <li key={response.id} className="py-2 flex items-start">
          <div className="py-2 px-4 w-auto lg:w-40 flex items-center justify-center rounded-full text-yellow-500 bg-yellow-400/20">
            {response.isFound ? (
              <>
                <HandThumbUpIcon className="h-7 w-7" />
                <span className="font-semibold ml-2 hidden lg:inline">
                  Trouvé
                </span>
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
            <button
              className="ml-2"
              onClick={async () => {
                await deleteResponse.mutateAsync(response.id);
                refetch();
              }}
            >
              <TrashIcon />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
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

  onDelete,
  onLike,
  onAnswer,
}: ItemRowProps) {
  const { data, status } = useSession();
  const { mutateAsync: deleteItem } = trpc.item.deleteItem.useMutation();
  const { mutateAsync: likeItem } = trpc.item.like.useMutation();
  const { mutateAsync: unLikeItem } = trpc.item.unLike.useMutation();

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

  // const lastResponseNb = 2;
  // let foundIndicator = histories.slice(0, lastResponseNb).reduce((all, e) => {
  //   return all + (e.isFound ? 1 : 0);
  // }, 0);
  // foundIndicator = Math.max(0.1, foundIndicator / lastResponseNb);
  const foundIndicator = 0;

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
          <div className="ml-2 h-6 overflow-hidden rounded-full bg-gray-500">
            <div
              className="w-full h-full transition-all overflow-hidden"
              style={{ width: `${foundIndicator * 100}%` }}
            >
              <div className="w-36 h-full saturate-150 bg-gradient-to-r from-red-500 to-green-600"></div>
            </div>
          </div>
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
            <span className="mx-2">{likes}</span>
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
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 inline-block" />
            <span className="ml-2">Répondre</span>
          </button>
          <button
            className="flex items-center px-2 py-1 font-semibold text-gray-200 bg-rose-700 hover:bg-rose-800 rounded-md"
            onClick={() => setHistory(!history)}
          >
            {history ? (
              <ArrowUpIcon className="h-5 w-5 inline-block" />
            ) : (
              <ArrowDownIcon className="h-5 w-5 inline-block" />
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
          <HistoryList itemId={id} />
        </div>
      )}
    </li>
  );
}
