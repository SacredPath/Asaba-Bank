// lib/audit-logger.ts
import { useSupabase } from '@/hooks/useSupabase';

class AuditLogger {
  private supabase: any;

  constructor() {
    // Initialize with null, will be set when needed
    this.supabase = null;
  }

  setSupabase(supabase: any) {
    this.supabase = supabase;
  }

  async logAdminAction(adminId: string, action: string, targetId?: string, details?: any) {
    try {
      if (!this.supabase) {
        console.warn('Supabase not initialized for audit logging');
        return;
      }

      await this.supabase.from('audit_logs').insert({
        admin_id: adminId,
        action: action,
        target_id: targetId,
        details: details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  async logUserAction(userId: string, action: string, details?: any) {
    try {
      if (!this.supabase) {
        console.warn('Supabase not initialized for audit logging');
        return;
      }

      await this.supabase.from('audit_logs').insert({
        user_id: userId,
        action: action,
        details: details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}

export const auditLogger = new AuditLogger(); 