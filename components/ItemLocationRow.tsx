import Image from "next/image";
import { useAuth } from "../lib/supabase";
import { getItemImageUrl } from "../model/items";
import { UserRole } from "../model/user";

interface ItemLocationRow {
  authorId?: string;
  location: string;
  description: string;
  author: string;
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            )}
        </div>
      </div>

      <div className="flex flex-row mt-2">
        {imagePath && (
          <div className="mr-4 overflow-hidden rounded-lg shadow-md">
            <Image
              width={400}
              height={400}
              alt="capture de la création"
              src={itemImageUrl}
            />
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
            fill={hasLiked ? "currentColor" : "none"}
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
          Par <span className="italic font-bold text-gray-300">{author}</span>{" "}
          le {date}
        </p>
      </div>
    </li>
  );
}
