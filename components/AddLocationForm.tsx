import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { supabase, useAuth } from "../lib/supabase";
import { ItemsEntity } from "../model/items";
import { Button } from "./Button";

interface LocationFormData {
  gameVersion: string;
  shardId: string;
  description: string;
  location: string;
}

interface AddLocationFormProps {
  gameVersionList: string[];
  shardIds: string[];

  onCancel(): void;
  onCreated(item: ItemsEntity): void;
}

const locations = [
  "Microtech",
  "Port Tressler",
  "Calliope",
  "Clio",
  "Euterpe",
  "Hurston",
  "Everus Harbor",
  "Comm Array ST1-61",
  "Arial",
  "Aberdeen",
  "Magda",
  "Ita",
  "Crusader",
  "Port Olisar",
  "Cellin",
  "Daymar",
  "Yela",
  "ArcCorp",
  "Baijini Point",
  "Lyria",
  "Wala",
  "Comm Array ST3-90",
];

const locationFormSchema = z.object({
  gameVersion: z
    .string()
    .regex(
      /PTU.[0-9]+|LIVE-3.18/,
      "Le format doit être PTU.00000 ou LIVE-3.18"
    ),
  shardId: z
    .string()
    .regex(/[0-9][A-Z]-[0-9]{3}/, "Le format doit être 1A-000"),
  description: z.string().min(1, "Le champ ne doit pas être vide"),
  location: z.string().min(1, "Le champ ne doit pas être vide"),
});

export function AddLocationForm({
  gameVersionList,
  shardIds,

  onCancel,
  onCreated,
}: AddLocationFormProps) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { session } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
  });

  const location = watch("location");

  const onSubmit = async (formData: LocationFormData) => {
    setErr(false);
    setLoading(true);

    const { data, error } = await supabase
      .from("items")
      .insert<Partial<ItemsEntity>>({
        gameVersion: formData.gameVersion,
        shardId: formData.shardId,
        description: formData.description,
        location: formData.location,
        user_id: session?.user.id,
      })
      .select<"*", ItemsEntity>()
      .single();

    if (error || !data) {
      setLoading(false);
      setErr(true);
      return;
    }

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("items-capture")
        .upload(filePath, file, { upsert: true });

      await supabase
        .from("items")
        .update({
          item_capture_url: filePath,
        })
        .eq("id", data.id);

      if (uploadError) {
        setErr(true);
        setLoading(false);
        supabase.from("items").delete().eq("id", data.id);
        return;
      }
    }

    setLoading(false);

    reset();
    setFile(null);

    onCreated(data);
  };

  const fileTooBig = file ? file.size > 5e6 : false;

  const invalid = loading || !isValid || fileTooBig;

  function handleCancel() {
    clearErrors();
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
          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
          onClick={handleCancel}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
      <div>
        <label
          htmlFor="gameVersion"
          className="text-xs uppercase font-bold text-gray-400"
        >
          Version
        </label>
        <input
          id="gameVersion"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="Version du patch au format PTU.version ou LIVE-3.18"
          autoFocus
          {...register("gameVersion")}
        />
        <div className="flex space-x-2 mt-2">
          {gameVersionList.map((gv) => (
            <Button
              key={gv}
              type="button"
              onClick={() =>
                setValue("gameVersion", gv, { shouldValidate: false })
              }
            >
              {gv}
            </Button>
          ))}
        </div>
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
        <input
          id="shardId"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="ID de la shard au format: 1C-130"
          {...register("shardId")}
        />
        <div className="flex space-x-2 mt-2">
          {shardIds.map((shard) => (
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
        <input
          id="location"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="Lieu de la création ex: Lorville"
          {...register("location")}
        />
        <div className="mt-2 flex flex-wrap items-center">
          {locations
            .filter((l) => {
              return (
                location &&
                l.toLowerCase().startsWith(location.toLowerCase()) &&
                l !== location
              );
            })
            .slice(0, 5)
            .map((l) => (
              <div key={l} className="mr-2 mb-2">
                <Button type="button" onClick={() => setValue("location", l)}>
                  {l}
                </Button>
              </div>
            ))}
          {location &&
            locations.filter((l) =>
              l.toLowerCase().startsWith(location.toLowerCase())
            ).length > 5 && <p>et plus...</p>}
        </div>
        <p className="text-red-500 text-sm mt-1">{errors.location?.message}</p>
      </div>
      <div>
        <label
          className="text-xs uppercase font-bold text-gray-400"
          htmlFor="image"
        >
          Image (optionnel)
        </label>
        <input
          className="block w-full text-sm border rounded-lg file:text-gray-300 file:bg-gray-800 file:font-bold hover:file:bg-gray-900 file:border-none file:py-2 file:px-3 file:mr-3 file:cursor-pointer text-gray-400 focus:outline-none bg-gray-600 border-gray-500 placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500"
          id="image"
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={(event) => {
            if (!event.target.files || event.target.files.length === 0) {
              setFile(null);
              return;
            }

            setFile(event.target.files[0]);
          }}
        />
      </div>
      {fileTooBig && file && (
        <p className="text-red-500 text-sm mt-1">
          L'image est trop grosse, elle doit faire moins de 5 Mo. Elle fait
          actuellement {(file.size / 1e6).toFixed(1)} Mo
        </p>
      )}

      <div className="flex items-center justify-end space-x-2 mt-3">
        {err && (
          <p className="text-red-500">
            Impossible d'ajouter la création, veuillez réessayer
          </p>
        )}
        <Button type="button" btnType="secondary" onClick={handleCancel}>
          Annuler
        </Button>
        <Button type="submit">{loading ? "Chargement..." : "Ajouter"}</Button>
      </div>
    </form>
  );
}
