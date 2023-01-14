export enum UserRole {
  INVITED = 0,
  CONTRIBUTOR = 1,
  ADMIN = 2,
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
      return "Peut uniquement liker les créations";
    case UserRole.CONTRIBUTOR:
      return "Peut proposer et liker des créations";
    case UserRole.ADMIN:
      return "Peut modifier le rôle des utilisateurs, modérer les publications et gérer les versions de patch";
  }
}
