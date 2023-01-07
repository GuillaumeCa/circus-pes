import { ClockIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";
import { TrashIcon } from "./Icons";

interface ItemLocationRow {
  id: string;
  authorId?: string;
  location: string;
  description: string;
  author?: string;
  avatarUrl?: string;
  date: string;
  shard: string;
  likes: number;
  hasLiked: boolean;
  imagePath?: string;
  isPublic: boolean;

  onDelete(): void;
  onLike(): void;
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
  imagePath,
  isPublic,

  onDelete,
  onLike,
}: ItemLocationRow) {
  const { data, status } = useSession();
  const { mutateAsync: deleteItem } = trpc.item.deleteItem.useMutation();
  const { mutateAsync: likeItem } = trpc.item.like.useMutation();
  const { mutateAsync: unLikeItem } = trpc.item.unLike.useMutation();

  function handleLike() {
    if (hasLiked) {
      unLikeItem(id).then(() => onLike());
    } else {
      likeItem(id).then(() => onLike());
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
            {shard}
          </p>
          {!isPublic && (
            <div className="inline-flex items-center ml-2 bg-gray-500 p-1 px-2 rounded-md">
              <ClockIcon className="w-4 h-4" />
              <span className="ml-1 text-sm uppercase font-bold">
                En validation
              </span>
            </div>
          )}
        </div>
        <div>
          {data &&
            (authorId === data.user?.id ||
              data.user?.role === UserRole.ADMIN) && (
              <button title="Supprimer" onClick={handleDelete}>
                <TrashIcon />
              </button>
            )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row mt-2 space-y-2 lg:space-y-0">
        {imagePath && (
          <div className="mr-4 w-full lg:w-auto lg:min-w-fit max-w-md overflow-hidden rounded-lg shadow-md">
            <Link href={imagePath} target="_blank">
              <Image
                width={500}
                height={300}
                alt="capture de la création"
                src={imagePath}
              />
            </Link>
          </div>
        )}

        <p className="w-full lg:w-auto text-lg">{description}</p>
      </div>

      <div className="flex justify-between mt-4">
        <button
          disabled={status === "unauthenticated"}
          onClick={handleLike}
          className="flex px-1 py-1 text-gray-200 disabled:bg-gray-700 bg-gray-700 hover:bg-gray-800 rounded-md"
        >
          <span className="mx-2">{likes}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={
              hasLiked || status === "unauthenticated" ? "currentColor" : "none"
            }
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 inline text-rose-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        <p className="text-gray-400">
          <img className="inline w-5 h-5 rounded-full" src={avatarUrl} />{" "}
          <span className="italic font-bold text-gray-300">{author}</span> le{" "}
          {date}
        </p>
      </div>
    </li>
  );
}
