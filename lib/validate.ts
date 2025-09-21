// lib/validate.ts
import { z } from 'zod';

export const pageSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  sort:  z.string().optional(),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to:   z.string().datetime().optional(),
});

export const shiftsQuerySchema = pageSchema
  .merge(dateRangeSchema)
  .extend({
    store_id: z.string().uuid().optional(),
    cast_id:  z.string().uuid().optional(),
    status:   z.enum(['scheduled','confirmed','canceled','finished']).optional(),
    role:     z.enum(['cast']).optional(),
    expand:   z.enum(['names']).optional(),
  });

export const castsQuerySchema = pageSchema.extend({
  keyword:   z.string().optional(),
  owner:     z.string().optional(),
  genre:     z.string().optional(),
  drinkable: z.coerce.boolean().optional(),
  wage_min:  z.coerce.number().optional(),
  active:    z.coerce.boolean().optional(),
  sort:      z.string().optional(), // 例: "rating,wage,name"
});

export const storesQuerySchema = pageSchema.extend({
  keyword: z.string().optional(),
  active:  z.coerce.boolean().optional(),
  sort:    z.string().optional(),
});

// 統一エラーレスポンス
export type ApiError = { ok:false; code:'VALIDATION_ERROR'|'DB_ERROR'|'INTERNAL_ERROR'; message:string };
export const err = (code:ApiError['code'], message:string):ApiError => ({ ok:false, code, message });
