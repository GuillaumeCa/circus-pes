import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LOCATIONS } from "../utils/locations";
import {
  getFileExtension,
  MAX_IMAGE_UPLOAD_SIZE,
  MIN_IMAGE_UPLOAD_SIZE,
} from "../utils/storage";
import { trpc } from "../utils/trpc";
import { Button } from "./Button";
import { XMarkIcon } from "./Icons";

import { LocationInfo } from "../server/db/item";

type LocationFormData = z.infer<typeof itemFormSchema>;

interface AddLocationFormProps {
  item?: Partial<LocationInfo>;
  shardIds: string[];

  onCancel(): void;
  onCreated(): void;
}

export const itemFormSchema = z
  .object({
    isEdit: z.boolean().default(false),
    gameVersion: z.string(),
    shardId: z
      .string()
      .regex(
        /(US|EU|AP)(E|S|W|SE)[0-9][A-Z]-[0-9]{3}/,
        "L'identifiant doit être au format EUE1A-000"
      ),
    description: z
      .string()
      .min(1, "Le champ ne doit pas être vide")
      .max(255, "La description ne doit pas dépasser 255 caractères"),
    location: z.string().min(1, "Le champ ne doit pas être vide").default(""),
    image:
      typeof window === "undefined"
        ? z.null()
        : z
            .instanceof(FileList, { message: "Une image est requise" })
            .refine((f: FileList) => {
              return (
                f.length === 0 ||
                (f.length > 0 &&
                  ["image/jpg", "image/jpeg", "image/png"].includes(f[0].type))
              );
            }, "Le fichier n'est pas une image au format valide: jpeg, jpg ou png")
            .refine((f: FileList) => {
              return (
                f.length === 0 ||
                (f.length > 0 &&
                  f[0].size >= MIN_IMAGE_UPLOAD_SIZE &&
                  f[0].size <= MAX_IMAGE_UPLOAD_SIZE)
              );
            }, "L'image est trop grosse, elle doit faire moins de 5 Mo"),
  })
  .refine((input) => {
    if (!input.isEdit && input.image?.length === 0) {
      return false;
    }

    return true;
  });

export function ItemForm({
  item,
  shardIds,

  onCancel,
  onCreated,
}: AddLocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();

  const { mutateAsync: updateItem } = trpc.item.edit.useMutation();
  const { mutateAsync: createItem } = trpc.item.create.useMutation();

  const { mutateAsync: getImageUploadUrl } =
    trpc.item.imageUploadUrl.useMutation();

  const { mutateAsync: setItemImage } = trpc.item.setItemImage.useMutation();

  const isUpdateItem = !!item?.id;

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
          {isUpdateItem ? "Modifier la création" : "Nouvelle création"}
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
          Version
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
      <div>
        <label
          htmlFor="shardId"
          className="text-xs uppercase font-bold text-gray-400"
        >
          Shard
        </label>

        <div className="border border-gray-600 bg-gray-800 p-2 rounded-lg">
          <p className="text-sm text-gray-400 leading-6">
            Pour récupérer l&apos;identifiant de la shard sur laquelle vous
            êtes, appuyez sur la touche à gauche du 1 puis tapez{" "}
            <span className="bg-gray-600 font-mono text-gray-400 px-1 py-0.5 rounded">
              r_DisplayInfo 3
            </span>{" "}
            et cherchez l&apos;identifiant en face de ShardId.
            L&apos;identifiant sera sous la forme{" "}
            <span className="bg-gray-600 font-mono break-all text-gray-400 px-1 py-0.5 rounded">
              eptu_use1c_sc_alpha_318x_8319689_game_740
            </span>{" "}
            et il faudra par ex renseigner pour cet identifiant{" "}
            <span className="bg-gray-600 font-mono text-gray-400 px-2 py-0.5 rounded">
              USE1C-740
            </span>{" "}
            dans le champs suivant.
          </p>
        </div>

        <input
          id="shardId"
          className="mt-2 appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="Identifiant de la shard"
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
          Description
        </label>
        <textarea
          id="description"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="Décrivez votre création en quelques mots, avec par exemple les étapes pour la retrouver."
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
          Lieu
        </label>
        <select id="location" className="w-full" {...register("location")}>
          <option value="">Choisissez un lieu</option>
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
          Image
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
            {isUpdateItem
              ? "Impossible de modifier la création, veuillez réessayer"
              : "Impossible d'ajouter la création, veuillez réessayer"}
          </p>
        )}
        <Button type="button" btnType="secondary" onClick={handleCancel}>
          Annuler
        </Button>
        <Button disabled={loading} type="submit">
          {loading ? "Chargement..." : "Valider"}
        </Button>
      </div>
    </form>
  );
}
