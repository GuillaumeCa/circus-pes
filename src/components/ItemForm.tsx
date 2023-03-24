import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LOCATIONS } from "../utils/constants";
import {
  getFileExtension,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_UPLOAD_SIZE,
} from "../utils/storage";
import { trpc } from "../utils/trpc";
import { Button } from "./ui/Button";
import { XMarkIcon } from "./ui/Icons";

import { FormattedMessage, useIntl } from "react-intl";
import { LocationInfo } from "../server/db/item";
import { FormRow } from "./ui/FormRow";

interface AddLocationFormProps {
  item?: Partial<LocationInfo>;
  shardIds: string[];

  onCancel(): void;
  onCreated(): void;
}

function useItemFormSchema() {
  const intl = useIntl();

  return z
    .object({
      isEdit: z.boolean().default(false),
      gameVersion: z.string(),
      category: z.string(),
      shardId: z.string().regex(
        /(US|EU|AP)(E|S|W|SE)[0-9][A-Z]-[0-9]{3}/,
        intl.formatMessage({
          id: "forms.item.shardid.error.format",
          defaultMessage: "L'identifiant doit être au format EUE1A-000",
        })
      ),
      description: z
        .string()
        .min(
          1,
          intl.formatMessage({
            id: "forms.item.description.error.min",
            defaultMessage: "Le champ ne doit pas être vide",
          })
        )
        .max(
          255,
          intl.formatMessage({
            id: "forms.item.description.error.max",
            defaultMessage:
              "La description ne doit pas dépasser 255 caractères",
          })
        ),
      location: z
        .string()
        .min(
          1,
          intl.formatMessage({
            id: "forms.item.location.error.min",
            defaultMessage: "Le champ ne doit pas être vide",
          })
        )
        .default(""),
      image:
        typeof window === "undefined"
          ? z.null()
          : z
              .instanceof(FileList, {
                message: intl.formatMessage({
                  id: "forms.item.image.error.required",
                  defaultMessage: "Une image est requise",
                }),
              })
              .refine(
                (f: FileList) => {
                  return (
                    f.length === 0 ||
                    (f.length > 0 &&
                      ["image/jpg", "image/jpeg", "image/png"].includes(
                        f[0].type
                      ))
                  );
                },
                intl.formatMessage({
                  id: "forms.item.image.error.format",
                  defaultMessage:
                    "Le fichier n'est pas une image au format valide: jpeg, jpg ou png",
                })
              )
              .refine(
                (f: FileList) => {
                  return (
                    f.length === 0 ||
                    (f.length > 0 &&
                      f[0].size >= MIN_IMAGE_UPLOAD_SIZE &&
                      f[0].size <= MAX_IMAGE_UPLOAD_SIZE)
                  );
                },
                intl.formatMessage({
                  id: "forms.item.image.error.size",
                  defaultMessage:
                    "L'image est trop grosse, elle doit faire moins de 5 Mo",
                })
              ),
    })
    .refine((input) => {
      if (!input.isEdit && input.image?.length === 0) {
        return false;
      }

      return true;
    });
}

export function ItemForm({
  item,
  shardIds,

  onCancel,
  onCreated,
}: AddLocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const intl = useIntl();
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();
  const { data: categories } = trpc.category.getAll.useQuery();

  const { mutateAsync: updateItem } = trpc.item.edit.useMutation();
  const { mutateAsync: createItem } = trpc.item.create.useMutation();

  const { mutateAsync: getImageUploadUrl } =
    trpc.item.imageUploadUrl.useMutation();

  const { mutateAsync: setItemImage } = trpc.item.setItemImage.useMutation();

  const isUpdateItem = !!item?.id;

  const itemFormSchema = useItemFormSchema();
  type LocationFormData = z.infer<typeof itemFormSchema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    resetField,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: item
      ? {
          isEdit: true,
          gameVersion: item.patchVersionId,
          shardId: item.shardId,
          description: item.description,
          location: item.location,
          category: item.categoryId,
          image: undefined,
        }
      : {
          image: undefined,
        },
  });

  const image = watch("image");

  const shardId = watch("shardId");

  const shardsFiltered = shardIds.filter(
    (s) => !shardId || s.toUpperCase().includes(shardId.toUpperCase())
  );

  async function handleImageUpload(file: File, itemId: string, ext: string) {
    const postPolicyResult = await getImageUploadUrl({
      itemId,
      ext: ext as "jpeg" | "jpg" | "png",
    });

    const formData = new FormData();
    for (let key in postPolicyResult.formData) {
      formData.append(key, postPolicyResult.formData[key]);
    }
    formData.append("file", file);

    const res = await fetch(postPolicyResult.postURL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("failed to upload image");
    }

    const key = postPolicyResult.formData["key"];
    await setItemImage({ itemId, image: key });
  }

  const onSubmit = async (formData: LocationFormData) => {
    setLoading(true);
    setError(false);

    try {
      if (item?.id) {
        const updatedItem = await updateItem({
          id: item.id,
          description: formData.description,
          location: formData.location,
          patchId: formData.gameVersion,
          shardId: formData.shardId,
          categoryId: formData.category,
        });
        const file = formData.image!.item(0)!;
        if (updatedItem && file) {
          const ext = getFileExtension(file);
          await handleImageUpload(file, updatedItem.id, ext);
        }
      } else {
        const createdItem = await createItem({
          description: formData.description,
          location: formData.location,
          patchId: formData.gameVersion,
          shardId: formData.shardId,
          categoryId: formData.category,
        });
        if (createdItem) {
          const file = formData.image!.item(0)!;
          const ext = getFileExtension(file);
          await handleImageUpload(file, createdItem.id, ext);
        }
      }

      onCreated();
    } catch (err) {
      console.error("Failed to add item", err);
      setError(true);
    }
    setLoading(false);
  };

  function handleCancel() {
    onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 flex flex-col space-y-2 border border-gray-600 rounded-lg"
    >
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold mb-3">
          {isUpdateItem ? (
            <FormattedMessage
              id="update-item"
              defaultMessage="Modifier la création"
            />
          ) : (
            <FormattedMessage
              id="new-item"
              defaultMessage="Nouvelle création"
            />
          )}
        </h2>
        <button
          type="button"
          className="text-gray-400 bg-transparent hover:bg-gray-600 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          onClick={handleCancel}
        >
          <XMarkIcon />
        </button>
      </div>
      <div>
        <label
          htmlFor="gameVersionForm"
          className="text-xs uppercase font-bold text-gray-400"
        >
          <FormattedMessage
            id="filter.version.label"
            defaultMessage="Version"
          />
        </label>
        <select
          id="gameVersionForm"
          disabled={isUpdateItem}
          className="w-full"
          {...register("gameVersion")}
        >
          {patchVersions?.map((pv) => (
            <option key={pv.id} value={pv.id}>
              {pv.name}
            </option>
          ))}
        </select>
        <p className="text-red-500 text-sm mt-1">
          {errors.gameVersion?.message}
        </p>
      </div>

      <FormRow
        id="categoryForm"
        label="Categorie"
        errorMessage={errors.category?.message}
      >
        <select id="categoryForm" className="w-full" {...register("category")}>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </FormRow>

      <div>
        <label
          htmlFor="shardId"
          className="text-xs uppercase font-bold text-gray-400"
        >
          Shard
        </label>

        <div className="border border-gray-600 bg-gray-800 p-2 rounded-lg">
          <p className="text-sm text-gray-400 leading-6">
            <FormattedMessage
              id="item.shard.helpmsg"
              defaultMessage="Pour récupérer l'identifiant de la shard sur laquelle vous êtes, appuyez sur la touche à gauche du 1 puis tapez <m>r_DisplayInfo 3</m> et cherchez l'identifiant en face de ShardId. L'identifiant sera sous la forme <mb>eptu_use1c_sc_alpha_318x_8319689_game_740</mb> et il faudra par ex renseigner pour cet identifiant <m>USE1C-740</m> dans le champs suivant."
              values={{
                m: (chunks) => (
                  <span className="bg-gray-600 font-mono text-gray-400 px-1 py-0.5 rounded">
                    {chunks}
                  </span>
                ),
                mb: (chunks) => (
                  <span className="bg-gray-600 font-mono break-all text-gray-400 px-1 py-0.5 rounded">
                    {chunks}
                  </span>
                ),
              }}
            />
          </p>
        </div>

        <input
          id="shardId"
          className="mt-2 appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder={intl.formatMessage({
            id: "item.shard.placeholder",
            defaultMessage: "Identifiant de la shard",
          })}
          {...register("shardId")}
          onChange={(e) => {
            setValue("shardId", e.target.value.toUpperCase());
          }}
        />
        <div className="flex flex-nowrap space-x-2 mt-2 p-1 items-center overflow-auto">
          {shardsFiltered.slice(0, 4).map((shard) => (
            <Button
              key={shard}
              className="whitespace-nowrap"
              type="button"
              onClick={() =>
                setValue("shardId", shard, { shouldValidate: false })
              }
            >
              {shard}
            </Button>
          ))}
          {shardsFiltered.length > 4 && (
            <p className="text-gray-400">Et plus..</p>
          )}
        </div>
        <p className="text-red-500 text-sm mt-1">{errors.shardId?.message}</p>
      </div>
      <div>
        <label
          htmlFor="description"
          className="text-xs uppercase font-bold text-gray-400"
        >
          <FormattedMessage
            id="item.description"
            defaultMessage="Description"
          />
        </label>
        <textarea
          id="description"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder={intl.formatMessage({
            id: "item.description.placeholder",
            defaultMessage:
              "Décrivez votre création en quelques mots, avec par exemple les étapes pour la retrouver.",
          })}
          maxLength={255}
          rows={5}
          {...register("description")}
        />
        <p className="text-red-500 text-sm mt-1">
          {errors.description?.message}
        </p>
      </div>
      <div>
        <label
          htmlFor="location"
          className="text-xs uppercase font-bold text-gray-400"
        >
          <FormattedMessage id="filter.location.label" defaultMessage="Lieu" />
        </label>
        <select id="location" className="w-full" {...register("location")}>
          <option value="">
            <FormattedMessage
              id="item.location.choose"
              defaultMessage="Choisissez un lieu"
            />
          </option>
          {LOCATIONS.map((l) => (
            <optgroup key={l.name} label={l.name}>
              {l.children.map((child) => (
                <option key={child} value={child}>
                  {child}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-red-500 text-sm mt-1">{errors.location?.message}</p>
      </div>
      <div>
        <label
          className="text-xs uppercase font-bold text-gray-400"
          htmlFor="image"
        >
          <FormattedMessage id="item.image" defaultMessage="Image" />
        </label>
        <div className="flex">
          <input
            className="block w-full text-sm border rounded-lg file:text-gray-300 file:bg-gray-800 file:font-bold hover:file:bg-gray-900 file:border-none file:py-2 file:px-3 file:mr-3 file:cursor-pointer text-gray-400 focus:outline-none bg-gray-600 border-gray-500 placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500"
            id="image"
            type="file"
            accept=".jpg,.jpeg,.png"
            {...register("image")}
          />
          {(image?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => resetField("image")}
              className="bg-gray-500 p-2 rounded-lg ml-2"
            >
              <XMarkIcon />
            </button>
          )}
        </div>
      </div>
      <p className="text-red-500 text-sm mt-1">{errors.image?.message}</p>

      <div className="flex items-center justify-end space-x-2 mt-3">
        {error && (
          <p className="text-red-500">
            {isUpdateItem ? (
              <FormattedMessage
                id="update-item.error"
                defaultMessage="Impossible de modifier la création, veuillez réessayer"
              />
            ) : (
              <FormattedMessage
                id="create—item.error"
                defaultMessage="Impossible d'ajouter la création, veuillez réessayer"
              />
            )}
          </p>
        )}
        <Button type="button" btnType="secondary" onClick={handleCancel}>
          <FormattedMessage id="action.cancel" defaultMessage="Annuler" />
        </Button>
        <Button disabled={loading} type="submit">
          {loading ? (
            <FormattedMessage
              id="action.loading"
              defaultMessage="Chargement..."
            />
          ) : (
            <FormattedMessage id="action.validate" defaultMessage="Valider" />
          )}
        </Button>
      </div>
    </form>
  );
}
