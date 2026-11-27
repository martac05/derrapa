# 🏁 ¡DERRAPA!

Carreras de karts multijugador en tiempo real: el **proyector** muestra el circuito y cada **móvil** es un volante (giroscopio) con botón de **derrape** y de **objeto**.

- Pantalla (proyector): `https://TU-APP.onrender.com/`
- Mando (móvil): escanea el QR de la pantalla, o abre `https://TU-APP.onrender.com/play.html`

## Cómo se juega

- El kart acelera solo. **Inclina el móvil** para girar (o usa ◀ ▶).
- **DERRAPE** (mantener): giras más cerrado y cargas un mini-turbo. Las chispas pasan de blanco → azul → naranja; suéltalo para salir disparado.
- Pasa por las **cajas ?** para conseguir un objeto y toca el botón de la derecha para usarlo:

| Objeto | Efecto |
|---|---|
| ⚡ Nitro (a veces x3) | Acelerón de 1,2 s |
| 🛢️ Aceite | Deja una mancha detrás; quien la pisa trompea |
| 🚀 Misil | Persigue al kart que va justo delante |
| 🛡️ Escudo | Te protege de un golpe durante 8 s |

Quien va último recibe mejores objetos (más nitros y misiles); quien va primero, más aceite y escudos.
3 vueltas. La carrera termina cuando todos llegan o 20 s después del ganador.

## Arquitectura

```
 Móviles (play.html)                     Servidor Node.js (Render)                Proyector (index.html)
 giroscopio + derrape + objeto  --20/s-->  Socket.IO → game.js (física 60 Hz)  --estado 30/s-->  canvas
                                <--posición, vuelta, objeto--
```

- **Frontend**: HTML + CSS + JS puro con Canvas. El móvil solo envía `{steer, drift, item}`.
- **Backend**: Node.js + Express + Socket.IO. El servidor es la "autoridad": calcula física, derrapes, objetos, choques y vueltas, así nadie hace trampas y todos ven lo mismo.
- **Despliegue**: Render (plan gratuito con WebSockets y HTTPS; el HTTPS es necesario para que el móvil deje leer el giroscopio).

| Archivo | Qué hace |
|---|---|
| `game.js` | Circuito (curva Catmull-Rom), física con derrape, objetos, bots, vueltas y ranking |
| `server.js` | Sirve las páginas y el QR, recibe los mandos y emite el estado |
| `public/index.html` | Pantalla del proyector |
| `public/play.html` | Mando del móvil |

## Ejecutar en local

```bash
npm install
npm start
```
Abre `http://localhost:3000` en el ordenador. El QR apunta a la IP de tu wifi, así que los móviles conectados a la misma red pueden entrar.
En local (sin HTTPS) el giroscopio no funciona en iPhone: usad los botones ◀ ▶. Con los botones **+ Bot** puedes probar sin móviles.

## Desplegar en Render

1. Sube el proyecto a un repositorio de GitHub.
2. En render.com: **New → Web Service** → conecta el repositorio.
3. Build command: `npm install` · Start command: `npm start` · Plan: **Free**.
4. Abre la URL que te dan. ⚠️ En el plan gratuito se duerme: **ábrela 5 minutos antes de presentar**.

## Cosas fáciles de cambiar

- Circuito: lista `CTRL` en `game.js` (puntos por los que pasa la pista).
- Vueltas, velocidades, agarre del derrape: constantes al principio de `game.js`.
- Si el volante gira al revés en algún móvil: `INVERT = -1` en `play.html`.
