# Paperthreads CRM

A self-contained static CRM for Paperthreads.

## Deploy to Vercel from GitHub

1. Create a new GitHub repository.
2. Upload the **contents of this folder** to the repository root. `index.html` and `vercel.json` must be visible at the top level—not inside another folder.
3. In Vercel, select **Add New → Project** and import the repository.
4. In project settings use:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: leave empty
   - Output Directory: leave empty
5. Deploy.

If the repository contains a parent folder and `paperthreads-crm` is nested inside it, set Vercel's **Root Directory** to `paperthreads-crm` instead.

Customer data is currently saved in each browser using localStorage. It is not shared between devices or users and is not stored in a cloud database.
