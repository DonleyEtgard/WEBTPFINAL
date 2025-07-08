var filas, columnas, minas, tablero, perdido = false, minasColocadas = 0;
var nivel = 1, tiempo = 0, intervaloTiempo, timeoutInactividad;

var tableroDiv = document.getElementById('tablero');
var mensaje = document.getElementById('mensaje');
var nivelText = document.getElementById('nivel');
var tiempoText = document.getElementById('tiempo');

document.getElementById('nuevo').addEventListener('click', iniciarJuego);
document.getElementById('btnAyuda').addEventListener('click', mostrarAyuda);
document.querySelector('.cerrar').addEventListener('click', function () {
    document.getElementById('ayudaModal').style.display = 'none';
});

function iniciarJuego() {
    /*Obtener dificultad*/
    var dificultad = document.getElementById('dificultad').value;
    switch (dificultad) {
        case 'facil': filas = columnas = 8; minas = 10; break;
        case 'medio': filas = columnas = 12; minas = 20; break;
        case 'dificil': filas = columnas = 16; minas = 40; break;
    }

    /*Reset*/
    tablero = [];
    perdido = false;
    mensaje.textContent = '';
    nivelText.textContent = "Nivel: " + nivel;
    tiempo = 0;
    tiempoText.textContent = "Tiempo: 0s";

    clearInterval(intervaloTiempo);
    clearTimeout(timeoutInactividad);

    /* Crear tablero */
    tableroDiv.innerHTML = '';
    tableroDiv.style.gridTemplateColumns = 'repeat(' + columnas + ', 30px)';

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

function colocarMinas() {
    minasColocadas = 0;
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
            if (i >= 0 && i < filas && j >= 0 && j < columnas && !(i === f && j === c)) {
                tablero[i][j].numero++;
            }
        }
    }
}

function revelarCelda(e) {
    var fila = parseInt(this.dataset.fila);
    var col = parseInt(this.dataset.col);
    var celda = tablero[fila][col];

    if (perdido || celda.revelado) return;

    reiniciarInactividad();
    celda.revelado = true;
    celda.element.classList.add('revelada');

    if (celda.mina) {
        celda.element.classList.add('mina');
        celda.element.textContent = '💣';
        terminarJuego('💣 Perdiste. Tocaste una mina.');
    } else if (celda.numero > 0) {
        celda.element.textContent = celda.numero;
    } else {
        for (var i = fila - 1; i <= fila + 1; i++) {
            for (var j = col - 1; j <= col + 1; j++) {
                if (i >= 0 && i < filas && j >= 0 && j < columnas) {
                    revelarCelda.call(tablero[i][j].element);
                }
            }
        }
    }
}

function terminarJuego(msg) {
    perdido = true;
    clearInterval(intervaloTiempo);
    clearTimeout(timeoutInactividad);
    mensaje.textContent = msg;

    // Mostrar todas las minas
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
            terminarJuego('😴Perdiste por inactividad (5s sin jugar).');
        }
    }, 5000);
}

function reiniciarInactividad() {
    clearTimeout(timeoutInactividad);
    iniciarInactividad();
}

function mostrarAyuda() {
    fetch('ayuda.txt')
        .then(function (res) { return res.text(); })
        .then(function (texto) {
            document.getElementById('textoAyuda').textContent = texto;
            document.getElementById('ayudaModal').style.display = 'block';
        });
}

// Iniciar automáticamente al cargar
iniciarJuego();