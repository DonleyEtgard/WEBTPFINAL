var tableroDiv = document.getElementById('tablero');
var mensaje = document.getElementById('mensaje');
var nivelText = document.getElementById('nivel');
var tiempoText = document.getElementById('tiempo');
var jugadorNombreText = document.getElementById('jugadorNombre');

var formJugador = document.getElementById('formJugador');
var nombreJugadorInput = document.getElementById('nombreJugador');
var respuestaServidor = document.getElementById('respuestaServidor');

var btnEstadistica = document.getElementById('btnEstadistica');
var estadisticasDiv = document.getElementById('estadisticas');
var fechaActual = document.getElementById('fechaActual');
var jugadorRanking = document.getElementById('jugadorRanking');
var puntajeJugador = document.getElementById('puntajeJugador');
var duracionPartida = document.getElementById('duracionPartida');

var filas, columnas, minas, nivel;
var tablero = [];
var ranking = [];
var perdido = false;
var tiempo = 0;
var intervaloTiempo;
var timeoutInactividad;
var jugadorNombre = '---';

formJugador.addEventListener('submit', e => {
  e.preventDefault();
  const nombre = nombreJugadorInput.value.trim();
  if (nombre.length > 0) {
    jugadorNombre = nombre;
    jugadorNombreText.textContent = `Jugador: ${jugadorNombre}`;
    localStorage.setItem('jugadorNombre', jugadorNombre);

    var fecha = new Date().toLocaleString();
    var duracion = tiempo;
    var puntaje = nivel * 1000 - duracion * 10;
    var historial = JSON.parse(localStorage.getItem('historialPartidas')) || [];

    var nuevoRegistro = {
      jugador: jugadorNombre,
      fecha: fecha,
      duracion: duracion,
      puntaje: puntaje
    };

    historial.push(nuevoRegistro);
    localStorage.setItem('historialPartidas', JSON.stringify(historial));

    respuestaServidor.textContent = "Nombre y partida guardados correctamente.";
    nombreJugadorInput.value = "";
  } else {
    alert("Por favor ingresa un nombre válido.");
  }
});

btnEstadistica.addEventListener('click', () => {
  var historial = JSON.parse(localStorage.getItem('historialPartidas')) || [];

  if (historial.length === 0) {
    alert("No hay partidas guardadas aún.");
    return;
  }

  var ultimaPartida = historial[historial.length - 1];

  fechaActual.textContent = `Fecha: ${ultimaPartida.fecha}`;
  jugadorRanking.textContent = `Jugador: ${ultimaPartida.jugador}`;
  puntajeJugador.textContent = `Puntaje: ${ultimaPartida.puntaje}`;
  duracionPartida.textContent = `Duración: ${ultimaPartida.duracion} segundos`;

  estadisticasDiv.style.display = "block";
});

document.getElementById('btnAyuda').addEventListener('click', () => {
  document.getElementById('ayudaModal').style.display = 'block';
});
document.querySelector('.cerrar').addEventListener('click', () => {
  document.getElementById('ayudaModal').style.display = 'none';
});
window.addEventListener('click', e => {
  if (e.target.id === 'ayudaModal') {
    document.getElementById('ayudaModal').style.display = 'none';
  }
});

document.getElementById('nuevo').addEventListener('click', iniciarJuego);

function iniciarJuego() {
  var dificultad = document.getElementById('dificultad').value;
  localStorage.setItem('nivelSeleccionado', dificultad);

  switch (dificultad) {
    case 'facil': filas = columnas = 8; minas = 10; nivel = 1; break;
    case 'medio': filas = columnas = 12; minas = 25; nivel = 2; break;
    case 'dificil': filas = columnas = 16; minas = 40; nivel = 3; break;
    default: filas = columnas = 8; minas = 10; nivel = 1; break;
  }

  tablero = [];
  ranking = [];
  perdido = false;
  mensaje.textContent = '';
  nivelText.textContent = `Nivel: ${nivel}`;
  tiempo = 0;
  tiempoText.textContent = "Tiempo: 0s";

  clearInterval(intervaloTiempo);
  clearTimeout(timeoutInactividad);

  tableroDiv.innerHTML = '';
  tableroDiv.style.gridTemplateColumns = `repeat(${columnas}, 35px)`;

  // Crear celdas
  for (var i = 0; i < filas; i++) {
    tablero[i] = [];
    for (var j = 0; j < columnas; j++) {
      const celda = document.createElement('div');
      celda.classList.add('celda');
      celda.dataset.fila = i;
      celda.dataset.col = j;
      celda.addEventListener('click', revelarCelda);
      tableroDiv.appendChild(celda);
      tablero[i][j] = { mina: false, revelado: false, numero: 0, element: celda };
    }
  }

  colocarMinas();
  iniciarTemporizador();
  iniciarInactividad();
}

function colocarMinas() {
  var minasColocadas = 0;
  while (minasColocadas < minas) {
    var fila = Math.floor(Math.random() * filas);
    var col = Math.floor(Math.random() * columnas);
    if (!tablero[fila][col].mina) {
      tablero[fila][col].mina = true;
      minasColocadas++;
      actualizarNumeros(fila, col);
    }
  }
}

function actualizarNumeros(f, c) {
  for (var i = f - 1; i <= f + 1; i++) {
    for (var j = c - 1; j <= c + 1; j++) {
      if (
        i >= 0 && i < filas &&
        j >= 0 && j < columnas &&
        !(i === f && j === c)
      ) {
        tablero[i][j].numero++;
      }
    }
  }
}

function revelarCelda() {
  if (perdido) return;

  var fila = parseInt(this.dataset.fila);
  var col = parseInt(this.dataset.col);
  var celda = tablero[fila][col];

  if (celda.revelado) return;

  reiniciarInactividad();
  celda.revelado = true;
  celda.element.classList.add('revelada');

  if (celda.mina) {
    celda.element.classList.add('mina');
    celda.element.textContent = '💣';
    terminarJuego('💣 Perdiste. Tocaste una mina.');
    return;
  }

  if (celda.numero > 0) {
    celda.element.textContent = celda.numero;
    celda.element.dataset.numero = celda.numero; 
  } else {
    for (var i = fila - 1; i <= fila + 1; i++) {
      for (var j = col - 1; j <= col + 1; j++) {
        if (
          i >= 0 && i < filas &&
          j >= 0 && j < columnas &&
          !(i === fila && j === col)
        ) {
          var vecino = tablero[i][j];
          if (!vecino.revelado) {
            revelarCelda.call(vecino.element);
          }
        }
      }
    }
  }

  if (checkVictoria()) {
    terminarJuego('🎉 ¡Ganaste! Felicitaciones.');
  }
}

function checkVictoria() {
  for (var i = 0; i < filas; i++) {
    for (var j = 0; j < columnas; j++) {
      var celda = tablero[i][j];
      if (!celda.mina && !celda.revelado) return false;
    }
  }
  return true;
}

function terminarJuego(msg) {
  perdido = true;
  clearInterval(intervaloTiempo);
  clearTimeout(timeoutInactividad);
  mensaje.textContent = msg;

  for (var i = 0; i < filas; i++) {
    for (var j = 0; j < columnas; j++) {
      var celda = tablero[i][j];
      if (celda.mina) {
        celda.element.classList.add('mina');
        celda.element.textContent = '💣';
      }
    }
  }

  var gano = msg.includes('Ganaste');
  ranking.push({
    jugador: jugadorNombre,
    tiempo: tiempo,
    resultado: gano ? 'Ganó' : 'Perdió',
    fecha: new Date().toLocaleString()
  });
  if (ranking.length > 10) ranking.shift();
}

function iniciarTemporizador() {
  intervaloTiempo = setInterval(() => {
    tiempo++;
    tiempoText.textContent = `Tiempo: ${tiempo}s`;
  }, 1000);
}

function iniciarInactividad() {
  timeoutInactividad = setTimeout(() => {
    if (!perdido) {
      terminarJuego('😴 Perdiste por inactividad (40s sin jugar).');
    }
  }, 40000);
}

function reiniciarInactividad() {
  clearTimeout(timeoutInactividad);
  iniciarInactividad();
}

window.onload = () => {
  var nombreGuardado = localStorage.getItem('jugadorNombre');
  if (nombreGuardado) {
    jugadorNombre = nombreGuardado;
    jugadorNombreText.textContent = `Jugador: ${jugadorNombre}`;
  }

  const dificultadGuardada = localStorage.getItem('nivelSeleccionado');
  if (dificultadGuardada) {
    document.getElementById('dificultad').value = dificultadGuardada;
  }
  iniciarJuego();
};
