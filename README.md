# Third Quote Exteriors CRM

A full-featured CRM built for Third Quote Exteriors — free to host forever on GitHub Pages.

## Features
- Pipeline board (drag & drop)
- Contact management with full profiles
- Estimate tracking with revenue dashboard
- Tasks & follow-up reminders
- Activity log (calls, emails, SMS, notes, visits)
- Gmail integration (send emails directly from CRM)
- Import/Export to Excel & CSV
- Full backup & restore
- Mobile friendly

## Setup (15 minutes)

### Step 1 — Get the files on GitHub

1. Go to [github.com](https://github.com) and create a free account (or log in)
2. Click **New repository**
3. Name it `tq-crm` (or anything you want)
4. Set it to **Public**
5. Click **Create repository**
6. Click **uploading an existing file**
7. Drag and drop ALL the files from this folder (index.html, css/, js/)
8. Click **Commit changes**

### Step 2 — Enable GitHub Pages

1. In your repository, go to **Settings → Pages**
2. Under Source, select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Click **Save**
5. Wait ~2 minutes, then your CRM is live at:
   `https://yourusername.github.io/tq-crm/`

Bookmark that URL — that's your CRM forever.

### Step 3 — Connect Gmail (optional, for in-app email)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named "Third Quote CRM"
3. Go to **APIs & Services → Library** → enable **Gmail API**
4. Go to **APIs & Services → OAuth consent screen** → External → fill in app name
5. Go to **APIs & Services → Credentials → Create → OAuth Client ID**
6. Application type: **Web application**
7. Authorized JavaScript origins: `https://yourusername.github.io`
8. Authorized redirect URIs: `https://yourusername.github.io/tq-crm/`
9. Copy the Client ID
10. In your CRM, go to **Import/Export → Configure Gmail OAuth** and paste it
11. Click **Connect Gmail** in the sidebar

### Share with your brother

Just send him the GitHub Pages URL. He opens it in his browser, same app.

> **Note:** Data saves to each person's browser locally. Use **Export → Full backup** 
> regularly and share the JSON file to keep both devices in sync. For real-time 
> shared data, the next upgrade is connecting a Google Sheet as the database.

## Data & Privacy

- All data is stored in your browser's localStorage
- Nothing is sent to any server except when you send Gmail emails (which go through Google's API directly)
- Export your data anytime from Import/Export page
