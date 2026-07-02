<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Activity log — Line</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css" />
</head>
<body>

<section class="view" id="view-admin">
  <header class="chat-header">
    <div class="brand">
      <span class="brand-mark"></span>
      <span class="brand-name">Line</span>
    </div>
    <div class="header-right">
      <a href="/" class="admin-link">Back to chat</a>
      <button id="logout-btn" class="btn-ghost">Sign out</button>
    </div>
  </header>

  <div class="record-banner admin-banner">
    <span class="record-dot"></span>
    Admin activity log — every message ever sent, including ones deleted from the chat view. This page and its
    existence are disclosed to both participants inside the chat.
  </div>

  <main id="log" class="log"></main>
</section>

<script src="/js/admin.js"></script>
</body>
</html>
