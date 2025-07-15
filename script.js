

/* Variables globales*/
var tableroDiv = document.getElementById('tablero');
var mensaje = document.getElementById('mensaje');
var nivelText = document.getElementById('nivel');
var tiempoText = document.getElementById('tiempo');
var jugadorNombreText = document.getElementById('jugadorNombre');

var formJugador = document.getElementById('formJugador');
var nombreJugadorInput = document.getElementById('nombreJugador');
var respuestaServidor = document.getElementById('respuestaServidor');

var filas, columnas, minas, nivel;
var tablero = [];
var perdido = false;
var tiempo = 0;
var intervaloTiempo;
var timeoutInactividad;
var jugadorNombre = '---';


formJugador.addEventListener('submit', function(e) {
    e.preventDefault();
    var nombre = nombreJugadorInput.value.trim();
    if (nombre.length > 0) {
        localStorage.setItem('jugadorNombre', nombre);
        jugadorNombre = nombre;
        jugadorNombreText.textContent = "Jugador: " + jugadorNombre;
        respuestaServidor.textContent = "Nombre guardado correctamente.";
        nombreJugadorInput.value = "";
    } else {
        alert("Por favor ingresa un nombre válido.");
    }
});


document.getElementById('nuevo').addEventListener('click', iniciarJuego);
document.getElementById('btnAyuda').addEventListener('click', function () {
    document.getElementById('ayudaModal').style.display = 'block';
});
document.querySelector('.cerrar').addEventListener('click', function () {
    document.getElementById('ayudaModal').style.display = 'none';
});


function iniciarJuego() {
    var dificultad = document.getElementById('dificultad').value;
    localStorage.setItem('nivelSeleccionado', dificultad);

    switch (dificultad) {
        case 'facil': filas = columnas = 8; minas = 10; nivel = 1; break;
        case 'medio': filas = columnas = 12; minas = 20; nivel = 2; break;
        case 'dificil': filas = columnas = 16; minas = 40; nivel = 3; break;
        default: filas = columnas = 8; minas = 10; nivel = 1; break;
    }

    tablero = [];
    perdido = false;
    mensaje.textContent = '';
    nivelText.textContent = "Nivel: " + nivel;
    tiempo = 0;
    tiempoText.textContent = "Tiempo: 0s";

    clearInterval(intervaloTiempo);
    clearTimeout(timeoutInactividad);

    tableroDiv.innerHTML = '';
    tableroDiv.style.gridTemplateColumns = 'repeat(' + columnas + ', 35px)';

    
    for (var i = 0; i < filas; i++) {
        tablero[i] = [];
        for (var j = 0; j < columnas; j++) {
            var celda = document.createElement('div');
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

// Colocar minas aleatoriamente
function colocarMinas() {
    let minasColocadas = 0;
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


function revelarCelda(e) {
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
        // Revelar recursivamente vecinos sin minas
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
}

function iniciarTemporizador() {
    intervaloTiempo = setInterval(function () {
        tiempo++;
        tiempoText.textContent = "Tiempo: " + tiempo + "s";
    }, 1000);
}


function iniciarInactividad() {
    timeoutInactividad = setTimeout(function () {
        if (!perdido) {
            terminarJuego('😴 Perdiste por inactividad (40s sin jugar).');
        }
    }, 40000);
}

function reiniciarInactividad() {
    clearTimeout(timeoutInactividad);
    iniciarInactividad();
}

window.onload = function () {
    var nombreGuardado = localStorage.getItem('jugadorNombre');
    if (nombreGuardado) {
        jugadorNombre = nombreGuardado;
        jugadorNombreText.textContent = "Jugador: " + jugadorNombre;
    }

    var dificultadGuardada = localStorage.getItem('nivelSeleccionado');
    if (dificultadGuardada) {
        document.getElementById('dificultad').value = dificultadGuardada;
    }

    iniciarJuego();
};
