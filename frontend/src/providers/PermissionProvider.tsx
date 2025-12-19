"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { RequestExecutionPermissionsReturnType } from "@metamask/smart-accounts-kit/actions";

// Type for a single permission from the array
export type Permission =
  NonNullable<RequestExecutionPermissionsReturnType>[number];

// Extended permission with expiry for our storage needs
export interface StoredPermission extends Permission {
  storedExpiry?: number; // We store the expiry separately
}

interface PermissionContextType {
  permission: StoredPermission | null;
  savePermission: (permission: Permission, expiry?: number) => void;
  fetchPermission: () => StoredPermission | null;
  removePermission: () => void;
  isPermissionValid: () => boolean;
}

const PERMISSION_STORAGE_KEY = "prophet:erc7715:permission";

export const PermissionContext = createContext<PermissionContextType>({
  permission: null,
  savePermission: () => {},
  fetchPermission: () => null,
  removePermission: () => {},
  isPermissionValid: () => false,
});

export const PermissionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [permission, setPermission] = useState<StoredPermission | null>(null);

  // Load permission from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredPermission;
        // Check if permission is still valid (not expired)
        const expiry = parsed.storedExpiry;
        if (expiry && expiry > Math.floor(Date.now() / 1000)) {
          setPermission(parsed);
          console.log("✅ Loaded valid permission from storage");
        } else {
          // Remove expired permission
          localStorage.removeItem(PERMISSION_STORAGE_KEY);
          console.log("⚠️ Removed expired permission from storage");
        }
      }
    } catch (error) {
      console.error("Error loading permission from storage:", error);
    }
  }, []);

  // Save permission to state and localStorage
  const savePermission = useCallback(
    (newPermission: Permission, expiry?: number) => {
      const storedPermission: StoredPermission = {
        ...newPermission,
        storedExpiry: expiry || Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Default 24 hours
      };
      setPermission(storedPermission);
      try {
        localStorage.setItem(
          PERMISSION_STORAGE_KEY,
          JSON.stringify(storedPermission)
        );
        console.log("✅ Permission saved:", {
          expiry: storedPermission.storedExpiry,
          expiresIn: `${Math.round(
            (storedPermission.storedExpiry! - Math.floor(Date.now() / 1000)) /
              3600
          )} hours`,
        });
      } catch (error) {
        console.error("Error saving permission to storage:", error);
      }
    },
    []
  );

  // Fetch permission from state
  const fetchPermission = useCallback(() => {
    return permission;
  }, [permission]);

  // Remove permission from state and localStorage
  const removePermission = useCallback(() => {
    setPermission(null);
    try {
      localStorage.removeItem(PERMISSION_STORAGE_KEY);
      console.log("✅ Permission removed");
    } catch (error) {
      console.error("Error removing permission from storage:", error);
    }
  }, []);

  // Check if permission is still valid
  const isPermissionValid = useCallback(() => {
    if (!permission) return false;
    if (!permission.storedExpiry) return false;
    return permission.storedExpiry > Math.floor(Date.now() / 1000);
  }, [permission]);

  return (
    <PermissionContext.Provider
      value={{
        permission,
        savePermission,
        fetchPermission,
        removePermission,
        isPermissionValid,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionContext);
};
