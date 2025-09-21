-- allow 'canceled' in shifts.status
ALTER TABLE public.shifts
  DROP CONSTRAINT IF EXISTS shifts_status_check;

ALTER TABLE public.shifts
  ADD CONSTRAINT shifts_status_check
  CHECK (status IN ('scheduled','confirmed','finished','canceled'));

-- 既定値も念のため明示
ALTER TABLE public.shifts
  ALTER COLUMN status SET DEFAULT 'scheduled';
