create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
    v_app_key text;
    v_project_id uuid;
    v_customer_id uuid;
begin
    v_app_key := coalesce(new.raw_user_meta_data ->> 'app_key', 'anima');

    select id into v_project_id
    from public.app_projects
    where key = v_app_key
    limit 1;

    if v_project_id is null then
        select id into v_project_id
        from public.app_projects
        where key = 'anima'
        limit 1;
    end if;

    if exists (
        select 1
        from public.customers
        where user_id = new.id
          and project_id = v_project_id
    ) then
        return new;
    end if;

    insert into public.customers (
        project_id,
        user_id,
        email,
        credits,
        creem_customer_id,
        created_at,
        updated_at,
        metadata
    ) values (
        v_project_id,
        new.id,
        new.email,
        1,
        'auto_' || new.id::text,
        now(),
        now(),
        jsonb_build_object(
            'source', 'auto_registration',
            'initial_credits', 1,
            'registration_date', now(),
            'app_key', v_app_key
        )
    )
    returning id into v_customer_id;

    insert into public.credits_history (
        project_id,
        customer_id,
        amount,
        type,
        description,
        created_at,
        metadata
    ) values (
        v_project_id,
        v_customer_id,
        1,
        'add',
        'Welcome bonus: 1 credit for new user',
        now(),
        jsonb_build_object(
            'source', 'welcome_bonus',
            'user_registration', true,
            'app_key', v_app_key,
            'initial_credits', 1
        )
    );

    return new;
end;
$$;

alter function public.handle_new_user() set search_path = public;
