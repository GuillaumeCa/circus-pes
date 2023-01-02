import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../lib/supabase";
import { getItemImageUrl } from "../model/items";
import { UserRole } from "../model/users";
import { TrashIcon } from "./Icons";

interface ItemLocationRow {
  authorId?: string;
  location: string;
  description: string;
  author?: string;
  avatarUrl?: string;
  date: string;
  shard: string;
  likes: number;
  hasLiked: boolean;
  imagePath: string;

  onDelete(): void;
  onLike(): void;
}

export function ItemLocationRow({
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

  onDelete,
  onLike,
}: ItemLocationRow) {
  const { session, user } = useAuth();
  const itemImageUrl = getItemImageUrl(imagePath);

  return (
    <li className="flex flex-col p-4">
      <div className="flex justify-between">
        <div>
          <span
            title="Lieu"
            className="bg-rose-700 px-3 py-1 rounded-full uppercase font-bold text-sm"
          >
            {location}
          </span>
          <span
            title="ID de Shard"
            className="ml-2 text-sm font-bold bg-gray-700 p-1 rounded-md"
          >
            {shard}
          </span>
        </div>
        <div>
          {session &&
            (authorId === user?.id || user?.role === UserRole.ADMIN) && (
              <button title="Supprimer" onClick={onDelete}>
                <TrashIcon />
              </button>
            )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row mt-2 space-y-2 lg:space-y-0">
        {imagePath && (
          <div className="mr-4 max-w-md overflow-hidden rounded-lg shadow-md">
            <Link href={itemImageUrl} target="_blank">
              <Image
                width={500}
                height={300}
                alt="capture de la création"
                src={itemImageUrl}
              />
            </Link>
          </div>
        )}

        <p className="text-lg">{description}</p>
      </div>

      <div className="flex justify-between mt-4">
        <button
          disabled={!session}
          onClick={onLike}
          className="flex px-1 py-1 text-gray-200 disabled:bg-gray-700 bg-gray-700 hover:bg-gray-800 rounded-md"
        >
          <span className="mx-2">{likes}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={hasLiked || !session ? "currentColor" : "none"}
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
