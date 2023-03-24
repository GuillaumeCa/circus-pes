import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/Modal";
import { trpc } from "../../utils/trpc";

export default function CategoriesManagement() {
  const [categoryName, setCategoryName] = useState("");
  const categoriesQuery = trpc.category.getAll.useQuery();
  const { mutateAsync: createCategory } = trpc.category.create.useMutation();

  return (
    <AdminLayout>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (categoryName !== "") {
            await createCategory({ name: categoryName });
            categoriesQuery.refetch();
          }
        }}
      >
        <div className="mt-3 flex space-x-2">
          <input
            placeholder="Nouvelle catégorie"
            className="appearance-none outline-none border text-sm rounded-lg bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Button type="submit">Ajouter</Button>
        </div>
      </form>

      {categoriesQuery.isLoading && (
        <p>
          <FormattedMessage
            id="action.loading"
            defaultMessage="Chargement..."
          />
        </p>
      )}
      {categoriesQuery.data && (
        <ul className="mt-3 space-y-2">
          {categoriesQuery.data.map((v) => (
            <CategoryRow
              key={v.id}
              id={v.id}
              name={v.name}
              onUpdate={() => categoriesQuery.refetch()}
            />
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}

function CategoryRow({
  id,
  name,
  onUpdate,
}: {
  id: string;
  name: string;
  onUpdate(): void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteCategory } = trpc.category.delete.useMutation({
    onSuccess() {
      onUpdate();
      setShowDeleteConfirm(false);
    },
  });

  return (
    <li className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
      <div>{name}</div>
      <button className="ml-8" onClick={() => setShowDeleteConfirm(true)}>
        <TrashIcon className="w-6 h-6" />
      </button>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Voulez vous supprimer cette catégorie ?"
        description="Cette action ne peut actuellement pas être supprimée."
        acceptLabel="Supprimer"
        onAccept={() => deleteCategory(id)}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </li>
  );
}
