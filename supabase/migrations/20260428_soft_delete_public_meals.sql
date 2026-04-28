-- When a user "deletes" a recipe they made public, we want to keep the row in
-- the community feed (so others can still discover/copy it) while removing it
-- from the owner's "My Meals" list. We do this by orphaning the row: clear
-- user_id and clear notes (notes are personal, never meant for the community).
--
-- Why an RPC: the meals UPDATE RLS policy presumably has a WITH CHECK that
-- requires auth.uid() = user_id on the new row, which would block setting
-- user_id = NULL. SECURITY DEFINER bypasses RLS while we re-verify ownership
-- and the is_public flag inside the function body.

CREATE OR REPLACE FUNCTION public.soft_delete_meal(meal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.meals
  SET user_id = NULL,
      notes = NULL
  WHERE id = meal_id
    AND user_id = auth.uid()
    AND is_public = true;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_meal(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.soft_delete_meal(uuid) TO authenticated;
