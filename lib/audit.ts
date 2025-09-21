// lib/audit.ts
import { supabaseAdmin } from '@/lib/db';

type AuditInput = {
  actor: string; // 'system/line' など
  action: 'created' | 'updated' | 'deleted' | 'webhook_received' | string;
  entity: string; // 'casts' | 'shifts' | 'stores' | 'line' など
  entityId?: string;
  payload?: any;
};

export async function writeAudit(input: AuditInput) {
  if (!supabaseAdmin) {
    console.warn('[audit] skip: no service role');
    return;
  }
  const { error } = await supabaseAdmin.from('audit_logs').insert({
    actor: input.actor,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? null,
  });
  if (error) console.error('[audit] failed:', error);
}
