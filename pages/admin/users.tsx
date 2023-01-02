import { useState } from "react";
import { useQuery } from "react-query";
import { Button } from "../../components/Button";
import { LoadIcon } from "../../components/Icons";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { useAuth } from "../../lib/supabase";
import {
  formatRole,
  formatRoleDescription,
  getUsers,
  updateRole,
  User,
  UserRole,
} from "../../model/users";

interface UserRowProps {
  user: User;
  onUpdateRole(): void;
}

function UserRow({ user, onUpdateRole }: UserRowProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row justify-between w-full">
      <div className="flex space-x-3 items-center">
        <img className="h-10 w-10 rounded-full" src={user.avatar_url} />
        <span className="font-bold">{user.name}</span>
        <span className="text-sm text-gray-500">{user.name_id}</span>
        {user.id === session?.user.id && (
          <span className="font-bold text-rose-600">Moi</span>
        )}
      </div>

      <div className="mt-2 lg:mt-0">
        <span className="block text-xs uppercase font-bold text-gray-400">
          Rôle
        </span>
        <div className="flex mt-1 items-center space-x-3">
          {user.id === session?.user.id && (
            <span className="font-bold uppercase text-gray-300">
              {formatRole(user.role)}
            </span>
          )}

          {loading && <LoadIcon />}
          {user.id !== session?.user.id &&
            [UserRole.INVITED, UserRole.CONTRIBUTOR, UserRole.ADMIN].map(
              (role) => (
                <Button
                  title={formatRoleDescription(role)}
                  onClick={() => {
                    setLoading(true);
                    updateRole(user.id, role).then(() => {
                      onUpdateRole();
                      setLoading(false);
                    });
                  }}
                  key={role}
                  disabled={role === user.role}
                >
                  {formatRole(role)}
                </Button>
              )
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
  } = useQuery<User[] | null, Error>("users", () => getUsers());
  const [search, setSearch] = useState("");

  return (
    <AdminLayout title="Utilisateurs">
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

      {isLoading && <p>Chargement...</p>}
      {error && <p>Erreur de chargement</p>}

      <ul className="mt-3 space-y-2">
        {users
          ?.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name))
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
