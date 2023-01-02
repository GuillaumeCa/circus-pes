import { useQuery } from "react-query";
import { Button } from "../../components/Button";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { getItemImageUrl, getItems, LocationInfo } from "../../model/items";

function ItemMgtRow({ item }: { item: LocationInfo }) {
  const itemImageUrl = getItemImageUrl(item.item_capture_url);

  return (
    <li key={item.id} className="p-3 flex justify-between">
      <div className="flex items-start">
        <img className="rounded-lg shadow-md" src={itemImageUrl} width={200} />
        <p className="ml-2">{item.description}</p>
        <span>{item.shardId}</span>
        <span>{item.location}</span>
        <span>
          De {item.users_name} le{" "}
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button>Accepter</Button>
        <Button btnType="secondary">Bloquer</Button>
      </div>
    </li>
  );
}

export default function ItemsManagement() {
  const {
    data: items,
    error,
    refetch,
  } = useQuery<LocationInfo[], Error>(["items", "recent"], async () => {
    const { data, error } = await getItems("recent");
    if (error) {
      throw new Error("Failed to fetch items: " + error.message);
    }
    return data;
  });

  return (
    <AdminLayout title="Gestion des publications">
      <div className="mt-4">
        {!items && <p>Chargement...</p>}
        {items && error && (
          <p>Erreur de chargement, veuillez recharger la page</p>
        )}
        {items?.length === 0 && <p>Aucune création</p>}

        {items && (
          <ul className="space-y-2 overflow-hidden bg-gray-600 rounded-lg divide-y-[1px] divide-gray-700">
            {items?.map((item) => (
              <ItemMgtRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
