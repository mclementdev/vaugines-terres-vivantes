-- Teintes d'étiquettes de la DA (catégories d'actualités, périodes d'actions)
-- et lien facultatif sur une carte d'action.

create type public.ton as enum ('terre', 'olive', 'indigo', 'abricot');

alter table public.categories add column ton public.ton not null default 'terre';
alter table public.actions add column ton public.ton not null default 'abricot';
alter table public.actions add column lien_label text;
alter table public.actions add column lien_href text;
