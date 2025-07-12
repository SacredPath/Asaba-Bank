// lib/audit-logger.ts
import supabase from '@/lib/supabase/client';

class AuditLogger {
  private supabase: any;

  constructor() {
    // Use the existing Supabase client instance
    this.supabase = supabase;
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
        user_id: adminId,
        event_type: `admin_${action}`,
        details: {
          action,
          target_id: targetId,
          ...details
        },
        severity: 'medium'
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
        event_type: `user_${action}`,
        details: details,
        severity: 'low'
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}

export const auditLogger = new AuditLogger(); 