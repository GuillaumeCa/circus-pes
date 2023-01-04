export enum UserRole {
  INVITED,
  CONTRIBUTOR,
  ADMIN,
}

export function formatRole(role: UserRole) {
  switch (role) {
    case UserRole.INVITED:
      return "Invité";
    case UserRole.CONTRIBUTOR:
      return "Contributeur";
    case UserRole.ADMIN:
      return "Admin";
  }
}

export function formatRoleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.INVITED:
      return "Ne peut pas ajouter de créations";
    case UserRole.CONTRIBUTOR:
      return "Peut ajouter des créations";
    case UserRole.ADMIN:
      return "Peut modifier le rôle des utilisateurs";
  }
}
