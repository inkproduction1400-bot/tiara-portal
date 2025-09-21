// lib/audit.ts
import { supabaseAdmin } from '@/lib/db';

export type AuditInput = {
  actor: string;
  action: 'created'|'updated'|'deleted'|'webhook_received'|'login'|'other';
  entity: string;
  entityId?: string;
  payload?: any;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(input: AuditInput) {
  if (!supabaseAdmin) {
    const err = new Error('[audit] supabaseAdmin is undefined (no service role?)');
    console.error(err.message);
    throw err;
  }
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      actor: input.actor,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data?.id ?? null;
}
