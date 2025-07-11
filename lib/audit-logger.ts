// lib/audit-logger.ts
import { createClient } from '@supabase/supabase-js';

interface AuditEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async logEvent(event: AuditEvent) {
    try {
      // In production, you should store audit logs in a separate secure database
      // For now, we'll log to console and could send to a logging service
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...event,
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('AUDIT LOG:', logEntry);
      }

      // In production, you might want to:
      // 1. Send to a logging service (e.g., LogRocket, Sentry)
      // 2. Store in a separate audit database
      // 3. Send alerts for high/critical events
      
      if (event.severity === 'critical') {
        // Send immediate alert for critical events
        await this.sendAlert(event);
      }

      // Store in Supabase audit table (if it exists)
      try {
        await this.supabase
          .from('audit_logs')
          .insert([logEntry]);
      } catch (error) {
        // Audit table might not exist, that's okay
        console.warn('Audit table not available:', error);
      }

    } catch (error) {
      // Don't let audit logging break the application
      console.error('Audit logging failed:', error);
    }
  }

  private async sendAlert(event: AuditEvent) {
    // In production, send alerts via email, Slack, etc.
    console.warn('CRITICAL SECURITY EVENT:', event);
  }

  // Convenience methods for common events
  async logLogin(userId: string, ipAddress: string, userAgent: string, success: boolean) {
    await this.logEvent({
      event_type: 'login_attempt',
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: { success },
      severity: success ? 'low' : 'medium',
    });
  }

  async logLogout(userId: string, ipAddress: string) {
    await this.logEvent({
      event_type: 'logout',
      user_id: userId,
      ip_address: ipAddress,
      severity: 'low',
    });
  }

  async logFailedLogin(email: string, ipAddress: string, userAgent: string) {
    await this.logEvent({
      event_type: 'failed_login',
      ip_address: ipAddress,
      user_agent: userAgent,
      details: { email },
      severity: 'medium',
    });
  }

  async logAccountCreation(userId: string, ipAddress: string) {
    await this.logEvent({
      event_type: 'account_creation',
      user_id: userId,
      ip_address: ipAddress,
      severity: 'medium',
    });
  }

  async logSuspiciousActivity(userId: string, activity: string, details: Record<string, any>) {
    await this.logEvent({
      event_type: 'suspicious_activity',
      user_id: userId,
      details: { activity, ...details },
      severity: 'high',
    });
  }

  async logAdminAction(adminId: string, action: string, targetUserId?: string) {
    await this.logEvent({
      event_type: 'admin_action',
      user_id: adminId,
      details: { action, target_user_id: targetUserId },
      severity: 'medium',
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger(); 