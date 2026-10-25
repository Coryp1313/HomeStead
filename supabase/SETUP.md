# Setting up the Homestead database (Supabase)

This takes about 20 minutes, and you only do it once. Do every step **before** merging the
"real accounts and listings" update. If you merge first, the live site won't load any listings.

---

## 1. Create the Supabase project (skip if you already did)

1. Go to **supabase.com**, click **Start your project**, and sign in with GitHub.
2. Click **New project**.
   - Name: `homestead`
   - Database password: click **Generate a password**, then save it in your password manager. You
     won't need it day to day, but don't lose it. Don't send it to anyone (including Claude).
   - Region: **West US** (closest to Colorado)
   - Plan: **Free**
3. Click **Create new project** and wait 1–2 minutes while it sets up.

## 2. Create the tables

This builds the place where accounts, farms, listings and photos are stored. It also adds the 12
sample listings.

1. In the left sidebar, click **SQL Editor**.
2. Click **+ New query**.
3. Open `supabase/schema.sql` from this update. Copy **everything** in it and paste it into the editor.
4. Click **Run** (bottom right).
5. You should see **"Success. No rows returned"**. A few yellow "notice … skipping" messages are
   normal.

To check it worked, click **Table Editor** in the sidebar. You should see `listings` (12 rows),
`sellers` (6 rows) and `profiles` (empty for now).

## 3. Tell Supabase your website address

This is the address that "confirm your email" and "reset your password" links send people back to.

1. Sidebar → **Authentication** → **URL Configuration**.
2. **Site URL**: paste your live Homestead address, for example `https://homestead-xyz.vercel.app`.
   Click **Save**.
3. Under **Redirect URLs**, click **Add URL** and add the same address followed by `/**`, for example
   `https://homestead-xyz.vercel.app/**`.

> **Heads-up about emails:** Supabase's built-in email sender only sends a few emails per hour,
> which is fine for testing. Before you invite lots of people, we'll connect it to Resend (which
> you already use) so confirmation emails always go out.

## 4. Copy your Supabase keys

1. Sidebar → **Project Settings** (gear icon) → **API Keys**.
2. You need three values. Keep this tab open.
   - **Project URL**: at the top of **Project Settings → Data API** (looks like `https://abcdefgh.supabase.co`).
   - **Publishable / anon key**: safe to use in the browser.
   - **Secret / service_role key**: **this one is a password.** Only paste it into Vercel. Never
     put it in GitHub or send it to anyone.

   (If you see a **Legacy API keys** tab, the `anon` and `service_role` keys there work too.)

## 5. Add the keys to Vercel

1. Go to **vercel.com** → your Homestead project → **Settings** → **Environment Variables**.
2. Add these four, one at a time. For each one, leave all environments ticked (Production, Preview,
   Development) and click **Save**.

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | the publishable / anon key |
   | `SUPABASE_URL` | your Project URL (same as above) |
   | `SUPABASE_SERVICE_ROLE_KEY` | the secret / service_role key |

   The two `VITE_` ones go to the browser. The other two stay on the server only.

## 6. Test the preview before going live

When the update is opened as a pull request on GitHub, Vercel builds a **preview** copy of the site
with its own link. The live site doesn't change. Open that preview link and try:

1. **Sign up** with your real email → click the confirmation link in your inbox → you land in the
   marketplace, signed in.
2. **Log out**, then **log in** again.
3. **Sell tab** → **Set up your seller account** → enter a farm name → finish Stripe's test form
   (use test data; Stripe shows you what to type).
4. Back on Homestead, open the 🏪 seller dashboard → **+ Add listing** → add a photo, a name and a
   price → **Publish**.
5. Log in from a different browser or your phone. Your listing should be there too.

If anything looks wrong, take a screenshot and send it to Claude.

## 7. Go live

Once the preview works, merge the pull request on GitHub. Vercel deploys it to your real site
automatically.

**Later**, when real farms have joined, you can remove the sample listings. Run this in the SQL Editor:

```sql
delete from public.sellers where is_sample;
```
