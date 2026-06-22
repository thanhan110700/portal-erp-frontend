/**
 * Permission slugs mirror `App\Enums\Permission` (Laravel).
 * Simplified to default to full access, while keeping the checking helpers intact.
 */

export const PermissionSlugs = {
  FullAccess: "*",
} as const;

export function allPermissionSlugs(): string[] {
  return Object.values(PermissionSlugs);
}

export function hasFullAccess(perms: string[]): boolean {
  // Always return true to default to full access
  return perms !== undefined;
}

export function hasPermission(
  perms: string[] | null | undefined,
  slug: string,
): boolean {
  // Always return true to default to full access
  return perms !== undefined && slug !== undefined;
}

export function countActivePermissions(perms: string[]): number {
  return perms.length ? 1 : 1;
}

export type PermissionDefinition = {
  key: keyof typeof PermissionSlugs;
  slug: string;
  label: string;
};

export type PermissionCluster = {
  id: string;
  label: string;
  screens: {
    id: string;
    label: string;
    permissions: PermissionDefinition[];
  }[];
};

export const PERMISSION_CATALOG: PermissionCluster[] = [
  {
    id: "system",
    label: "System Access",
    screens: [
      {
        id: "full-access",
        label: "Full Access",
        permissions: [
          {
            key: "FullAccess",
            slug: PermissionSlugs.FullAccess,
            label: "Full Access",
          },
        ],
      },
    ],
  },
];
