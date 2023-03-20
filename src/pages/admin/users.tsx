import { useSession } from "next-auth/react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { LoadIcon } from "../../components/Icons";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { ConfirmModal } from "../../components/Modal";
import { TabBar } from "../../components/TabBar";
import { UserRouterOutput } from "../../server/routers/user";
import { trpc } from "../../utils/trpc";
import { formatRole, UserRole } from "../../utils/user";

interface UserRowProps {
  user: UserRouterOutput["getUsers"][0];
  onUpdateRole(): void;
}

function UserRow({ user, onUpdateRole }: UserRowProps) {
  const { data, status } = useSession();
  const { mutateAsync: updateRole } = trpc.user.updateRole.useMutation();
  const [loading, setLoading] = useState(false);
  const [showRoleValidationPopup, setShowRoleValidationPopup] = useState(false);

  function updateUserRole(role: UserRole) {
    setLoading(true);
    return updateRole({ userId: user.id, role }).then(() => {
      onUpdateRole();
      setLoading(false);
    });
  }

  return (
    <div className="flex flex-col lg:flex-row justify-between w-full">
      <ConfirmModal
        title={`Valider que vous donnez le rôle admin à ${user.name}`}
        open={showRoleValidationPopup}
        acceptLabel="Valider"
        onAccept={async () => {
          updateUserRole(UserRole.ADMIN).then(() => {
            setShowRoleValidationPopup(false);
          });
        }}
        onClose={() => {
          setShowRoleValidationPopup(false);
        }}
      />

      <div className="flex space-x-3 items-center">
        <img
          className="h-10 w-10 rounded-full"
          alt="photo de profil"
          src={user.image ?? ""}
        />
        <span className="font-bold">
          {user.name}
          <span className="text-sm text-gray-500">#{user.discriminator}</span>
        </span>
        {user.id === data?.user.id && (
          <span className="font-bold text-rose-600">Moi</span>
        )}
      </div>

      <div className="mt-2 lg:mt-0">
        <span className="block text-xs uppercase font-bold text-gray-400">
          Rôle
        </span>
        <div className="flex mt-1 items-center space-x-3">
          {user.id === data?.user.id && (
            <span className="font-bold uppercase text-gray-300">
              {user.role && formatRole(user.role)}
            </span>
          )}

          {loading && <LoadIcon />}
          {user.id !== data?.user.id && (
            <TabBar
              selectedItem={user.role!}
              onSelect={(role) => {
                if (role === UserRole.ADMIN) {
                  setShowRoleValidationPopup(true);
                } else {
                  updateUserRole(role);
                }
              }}
              items={[
                UserRole.INVITED,
                UserRole.CONTRIBUTOR,
                UserRole.ADMIN,
              ].map((r) => ({ key: r, label: formatRole(r) }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = trpc.user.getUsers.useQuery();

  const [search, setSearch] = useState("");

  return (
    <AdminLayout>
      <p className="text-sm text-gray-400">
        Les utilisateurs avec le rôle invité ne peuvent pas ajouter de créations
        et peuvent uniquement liker. Les admin peuvent modifier le rôle des
        utilisateurs et supprimer toutes les créations.
      </p>

      <input
        placeholder="Rechercher..."
        className="mt-3 block w-full p-2.5 appearance-none outline-none border text-sm rounded-lg bg-gray-700 focus:bg-gray-600 border-gray-600 placeholder-gray-400 text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && (
        <p>
          <FormattedMessage
            id="action.loading"
            defaultMessage="Chargement..."
          />
        </p>
      )}
      {error && <p>Erreur de chargement</p>}

      <p className="mt-2 text-gray-400 text-sm">{users?.length} Utilisateurs</p>
      <ul className="mt-3 space-y-2">
        {users
          ?.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0)
          .map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
            >
              <UserRow user={user} onUpdateRole={refetch} />
            </li>
          ))}
      </ul>
    </AdminLayout>
  );
}
