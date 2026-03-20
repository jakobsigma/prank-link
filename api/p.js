function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

function getYtId(url) {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = String(url || '').match(p);
    if (m) return m[1];
  }
  return null;
}

function fromBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export default function handler(req, res) {
  const DEFAULTS = {
    title: "You've been selected!",
    desc: 'Click to claim your exclusive reward.',
    img: '',
    site: 'discord.com',
    video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  };

  let data = { ...DEFAULTS };
  try {
    if (req.query.d) {
      data = { ...DEFAULTS, ...JSON.parse(fromBase64Url(req.query.d)) };
    }
  } catch (e) {
    // use defaults
  }

  const ytId = getYtId(data.video);
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  // For non-YouTube URLs, we'll redirect
  const redirectUrl = !ytId ? esc(data.video) : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(data.title)}</title>

  <!-- Open Graph — what Discord / iMessage / Slack reads -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(data.site)}" />
  <meta property="og:title" content="${esc(data.title)}" />
  <meta property="og:description" content="${esc(data.desc)}" />
  ${data.img ? `<meta property="og:image" content="${esc(data.img)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ''}

  <!-- Twitter / X card -->
  <meta name="twitter:card" content="${data.img ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${esc(data.title)}" />
  <meta name="twitter:description" content="${esc(data.desc)}" />
  ${data.img ? `<meta name="twitter:image" content="${esc(data.img)}" />` : ''}

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #000;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      cursor: pointer;
      overflow: hidden;
      user-select: none;
    }

    /* Blurred background image */
    .bg {
      position: fixed;
      inset: -20px;
      background: ${data.img
        ? `url('${esc(data.img)}') center/cover no-repeat`
        : 'linear-gradient(135deg, #07071a 0%, #150a30 50%, #0f0f1a 100%)'};
      filter: blur(18px) brightness(0.35) saturate(1.2);
      transform: scale(1.05);
      transition: filter 0.4s;
    }

    /* Dark vignette */
    .vignette {
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);
      pointer-events: none;
    }

    /* Animated background orbs */
    .orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0;
      animation: orbPulse 6s ease-in-out infinite alternate;
      pointer-events: none;
    }
    .orb-1 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(124,58,237,0.6), transparent);
      top: -100px; left: -100px;
    }
    .orb-2 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(6,182,212,0.4), transparent);
      bottom: -80px; right: -80px;
      animation-delay: -3s;
    }
    @keyframes orbPulse {
      from { opacity: 0.3; }
      to { opacity: 0.7; }
    }

    /* Center content */
    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 30px 24px;
      animation: fadeUp 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Play button */
    .play-ring {
      width: 90px; height: 90px;
      border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,0.5);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 26px;
      position: relative;
      transition: transform 0.2s, border-color 0.2s;
    }
    .play-ring::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.12);
    }
    body:hover .play-ring {
      transform: scale(1.08);
      border-color: rgba(255,255,255,0.85);
    }
    .play-icon {
      width: 0; height: 0;
      border-style: solid;
      border-width: 16px 0 16px 28px;
      border-color: transparent transparent transparent #fff;
      margin-left: 5px;
    }

    h1 {
      font-size: clamp(1.1rem, 3.5vw, 1.8rem);
      font-weight: 800;
      color: #fff;
      margin-bottom: 10px;
      text-shadow: 0 2px 20px rgba(0,0,0,0.9);
      line-height: 1.25;
      max-width: 500px;
      margin-left: auto; margin-right: auto;
    }
    p {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.6);
      text-shadow: 0 1px 8px rgba(0,0,0,0.9);
      max-width: 400px;
      margin: 0 auto;
      line-height: 1.55;
    }
    .click-hint {
      margin-top: 24px;
      font-size: 0.72rem;
      color: rgba(255,255,255,0.3);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      animation: blink 2.5s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    /* Video fullscreen overlay */
    #video-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    #video-overlay.show { display: flex; }
    #video-overlay iframe {
      width: 100%; height: 100%;
      border: none;
    }

    /* Close button */
    #close-btn {
      position: fixed;
      top: 16px; right: 16px;
      z-index: 1100;
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(0,0,0,0.5);
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
      backdrop-filter: blur(6px);
    }
    #close-btn.show { display: flex; }
    #close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  </style>
</head>
<body onclick="play()">
  <div class="bg"></div>
  <div class="vignette"></div>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>

  <div class="content">
    <div class="play-ring">
      <div class="play-icon"></div>
    </div>
    <h1>${esc(data.title)}</h1>
    <p>${esc(data.desc)}</p>
    <div class="click-hint">Click anywhere to continue</div>
  </div>

  <div id="video-overlay">
    ${ytId ? `<iframe id="yt-frame" allowfullscreen allow="autoplay; fullscreen" frameborder="0"></iframe>` : ''}
  </div>
  <button id="close-btn" onclick="closeVid(event)">✕</button>

  <script>
    var played = false;
    function play() {
      if (played) return;
      played = true;
      ${ytId ? `
      var overlay = document.getElementById('video-overlay');
      overlay.classList.add('show');
      document.getElementById('close-btn').classList.add('show');
      document.getElementById('yt-frame').src = '${embedSrc}';
      if (overlay.requestFullscreen) overlay.requestFullscreen();
      else if (overlay.webkitRequestFullscreen) overlay.webkitRequestFullscreen();
      ` : `
      window.location.href = '${redirectUrl}';
      `}
    }
    function closeVid(e) {
      e.stopPropagation();
      played = false;
      document.getElementById('video-overlay').classList.remove('show');
      document.getElementById('close-btn').classList.remove('show');
      ${ytId ? `document.getElementById('yt-frame').src = '';` : ''}
      if (document.exitFullscreen) document.exitFullscreen();
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=0, no-cache, no-store');
  res.send(html);
}
