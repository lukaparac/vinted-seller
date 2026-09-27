<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- AI and web research are reached only through `src/lib/ai/*` and `src/lib/research/*` provider interfaces (mock providers today), so a real model can be swapped in without touching UI code.
- All backend work that needs secrets or privileged access goes in `createServerFn` files under `src/lib/*.functions.ts` with `requireSupabaseAuth`; the browser only uses the generated Supabase client under RLS.
- Every table is per-user and protected by RLS on `auth.uid()`; item photos live in the private `item-photos` bucket and are read through signed URLs.
- Product copy is Croatian; domain labels, statuses and formatting helpers live in `src/lib/domain.ts`.
- The app never contacts Vinted: no scraping, sessions or auto-publishing — listings are copied/exported for manual publication.
