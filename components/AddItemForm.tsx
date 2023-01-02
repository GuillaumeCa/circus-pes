import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { supabase, useAuth } from "../lib/supabase";
import { itemFormSchema, ItemsEntity, LOCATIONS } from "../model/items";
import { Button } from "./Button";
import { XMarkIcon } from "./Icons";

type LocationFormData = z.infer<typeof itemFormSchema>;

interface AddLocationFormProps {
  gameVersionList: string[];
  shardIds: string[];

  onCancel(): void;
  onCreated(item: ItemsEntity): void;
}

export function AddItemForm({
  gameVersionList,
  shardIds,

  onCancel,
  onCreated,
}: AddLocationFormProps) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showShardInfo, setShowShardInfo] = useState(false);

  const { session } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      image: undefined,
    },
  });

  const image = watch("image");

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

    if (formData.image) {
      const fileExt = formData.image[0].name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("items-capture")
        .upload(filePath, formData.image[0], { upsert: true });

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

    onCreated(data);
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
          Shard{" "}
          <button
            type="button"
            title="Afficher/masquer l'aide"
            onClick={() => setShowShardInfo(!showShardInfo)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="inline w-4 h-4 align-text-bottom"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </button>
        </label>

        {showShardInfo && (
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
        )}

        <input
          id="shardId"
          className="mt-2 appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          placeholder="Identifiant de la shard"
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
      <p className="text-red-500 text-sm mt-1">
        {errors.image?.message?.toString()}
      </p>

      <div className="flex items-center justify-end space-x-2 mt-3">
        {err && (
          <p className="text-red-500">
            Impossible d&apos;ajouter la création, veuillez réessayer
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