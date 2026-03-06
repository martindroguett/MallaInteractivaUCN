import { Asignatura } from "../js/asignatura.js";

let minSemestre = 1;
let indexSemestre = 0;
let datosSimulados = [];

function procesarJSON(json) {
    const ramos = [];
    const map = {};
    
    for (const [sem, ramosSemestre] of Object.entries(json)) {
        ramosSemestre.forEach(ramoData => { 
            const [id, nombre, creditos, prerrequisitos] = ramoData;
            const asignatura = new Asignatura(id, nombre, creditos, prerrequisitos);
            asignatura.semestre = parseInt(sem.replace("s", ""));
            ramos.push(asignatura);

            map[id] = asignatura;


            prerrequisitos.forEach(idRequisito => { 
                map[idRequisito].desbloquea.push(id);
            });

        });
    }
    return { listaRamos: ramos, mapaRamos: map };
}

function cargarColoresFacultades(listaRamos,json){
    for(const ramo of listaRamos){
        const siglaFacu = ramo.id.split("-")[0];
        if(json[siglaFacu]){
            ramo.color=json[siglaFacu][0];
            ramo.facultad=json[siglaFacu][1];
        }
    }
}

function romano(n) {
    switch (n) {
        case 1: return 'I';
        case 2: return 'II';
        case 3: return 'III';
        case 4: return 'IV';
        case 5: return 'V';
        case 6: return 'VI';
        case 7: return 'VII';
        case 8: return 'VIII';
        case 9: return 'IX';
        case 10: return 'X';
        case 11: return 'XI';
        default: return "";
    }

}

function dibujarMalla(idElemento,datosAgrupados) { //Añade los elementos al grid de la malla
    const contenedor = document.getElementById(idElemento);
    contenedor.innerHTML = ''; //Limpia CSS

    const totalSemestres = datosAgrupados.length;

    datosAgrupados.forEach((ramosSemestre, index) => {
        
        const columna = document.createElement('div');
        columna.className = 'semestre-column'; //Columnas
        columna.style.width = `${100 / totalSemestres}%`; //Ajusta el tamaño de la columna según la cantidad de ramos

        const titulo = document.createElement('div');
        titulo.className = 'semestre-title';
        titulo.textContent = romano(index + 1);
        columna.appendChild(titulo); //Título



        ramosSemestre.forEach(ramo => {
            const cuadro = document.createElement('div');
            cuadro.style.backgroundColor=ramo.color; //se establece su color
            cuadro.className = 'ramo';
            cuadro.textContent = ramo.nombre;
            if (index+1 == totalSemestres) {
                cuadro.style.minHeight = '610px'; 
            }


            if (ramo.disponible && minSemestre + 2 >= ramo.semestre) {
                cuadro.classList.toggle('disponible');
            }

            cuadro.dataset.id = ramo.id; //Para detectar que ramo se selecciona

            columna.appendChild(cuadro);
        }); //Ramos

        contenedor.appendChild(columna); //Lo agrega todo al grid
    });
}

function dibujarSemestre(contenedor,semestre,numeroSemestre){
        const columna = document.createElement('div');
        columna.className = 'semestre-column'; //Columnas
        columna.style.width = `${30}%`; //Ajusta el tamaño de la columna según la cantidad de ramos

        const titulo = document.createElement('div');
        titulo.className = 'semestre-title';
        titulo.textContent = romano(numeroSemestre);
        columna.appendChild(titulo); //Título

        semestre.forEach(ramo => {
            const cuadro = document.createElement('div');
            cuadro.style.backgroundColor=ramo.color; //se establece su color
            cuadro.className = 'ramo';
            cuadro.textContent = ramo.nombre;

            cuadro.classList.toggle('disponible');
            columna.appendChild(cuadro);
        }); //Ramos

        contenedor.appendChild(columna); //Lo agrega todo al grid
}

function dibujarLeyenda(jsColor){
    const leyenda = document.getElementById('leyenda');
    leyenda.innerHTML='';
    
    for(const[sigla,datos] of Object.entries(jsColor)){
        const col = datos[0];
        const facu = datos[1];
        const item = document.createElement('div');
        item.className = 'leyenda-item';
        item.innerHTML = `
            <span class="punto-color" style="background-color: ${col}"></span>
            <span class="nombre-facultad"><strong>${sigla}:</strong> ${facu}</span>
        `;
        leyenda.append(item);
    }

}

function agruparPorSemestres(lista) { //Obtiene el semestre y crea una lista por cada uno, donde se agregan los ramos
    const mallasPorSemestre = [];
    lista.forEach(ramo => {
        const indice = ramo.semestre - 1; 
        if (!mallasPorSemestre[indice]) {
            mallasPorSemestre[indice] = [];
        }
        mallasPorSemestre[indice].push(ramo);
    });
    return mallasPorSemestre;
}

function calcularPeso(ramo, map) {
    let max = 0;
    for(let requisito of ramo.desbloquea) {
        let aux = calcularPeso(map[requisito], map);
        if (aux > max) {
            max = aux;
        }
    }
    return 1 + max;
}

function mallaLoAntesPosible(maxCreditos, listaRamos, mapaRamos){ 
    let porAprobar = [];
    let map = {};

    for (const ramo of listaRamos) {
        map[ramo.id] = [ramo.aprobado, calcularPeso(ramo, mapaRamos), ramo];

        if (!ramo.aprobado && ramo.id !== "ECIN-01000" && ramo.id !== "ECIN-08606") { //Evita capstone y practica
            porAprobar.push(ramo);
        }
    }

    let simulado = [];

    while (porAprobar.length > 0) {
        let creditosSem = maxCreditos;
        let semestre = [];

        const minTemp = Math.min(...porAprobar.map(r => r.semestre));
        const maxTemp = minTemp + 2;

        let disponibles = porAprobar.filter(r => r.semestre <= maxTemp); //Falta filtrar por prerrequisitos

        disponibles = disponibles.filter(r => {
            if (r.prerrequisitos.length === 0) return true;

            const dispo = r.prerrequisitos.every(id => {
                return map[id][0];
            });
            return dispo;
        }); //Filtro de prerequisitos

        disponibles.sort((a, b) => {

            if (a.semestre != b.semestre) return a.semestre - b.semestre; //Prioriza semestre

            return map[b.id][1] - map[a.id][1]; //Prioriza peso

        });

        for (const ramo of disponibles) {
            if (creditosSem >= ramo.creditos) {
                semestre.push(ramo);
                creditosSem -= ramo.creditos;
            }
        }

        simulado.push(semestre);

        semestre.forEach(r => { map[r.id][0] = true });

        const ids = new Set(semestre.map(r => r.id));

        porAprobar = porAprobar.filter(r => !ids.has(r.id));
    }

    return simulado;
}

function actualizarDOM(map) {
    const ramos = Object.values(map);

    const pendientes = ramos.filter(r => !r.aprobado);

    minSemestre = Math.min(...pendientes.map(r => r.semestre)); //Se determina el semestre mínimo no aprobado
    console.log(`Mínimo semestre no aprobado: ${minSemestre}`);

    const maxSemestre = minSemestre + 2;

    ramos.forEach(ramo => {
        
        if (!ramo.aprobado) {
            
            const prereqsOk = ramo.prerrequisitos.every(reqId => map[reqId].aprobado);
            
            const ventanaOk = ramo.semestre <= maxSemestre;

            const estaDisponible = prereqsOk && ventanaOk;

            ramo.disponible = estaDisponible;

            const tarjeta = document.querySelector(`.ramo[data-id='${ramo.id}']`);
            if (tarjeta) {
                tarjeta.classList.toggle('disponible', estaDisponible);
            }
        }
    });
}

function clickRamo(e, map) {
    const ramo = e.target.closest('.ramo');
    if (!ramo) return;

    const id = ramo.dataset.id;
    const ramoObj = map[id];

    if (ramoObj.disponible || ramoObj.aprobado) {
        ramoObj.aprobado = !ramoObj.aprobado;   
        ramo.classList.toggle('aprobado', ramoObj.aprobado);
        console.log(`Estado de ${ramoObj.nombre}: Aprobado = ${ramoObj.aprobado}`);
        
        actualizarDOM(map);
    } 
}

function mostrarPopup(event, map) {
    const tarjeta = event.target.closest('.ramo');
    if (!tarjeta) return;

    const id = tarjeta.dataset.id;
    const ramoObj = map[id];
    const ventana = document.getElementById("ramo-popup");

    document.getElementById('nombreramo').textContent = ramoObj.nombre;
    document.getElementById('info-id').textContent = ramoObj.id;
    document.getElementById('info-sct').textContent = ramoObj.creditos;
    
    const fuerza = calcularPeso(ramoObj, map);
    document.getElementById('info-fuerza').textContent = fuerza;

    const listaPre = document.getElementById('info-pre');
    listaPre.innerHTML = ''; // Limpiar anterior

    if (ramoObj.prerrequisitos.length === 0) {
        listaPre.textContent = 'Ninguno';

    } else {
        ramoObj.prerrequisitos.forEach(reqId => {
            const li = document.createElement('li');
            li.textContent = map[reqId] ? map[reqId].nombre : reqId;
            listaPre.appendChild(li);
        });
    }

    ventana.classList.remove('oculto');
}

function ocultarPopup() {
    const ventana = document.getElementById("ramo-popup");
    ventana.classList.add('oculto');
}
function activarBotonesSimulacion(){
    const prev = document.getElementById("prev-semestre");
    const sig = document.getElementById("sig-semestre");
    const contenedor = document.getElementById("malla-simulador-container");

    console.log(indexSemestre);
    prev.addEventListener('click', ()=> {
        if(indexSemestre>0) {
            contenedor.innerHTML='';
            dibujarSemestre(contenedor,datosSimulados[--indexSemestre],indexSemestre+1)
            console.log(indexSemestre);
        }
    }
    );
    sig.addEventListener('click', () => {
        if(indexSemestre<10) {
            contenedor.innerHTML='';
            dibujarSemestre(contenedor,datosSimulados[++indexSemestre],indexSemestre+1);
            console.log(indexSemestre);
        }
    }
    );

}
function mostrarSimulacion(listaRamos, mapaRamos){
    //se genera malla simulada
    datosSimulados = mallaLoAntesPosible(30,listaRamos,mapaRamos);
    //se muestra overlay y dibuja malla
    const over = document.getElementById("overlay-simulador");
    over.classList.remove("oculto");
    dibujarSemestre(document.getElementById("malla-simulador-container"),datosSimulados[0],1);
}
function cerrarSimulacion(){
    document.getElementById("overlay-simulador").classList.add("oculto");
        document.getElementById("malla-simulador-container").innerHTML='';
        indexSemestre = 0;
}
function activarEventos(listaRamos,mapaRamos) {
    const contenedor = document.getElementById('malla-container');

    //interacción con ramos
    contenedor.addEventListener('click', (e) => clickRamo(e, mapaRamos));

    //interacción con popup-ramo
    contenedor.addEventListener('mouseover', (e) => mostrarPopup(e, mapaRamos));
    contenedor.addEventListener('mouseout', (e) => ocultarPopup(e));

    //apertura de simulación
    const botonSimulador = document.getElementById('simulador'); 
    activarBotonesSimulacion();
    botonSimulador.addEventListener('click', (e) => mostrarSimulacion(listaRamos, mapaRamos));

    //cierre de simulación
    const botonBackSimulador = document.getElementById("cerrar-simulacion");
    botonBackSimulador.addEventListener('click', (e) => cerrarSimulacion());
}

async function iniciarApp() {
    try {

        const [malla,colores] = await Promise.all([fetch('../data/data_ICCI.json'),
            fetch("../data/colores_INGC.json")]); 
        if (!malla.ok || !colores.ok) {
            throw new Error("No se pudo encontrar el archivo JSON");
        }

        const jsMalla = await malla.json();
        const jsColor = await colores.json();

        const {listaRamos, mapaRamos} = procesarJSON(jsMalla);
        cargarColoresFacultades(listaRamos,jsColor);
        dibujarLeyenda(jsColor);

        activarEventos(listaRamos,mapaRamos);

        const datosAgrupados = agruparPorSemestres(listaRamos);

        dibujarMalla('malla-container',datosAgrupados);

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2 style="color:red">Error: ${error.message}</h2>`;
    }
}

iniciarApp();