import { useState } from "react";
import { useQuery } from "react-query";
import { BaseLayout } from "../components/BaseLayout";
import { Button } from "../components/Button";
import { useAuth } from "../lib/supabase";
import {
  formatRole,
  formatRoleDescription,
  getUsers,
  updateRole,
  User,
  UserRole,
} from "../model/user";

interface UserRowProps {
  user: User;
  onUpdateRole(): void;
}

function UserRow({ user, onUpdateRole }: UserRowProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <>
      <div className="flex space-x-3 items-center">
        <img className="h-10 w-10 rounded-full" src={user.avatar_url} />
        <span className="font-bold">{user.name}</span>
        {user.id === session?.user.id && (
          <span className="font-bold text-rose-600">Moi</span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {user.id === session?.user.id && (
          <span className="font-bold uppercase text-gray-400">
            {formatRole(user.role)}
          </span>
        )}

        {loading && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 animate-spin"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        )}

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
    </>
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
    <BaseLayout>
      <h2 className="text-2xl mt-3">Utilisateurs</h2>
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
    </BaseLayout>
  );
}
