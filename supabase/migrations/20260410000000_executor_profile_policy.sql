-- Allow executors to read the profile of any author they are assigned to.
-- Without this, the executor dashboard cannot show author names.
create policy "Executors can view profiles of their authors"
  on public.profiles for select
  using (
    exists (
      select 1 from public.executors
      where author_id = profiles.id
        and executor_user_id = auth.uid()
    )
  );
