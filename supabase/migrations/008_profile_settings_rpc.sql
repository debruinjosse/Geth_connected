create or replace function public.update_own_profile_name(
  first_name_input text,
  last_name_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if nullif(trim(first_name_input), '') is null then
    raise exception 'first_name_required';
  end if;

  update public.profiles
  set
    first_name = trim(first_name_input),
    last_name = trim(coalesce(last_name_input, ''))
  where id = auth.uid();
end;
$$;

revoke all on function public.update_own_profile_name(text, text) from public;
grant execute on function public.update_own_profile_name(text, text) to authenticated;
