import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from './session';

export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: {
        name: string;
        permissions: string[];
    };
}

/**
 * Check if the current user is an admin
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
    const session = await getSession();
    if (!session || !session.email) {
        return null;
    }

    try {
        const { data: adminUser, error } = await supabaseAdmin
            .from('admin_users')
            .select(`
        id,
        email,
        name,
        role_id,
        is_active,
        role:roles (
          name,
          permissions:role_permissions (
            permission:permissions (
              code
            )
          )
        )
      `)
            .eq('email', session.email)
            .eq('is_active', true)
            .single();

        if (error || !adminUser) {
            console.error('Admin check error:', error);
            return null;
        }

        // Transform permissions structure
        // The response structure is: role -> permissions -> [{ permission: { code: '...' } }]
        // We want valid permissions array strings
        const permissions = (adminUser.role as any)?.permissions?.map((p: any) => p.permission.code) || [];

        return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: {
                name: (adminUser.role as any)?.name,
                permissions
            }
        };
    } catch (error) {
        console.error('getCurrentAdmin exception:', error);
        return null;
    }
}

/**
 * Middleware helper to verify admin access
 */
export async function requireAdmin() {
    const admin = await getCurrentAdmin();
    if (!admin) {
        throw new Error('Unauthorized: Admin access required');
    }
    return admin;
}
