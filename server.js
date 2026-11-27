// ¡DERRAPA! · Servidor: sirve las páginas y coordina la carrera con Socket.IO.
const express = require('express');
const http = require('http');
const os = require('os');
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const { Game, TRACK_INFO } = require('./game');

const app = express();
app.set('trust proxy', true);           // Render va detrás de un proxy HTTPS
const server = http.createServer(app);
const io = new Server(server);
const game = new Game();

app.use(express.static(require('path').join(__dirname, 'public')));
app.get('/health', (_req, res) => res.send('ok'));

// URL que deben abrir los móviles. En local cambiamos "localhost" por la IP de la wifi.
function joinUrl(req) {
  let host = req.get('host');
  if (/^(localhost|127\.0\.0\.1)(:|$)/.test(host)) {
    const ip = Object.values(os.networkInterfaces()).flat()
      .find(i => i && i.family === 'IPv4' && !i.internal);
    if (ip) host = host.replace(/^[^:]+/, ip.address);
  }
  return `${req.protocol}://${host}/play.html`;
}
app.get('/join', (req, res) => res.json({ url: joinUrl(req) }));
app.get('/qr.svg', async (req, res) => {
  const svg = await QRCode.toString(joinUrl(req), { type: 'svg', margin: 1, color: { dark: '#111', light: '#fff' } });
  res.type('image/svg+xml').send(svg);
});

io.on('connection', (socket) => {
  // Pantalla grande (proyector)
  socket.on('host', () => { socket.join('hosts'); socket.emit('track', TRACK_INFO); });
  socket.on('start', () => game.start());
  socket.on('reset', () => game.reset());
  socket.on('addBot', () => { if (game.players.size < 12) game.addBot(); });
  socket.on('removeBots', () => game.removeBots());

  // Mando (móvil)
  socket.on('join', (name) => {
    if (game.players.has(socket.id)) return;
    if (game.players.size >= 12) return socket.emit('full');
    const p = game.addPlayer(socket.id, name);
    socket.emit('joined', { color: p.color, name: p.name });
  });
  socket.on('input', (input) => game.setInput(socket.id, input || {}));
  socket.on('disconnect', () => game.removePlayer(socket.id));
});

// Física a 60 Hz, estado a 30 Hz
const DT = 1 / 60;
let tick = 0;
setInterval(() => {
  game.step(DT);
  if (++tick % 2) return;
  const snap = game.snapshot();
  io.to('hosts').emit('state', snap);
  // A cada móvil solo lo suyo
  snap.players.forEach((p, i) => {
    const me = game.players.get(p.id);
    if (!me || me.bot) return;
    io.to(p.id).emit('me', {
      state: snap.state, countdown: snap.countdown, pos: i + 1, total: snap.players.length,
      lap: p.lap, laps: snap.laps, finished: p.finished, time: p.time,
      item: me.item, count: me.itemCount, rolling: me.rollLeft > 0,
      hits: me.hits, drift: p.drift, boost: p.boost, shield: p.shield,
    });
  });
}, DT * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🏁 ¡DERRAPA! en http://localhost:${PORT}`));
