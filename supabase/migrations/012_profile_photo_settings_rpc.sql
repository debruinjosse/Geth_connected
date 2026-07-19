create or replace function public.update_own_profile_photo(
  profile_image_input text
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

  if nullif(trim(profile_image_input), '') is null then
    raise exception 'profile_image_required';
  end if;

  if trim(profile_image_input) !~ '^https?://' then
    raise exception 'profile_image_invalid';
  end if;

  update public.profiles
  set profile_image = trim(profile_image_input)
  where id = auth.uid();
end;
$$;

revoke all on function public.update_own_profile_photo(text) from public;
grant execute on function public.update_own_profile_photo(text) to authenticated;
