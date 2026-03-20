import { kv } from '@vercel/kv';

function randomId() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const prank = {
    title: String(body.title || '').slice(0, 150),
    desc:  String(body.desc  || '').slice(0, 300),
    img:   String(body.img   || '').slice(0, 1000),
    site:  String(body.site  || '').slice(0, 100),
    video: String(body.video || '').slice(0, 500),
  };

  const id = randomId();
  await kv.set(`p:${id}`, prank, { ex: 60 * 60 * 24 * 30 }); // expires in 30 days

  res.status(200).json({ id });
}
