import { useAuth } from "../lib/supabase";
import { DeleteButton } from "./Button";

interface ItemLocationRow {
  location: string;
  description: string;
  author: string;
  date: string;

  onDelete(): void;
}

export function ItemLocationRow({
  location,
  description,
  author,
  date,
  onDelete,
}: ItemLocationRow) {
  const { session } = useAuth();
  return (
    <li className="p-4">
      <span className="bg-rose-600 px-3 py-1 rounded-full uppercase font-bold text-sm">
        {location}
      </span>
      <p className="mt-2">{description}</p>
      <div className="flex justify-end mt-2">
        <p className="text-gray-400">
          Trouvé par <span className="italic font-bold">{author}</span> le{" "}
          {date}
        </p>
      </div>
      <div className="mt-3 flex justify-end space-x-2">
        {session && (
          <DeleteButton btnType="secondary" onClick={onDelete}>
            Supprimer
          </DeleteButton>
        )}
      </div>
    </li>
  );
}
