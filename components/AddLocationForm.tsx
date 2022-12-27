import { useState } from "react";
import { supabase, useAuth } from "../lib/supabase";
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
  const { session } = useAuth();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(false);
        setLoading(true);

        supabase
          .from("items")
          .insert({
            gameVersion,
            shardId,
            description,
            location,
            user_id: session?.user.id,
          })
          .then(({ error }) => {
            setLoading(false);

            if (error) {
              setErr(true);
              return;
            }

            onCreated();
          });
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
        {/* <select id="gameVersion" name="gameVersion">
            {gameVersions.map((v) => (
              <option value={v}>{v}</option>
            ))}
          </select> */}
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
        {/* <select id="shardId" name="shardId">
            {shardIds.map((s) => (
              <option value={s}>{s}</option>
            ))}
          </select> */}
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
