# Line

A minimal, fixed two-person DM app. Text, image, and video messages, no password —
sign-in is just a recognized username. Built for exactly one conversation between
two people (e.g. you and one employee), not a general chat platform.

## How the deletion/logging works — read this before you deploy it

This app **discloses** its logging instead of hiding it:

- Either person can **delete a message for themselves** (removes it from their own view only — normal, expected behavior, same as any messenger).
- The **sender** of a message can **delete it for everyone** — both people then see "Message deleted" in the chat.
- Regardless of either action, the original message is retained in server storage, and the account marked as **admin** during setup can open **Activity log** to see the full, unedited history — including anything deleted from the chat view.
- Every person who signs in sees a permanent banner in the chat stating this plainly: *"This conversation is logged for business records."* There is no hidden or silent version of this — the disclosure banner isn't optional and isn't hidden behind a settings toggle.

If you're deploying this for workplace use, tell the other person this before they use it (the in-app banner does this, but say it out loud too). Depending on your jurisdiction, employee-monitoring tools carry legal disclosure requirements — this is not legal advice, just a heads-up to check local rules before relying on the log for anything formal (e.g. disciplinary action).

## Working offline

Line is a Progressive Web App: once either person has opened it while online, the
app shell (the interface itself) is cached on the device, so it still opens with
zero connection. From there:

- **Composing offline** — write a message, attach a photo/video, hit send. If there's
  no connection, it's saved on that device (via IndexedDB) instead of failing, and shows
  as "Queued — sends when back online" in the chat.
- **Auto-sync** — the moment the device regains a connection (WiFi, mobile data,
  whatever), queued messages send automatically in the order they were written. No need
  to reopen the app or retry manually.
- **Reading offline** — the last-loaded conversation is cached locally too, so you can
  scroll back through recent messages with no connection at all.

**On Bluetooth**, one honest note: true phone-to-phone Bluetooth chat isn't something
a web app can reliably do. Browsers can only use Bluetooth to talk to *accessories*
(headphones, fitness trackers, etc.) via Web Bluetooth — they can't turn a phone into
a two-way chat peer, and iOS Safari doesn't support Web Bluetooth at all. Building
that would mean a native Android/iOS app instead of a website. I didn't want to bolt
on something that looks like it works and then silently fails.

If the goal is messaging with **no internet uplink at all** (not even mobile data),
the practical option is: host Line on a laptop, mini PC, or router on your local
network. Both phones connect to that same WiFi — the app works exactly the same,
with zero internet required, because the "server" is right there on the LAN.

## Setup

```bash
npm install
npm start
```

Then open `http://localhost:3000`. The first time it loads, it'll ask you to create
the channel: your username (this becomes the admin account with log access) and the
other person's username. That pair is fixed — there's no "add contact" or "switch
conversation" anywhere in the app.

To reset the pair or wipe all messages, stop the server and delete the `data/` folder.
Uploaded images/videos live in `uploads/` — delete that too for a full reset.

## Hosting it

This is a plain Node/Express app with **no native dependencies** (deliberately —
avoids the `better-sqlite3`-style native build issues you'd hit on Windows or on
some hosts). Data is stored as JSON files on disk in `data/` and `uploads/`, so:

- **Render / Railway / Fly.io / a VPS**: works out of the box with `npm install && npm start`. Make sure you attach a **persistent volume/disk** for `data/` and `uploads/` — without one, messages and uploads vanish on every redeploy/restart.
- **Vercel / Netlify (serverless)**: won't work as-is — these platforms don't offer persistent disk. You'd need to swap `store.js` for a real database (e.g. Postgres, or S3 for uploads) first.
- Set the `PORT` environment variable if your host requires a specific port; it defaults to 3000.

## Project structure

```
server.js         Express app, all API routes
store.js           JSON-file storage (config + messages)
public/
  index.html        Setup / login / chat screens
  admin.html         Activity log screen (admin only)
  css/style.css
  js/app.js           Chat client logic
  js/admin.js         Activity log client logic
data/               Created at runtime — config.json + messages.json
uploads/            Created at runtime — uploaded images/videos
```

## Notes

- No password, by design — the "auth" is simply matching a recognized username.
  Anyone who knows either username can sign in. If this matters for your use case,
  put the app behind your host's access controls (e.g. a shared login page, VPN,
  or basic auth at the reverse-proxy level).
- File uploads are capped at 50MB and restricted to image/video MIME types.
