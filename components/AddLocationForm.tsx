import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase, useAuth } from "../lib/supabase";
import { ItemsEntity } from "../model/items";
import { Button } from "./Button";

export interface LocationFormInfo {
  gameVersion: string;
  shardId: string;
}

interface AddLocationFormProps {
  onCancel(): void;
  onCreated(): void;
}

export function AddLocationForm({ onCancel, onCreated }: AddLocationFormProps) {
  const [gameVersion, setGameVersion] = useState("");
  const [shardId, setShardId] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { session } = useAuth();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) {
          return;
        }

        setErr(false);
        setLoading(true);

        const { data, error } = await supabase
          .from("items")
          .insert<Partial<ItemsEntity>>({
            gameVersion,
            shardId,
            description,
            location,
            user_id: session?.user.id,
          })
          .select<"*", ItemsEntity>()
          .single();

        if (error || !data) {
          setLoading(false);
          setErr(true);
          return;
        }

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

        setLoading(false);

        onCreated();
      }}
      className="p-4 mt-2 border border-gray-600 rounded-lg"
    >
      <h2 className="text-xl font-bold mb-3">Nouvelle création</h2>
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
          name="gameVersion"
          placeholder="PTU-3.18"
          onChange={(e) => setGameVersion(e.target.value)}
        />
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
          name="shardId"
          placeholder="1C-30"
          onChange={(e) => setShardId(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="text-xs uppercase font-bold text-gray-400"
        >
          Description
        </label>
        <input
          id="description"
          className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
          name="description"
          placeholder="J'ai laissé un pico sous un banc"
          onChange={(e) => setDescription(e.target.value)}
        />
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
          name="location"
          placeholder="Lorville"
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label
          className="text-xs uppercase font-bold text-gray-400"
          htmlFor="image"
        >
          Image
        </label>
        <input
          className="block w-full text-sm border rounded-lg file:text-gray-300 file:bg-gray-800 file:font-bold hover:file:bg-gray-900 file:border-none file:py-2 file:px-3 file:mr-3 file:cursor-pointer text-gray-400 focus:outline-none bg-gray-600 border-gray-500 placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500"
          id="image"
          type="file"
          onChange={(event) => {
            if (!event.target.files || event.target.files.length === 0) {
              return;
            }

            setFile(event.target.files[0]);
          }}
        />
      </div>

      <div className="flex items-center justify-end space-x-2 mt-3">
        {err && (
          <p className="text-red-500">
            Impossible d'ajouter la création, veuillez réessayer
          </p>
        )}
        <Button type="button" btnType="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button disabled={loading} type="submit">
          {loading ? "Chargement..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
