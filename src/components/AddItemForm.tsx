import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PatchVersionRouterOutput } from "../server/routers/patch-version";
import { trpc } from "../utils/trpc";
import { Button } from "./Button";
import { XMarkIcon } from "./Icons";

type LocationFormData = z.infer<typeof itemFormSchema>;

interface AddLocationFormProps {
  patchVersionList: PatchVersionRouterOutput["getPatchVersions"];
  shardIds: string[];

  onCancel(): void;
  onCreated(): void;
}

const MAX_IMAGE_FILE_SIZE = 5e6; // 5M bytes

export const LOCATIONS = [
  "Crusader",
  "Cellin",
  "Yela",
  "Daymar",
  "CRU-L1",
  "CRU-L2",
  "CRU-L3",
  "CRU-L4",
  "CRU-L5",
  "Hurston",
  "Ita",
  "Aberdeen",
  "Arial",
  "Magda",
  "HUR-L1",
  "HUR-L2",
  "HUR-L3",
  "HUR-L4",
  "HUR-L5",
  "ArCorp",
  "Wala",
  "Lyria",
  "ARC-L1",
  "ARC-L2",
  "ARC-L3",
  "ARC-L4",
  "ARC-L5",
  "Microtech",
  "Calliope",
  "Clio",
  "Euterpe",
  "MIC-L1",
  "MIC-L2",
  "MIC-L3",
  "MIC-L4",
  "MIC-L5",
  "Aaron Halo",
  "Stanton",
];

export const itemFormSchema = z.object({
  gameVersion: z.string(),
  shardId: z
    .string()
    .regex(
      /(US|EU|AP)(E|S|W)[0-9][A-Z]-[0-9]{3}/,
      "L'identifiant doit être au format EUE1A-000"
    ),
  description: z
    .string()
    .min(1, "Le champ ne doit pas être vide")
    .max(255, "La description ne doit pas dépasser 255 caractères"),
  location: z.string().min(1, "Le champ ne doit pas être vide"),
  image:
    typeof window === "undefined"
      ? z.null()
      : z
          .instanceof(FileList, { message: "Une image est requise" })
          .refine((f: FileList) => {
            return f && f.length > 0 && f[0].size <= MAX_IMAGE_FILE_SIZE;
          }, "L'image est trop grosse, elle doit faire moins de 5 Mo"),
});

export function AddItemForm({
  patchVersionList,
  shardIds,

  onCancel,
  onCreated,
}: AddLocationFormProps) {
  const {
    mutateAsync: createItem,
    isError,
    isLoading,
  } = trpc.item.createItem.useMutation();

  const { mutateAsync: getPresignedUrl } =
    trpc.storage.presignedUrl.useMutation();

  const { mutateAsync: setItemImage } = trpc.item.setItemImage.useMutation();

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
    defaultValues: {
      image: undefined,
    },
  });

  const image = watch("image");

  const shardId = watch("shardId");

  const shardsFiltered = shardIds.filter(
    (s) => !shardId || s.toUpperCase().includes(shardId.toUpperCase())
  );

  const onSubmit = async (formData: LocationFormData) => {
    const file = formData.image!.item(0)!;
    try {
      const createdItem = await createItem({
        description: formData.description,
        location: formData.location,
        patchId: formData.gameVersion,
        shardId: formData.shardId,
      });
      if (createdItem) {
        const key = `${createdItem.id}-${file.name}`;
        const url = await getPresignedUrl(key);

        const res = await fetch(url, {
          method: "PUT",
          body: file,
        });
        if (!res.ok) {
          throw new Error("failed to upload image");
        }
        await setItemImage({ itemId: createdItem.id, image: key });
      }

      reset();
      onCreated();
    } catch (error) {}
  };

  function handleCancel() {
    onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 mt-2 border border-gray-600 rounded-lg"
    >
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold mb-3">Nouvelle création</h2>
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
          htmlFor="gameVersion"
          className="text-xs uppercase font-bold text-gray-400"
        >
          Version
        </label>
        <select
          id="gameVersion"
          className="w-full"
          {...register("gameVersion")}
        >
          {patchVersionList.map((pv) => (
            <option key={pv.id} value={pv.id}>
              {pv.name} {!pv.visible ? "(Archivé)" : ""}
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
        />
        <div className="flex space-x-2 mt-2">
          {shardsFiltered.slice(0, 4).map((shard) => (
            <Button
              key={shard}
              type="button"
              onClick={() =>
                setValue("shardId", shard, { shouldValidate: false })
              }
            >
              {shard}
            </Button>
          ))}
          {shardsFiltered.length > 4 && <p>Et plus..</p>}
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
          placeholder="Décrivez votre création en quelques mots.."
          maxLength={255}
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
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
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
        {isError && (
          <p className="text-red-500">
            Impossible d&apos;ajouter la création, veuillez réessayer
          </p>
        )}
        <Button type="button" btnType="secondary" onClick={handleCancel}>
          Annuler
        </Button>
        <Button type="submit">{isLoading ? "Chargement..." : "Ajouter"}</Button>
      </div>
    </form>
  );
}
