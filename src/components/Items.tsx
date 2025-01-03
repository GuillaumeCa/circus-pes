import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  LinkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  formatImageUrl,
  formatPreviewItemImageUrl,
  useOpts,
} from "../utils/storage";
import { getParagraphs } from "../utils/text";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";
import { AddResponseForm } from "./AddResponseForm";
import { ResponsesList } from "./Responses";
import { TrashIcon } from "./ui/Icons";
import { ConfirmModal, Modal } from "./ui/Modal";
import { TimeFormatted } from "./ui/TimeFormatted";

import { InfiniteData } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import type { LocationInfo } from "../server/db/item";
import type { ItemRouterInput } from "../server/routers/item";
import { CATEGORIES } from "../utils/constants";
import { FoundIndicator } from "./FoundIndicator";
import { ItemForm } from "./ItemForm";
import { Button } from "./ui/Button";

export type SortOption = ItemRouterInput["getItems"]["sortBy"];
export type SortShard = "az" | "num";

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

export function ItemListPaginated({
  itemPages,
  isLoading,
  isFetching,
  hasError,
  hasNextPage,
  onUpdateItems,
  onLike,
  onFetchNextPage,
}: {
  itemPages?: InfiniteData<{ responses: LocationInfo[]; cursor?: number }>;
  isLoading: boolean;
  isFetching: boolean;
  hasError: boolean;
  hasNextPage?: boolean;
  onLike(item: LocationInfo, like: number): void;
  onUpdateItems(): void;
  onFetchNextPage(): void;
}) {
  if (isLoading && !isFetching) {
    return (
      <p className="text-gray-400">
        <FormattedMessage id="action.loading" defaultMessage="Chargement..." />{" "}
      </p>
    );
  }

  if (!isLoading && !itemPages?.pages.some((p) => p.responses.length > 0)) {
    return (
      <p className="text-gray-400">
        <FormattedMessage id="items.no-item" defaultMessage="Aucune création" />
      </p>
    );
  }

  return (
    <>
      {hasError && (
        <p className="text-gray-400 mb-2">
          <FormattedMessage
            id="loading-error"
            defaultMessage="Erreur de chargement, veuillez recharger la page"
          />
        </p>
      )}
      {itemPages && (
        <ul className="bg-gray-600 rounded-none sm:rounded-xl -mx-3 sm:mx-auto divide-y-2 divide-gray-700">
          {itemPages.pages.map((p) =>
            p.responses.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onLike={(like) => onLike(item, like)}
                onUpdateItems={onUpdateItems}
                onDelete={onUpdateItems}
              />
            ))
          )}
        </ul>
      )}
      <div className="mt-3 flex justify-center">
        {hasNextPage && (
          <Button btnType="secondary" onClick={() => onFetchNextPage()}>
            <FormattedMessage
              id="items.show-more"
              defaultMessage="Afficher plus..."
            />
          </Button>
        )}
      </div>
    </>
  );
}

function LikeIcon({
  liked,
  location,
  isLoggedIn,
}: {
  isLoggedIn: boolean;
  liked: boolean;
  location: string;
}) {
  const [opt] = useOpts();

  if (location === "Microtech" && liked) {
    return <img src="/pico.png" className="w-6 h-6" />;
  }

  if (location === "Crusader" && liked) {
    return (
      <img
        src={opt.likeFinley ? "/finley.png" : "/picocookfinley.gif"}
        className="h-6 rounded-sm"
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={liked || !isLoggedIn ? "currentColor" : "none"}
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
  );
}

interface ItemRowProps {
  item: LocationInfo;
  pinnedResponses?: boolean;

  onLike(like: number): void;
  onUpdateItems(): void;
  onDelete(): void;
}

export function ItemRow({
  item,
  pinnedResponses,

  onLike,
  onDelete,
  onUpdateItems,
}: ItemRowProps) {
  const {
    id,
    location,
    description,
    userId: authorId,
    userName: author,
    userImage: avatarUrl,
    shardId: shard,
    likesCount: likes,
    public: isPublic,
    responsesCount,
  } = item;

  const intl = useIntl();
  const router = useRouter();

  const hasLiked = item.hasLiked === 1;
  const foundIndicator = calculateIndicator(item.found, item.notFound);
  const imagePath = item.image ? formatImageUrl(item.image) : undefined;
  const previewImagePath = item.image
    ? formatPreviewItemImageUrl(item.patchVersionId, item.id) +
      "?t=" +
      item.updatedAt.getTime()
    : undefined;

  const date = item.createdAt;

  const { data, status } = useSession();
  const { mutateAsync: deleteItem } = trpc.item.deleteItem.useMutation();
  const { mutateAsync: likeItem } = trpc.item.like.useMutation();
  const { mutateAsync: unLikeItem } = trpc.item.unLike.useMutation();
  const trpcCtx = trpc.useContext();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const [history, setHistory] = useState(false);

  const category = useCategory(item.category);

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
    <li className="flex flex-col p-3 sm:p-4">
      {item && (
        <Modal
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          className="max-w-2xl"
        >
          <ItemForm
            item={item}
            shardIds={[]}
            onCancel={() => setShowEditForm(false)}
            onCreated={() => {
              onUpdateItems();
              setShowEditForm(false);
            }}
          />
        </Modal>
      )}

      <div className="flex justify-between">
        <div className="flex flex-col sm:flex-row">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              title="Lieu"
              className="bg-rose-700 px-3 py-1 rounded-full uppercase font-bold text-sm"
            >
              {location}
            </p>
            <p
              title="ID de Shard"
              className="text-sm font-bold bg-gray-700 py-1 px-2 rounded-md"
            >
              <span>{shard}</span>
            </p>
            {item.category && (
              <p
                title="Categorie"
                className="text-sm font-bold bg-gray-700 py-1 px-2 rounded-md"
              >
                <span>{category.name}</span>
              </p>
            )}
          </div>
          <div className="flex mt-2 sm:mt-0 items-center">
            {!isPublic && (
              <div className="ml-0 sm:ml-2 mr-3 sm:mr-0 p-1 px-2 inline-flex items-center bg-gray-500 rounded-md">
                <ClockIcon className="w-4 h-4" />
                <span className="ml-1 text-sm uppercase font-bold">
                  <FormattedMessage
                    id="item.validating"
                    defaultMessage="En validation"
                  />
                </span>
              </div>
            )}

            {foundIndicator !== null && (
              <FoundIndicator value={foundIndicator} />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            title={intl.formatMessage({
              id: "item.copylink.title",
              defaultMessage: "Copier le lien",
            })}
            className="active:text-gray-500"
            onClick={() => {
              const url =
                typeof window !== undefined
                  ? `${window.location.origin}${
                      router.locale ? `/${router.locale}` : ""
                    }/item/${id}`
                  : "";
              navigator.clipboard.writeText(url).then(
                () => {
                  toast.success(
                    intl.formatMessage({
                      id: "item.copylink.success",
                      defaultMessage:
                        "Le lien vers la création à été copié dans votre presse papier !",
                    })
                  );
                },
                () => {
                  toast.error(
                    intl.formatMessage({
                      id: "item.copylink.error",
                      defaultMessage:
                        "Le lien vers la création n'a pas pu être copié",
                    })
                  );
                }
              );
            }}
          >
            <LinkIcon className="w-5 h-5" />
          </button>
          {data &&
            (authorId === data.user?.id ||
              data.user?.role === UserRole.ADMIN) &&
            (data.user.role !== UserRole.ADMIN ? !item.public : true) && (
              <>
                <button
                  title={intl.formatMessage({
                    id: "item.edit",
                    defaultMessage: "Editer",
                  })}
                  className="active:text-gray-500"
                  onClick={() => setShowEditForm(true)}
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  className="active:text-gray-500"
                  title={intl.formatMessage({
                    id: "action.delete",
                    defaultMessage: "Supprimer",
                  })}
                  onClick={() => setShowDeletePopup(true)}
                >
                  <TrashIcon />
                </button>
              </>
            )}
        </div>
      </div>

      <ConfirmModal
        open={showDeletePopup}
        title={intl.formatMessage({
          id: "item.prompt-delete.title",
          defaultMessage: "Voulez vous supprimer cette création ?",
        })}
        description={intl.formatMessage({
          id: "item.prompt-delete.desc",
          defaultMessage: "Cette opération ne peut être annulé",
        })}
        acceptLabel={intl.formatMessage({
          id: "action.delete",
          defaultMessage: "Supprimer",
        })}
        onAccept={() => {
          handleDelete();
          setShowDeletePopup(false);
        }}
        onClose={() => {
          setShowDeletePopup(false);
        }}
      />

      <div className="flex flex-col lg:flex-row mt-3 sm:mt-4 space-y-2 lg:space-y-0">
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
            <LikeIcon
              liked={hasLiked}
              isLoggedIn={status === "authenticated"}
              location={location}
            />
          </button>
          {status === "authenticated" &&
            data.user.role !== UserRole.INVITED && (
              <button
                className="flex items-center px-2 py-1 font-semibold text-gray-200 disabled:bg-gray-700 bg-gray-700 hover:bg-gray-800 rounded-md"
                onClick={() => setShowResponseForm(true)}
              >
                <ChatBubbleLeftEllipsisIcon className="h-6 w-6 inline-block text-yellow-500" />
                <span className="ml-2 hidden sm:inline">
                  <FormattedMessage
                    id="item.answer"
                    defaultMessage="Répondre"
                  />
                </span>
              </button>
            )}
          {responsesCount > 0 && !pinnedResponses && (
            <button
              className="flex h-8 relative items-center px-2 py-1 font-semibold text-gray-200 bg-gray-700 hover:bg-gray-800 rounded-md"
              onClick={() => setHistory(!history)}
            >
              <span className="absolute z-10 -top-2 -right-3 px-1 min-w-[1.25rem] h-5 mr-1 text-sm shadow-md rounded-full inline-flex text-gray-700 justify-center items-center bg-yellow-500">
                {responsesCount}
              </span>
              {history ? (
                <ArrowUpIcon className="h-5 w-5 inline-block text-yellow-500" />
              ) : (
                <ArrowDownIcon className="h-5 w-5 inline-block text-yellow-500" />
              )}
              <span className="ml-2 hidden sm:inline">
                <FormattedMessage
                  id="item.history"
                  defaultMessage="Historique"
                />
              </span>
              <ChatBubbleBottomCenterTextIcon className="ml-1 h-5 w-5 block sm:hidden" />
            </button>
          )}
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
              onUpdateItems();
              trpcCtx.response.getForItem.refetch();
            }}
            onClose={() => setShowResponseForm(false)}
          />
        </Modal>

        <AuthorInfos
          avatarUrl={avatarUrl}
          userName={author}
          date={date}
          className="ml-4"
        />
      </div>

      {(history || pinnedResponses) && (
        <div className="mt-3 border-t-4 border-gray-500/30">
          <ResponsesList itemId={id} onAnswer={onUpdateItems} />
        </div>
      )}
    </li>
  );
}

export function AuthorInfos({
  avatarUrl,
  userName,
  date,
  className,
}: {
  avatarUrl: string | null;
  userName: string | null;
  date: Date;
  className: string;
}) {
  const [avatarError, setAvatarError] = useState(false);
  return (
    <div className={className}>
      {!avatarError && avatarUrl && (
        <Image
          src={avatarUrl}
          width={20}
          height={20}
          unoptimized={true}
          onError={() => setAvatarError(true)}
          alt="photo de profil"
          className="inline rounded-full"
        />
      )}{" "}
      <span className="italic font-bold text-gray-300">{userName}</span>
      <TimeFormatted className="text-gray-400 ml-3 text-sm">
        {date}
      </TimeFormatted>
    </div>
  );
}

export function useCategory(id?: string) {
  const intl = useIntl();

  const category = CATEGORIES.find((c) => c.id === id);
  const name =
    category?.name[intl.locale as keyof (typeof CATEGORIES)[number]["name"]];
  const description: string | null = category?.description
    ? category?.description[
        intl.locale as keyof (typeof CATEGORIES)[number]["description"]
      ]
    : null;

  return { name, description };
}

export function CategoryLabel({ id }: { id: string }) {
  const { name } = useCategory(id);
  return <>{name}</>;
}
export function CategoryDescription({ id }: { id: string }) {
  const { description } = useCategory(id);
  return <>{description}</>;
}
