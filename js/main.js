import { Asignatura } from "../js/asignatura.js";
let minSemestre = 1;
let indexSemestre = 0;
let datosSimulados = [];
let listaRamos = [];
let mapaRamos = [];
let nombreCodigos = [];

    /*
     * Para agregar una carrera:  
     * 1. crear archivo data_CARRERA.json, con la misma estructura. 
     * 2. agregar nombre y codigo de carrera en mallas.json, con la mista estructura.
     */

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

function cargarColoresFacultades(json){
    for(const ramo of listaRamos){
        const siglaFacu = ramo.id.split("-")[0];
        if(json[siglaFacu]){
            ramo.color=json[siglaFacu][0];
            ramo.facultad=json[siglaFacu][1];
        }
    }
}

function romano(num) {
    // Mapeo de valores decimales a romanos en orden descendente
    const map = {
        M: 1000, CM: 900, D: 500, CD: 400,
        C: 100, XC: 90, L: 50, XL: 40,
        X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    
    let result = '';
    
    for (let key in map) {
        // Mientras el número actual sea mayor o igual al valor arábigo
        while (num >= map[key]) {
            result += key; // Agrega el símbolo romano
            num -= map[key]; // Resta el valor correspondiente
        }
    }
    return result;

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
            cuadro.style.borderLeftColor = ramo.color; //se establece su color
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
            cuadro.style.borderLeft = ramo.color; //se establece su color
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

        if (!ramo.aprobado && ramo.id !== "ECIN-01000" && ramo.nombre !== "PRACTICA PRE-PROFESIONAL") { //Evita capstone y practica
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

            return map[b.id][1] - map[a.id][1]; //Prioriza fuerza

        });

        let aux = -1;
        let temp = 0;

        for (const ramo of disponibles) {
            if (ramo.semestre === aux) {
                temp += ramo.creditos;
            } else {
                temp = ramo.creditos;
            }

            if (maxCreditos === 30 && temp > 30) {
                creditosSem = temp;
            }

            aux = ramo.semestre;
        }


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

    simulado.push([mapaRamos["ECIN-01000"]])

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

    const mouseX = event.clientX;
    const anchoVentana = window.innerWidth;

    if (mouseX > window.innerWidth / 2) {
        ventana.style.left = 20 + "px";

    } else {
        ventana.style.left = (anchoVentana - ventana.offsetWidth - 20) + "px";
    }

}

function ocultarPopup() {
    const ventana = document.getElementById("ramo-popup");
    ventana.classList.add('oculto');
}
/*
function activarBotonesSimulacion(){
    const prev = document.getElementById("prev-semestre");
    const sig = document.getElementById("sig-semestre");
    const contenedor = document.getElementById("malla-simulador-container");

    prev.addEventListener('click', ()=> {
        if(indexSemestre>0) {
            contenedor.innerHTML='';
            dibujarSemestre(contenedor,datosSimulados[--indexSemestre],indexSemestre+1)
        }
    }
    );
    sig.addEventListener('click', () => {
        if(indexSemestre<10) {
            contenedor.innerHTML='';
            dibujarSemestre(contenedor,datosSimulados[++indexSemestre],indexSemestre+1);
        }
    }
    );

}
*/

function mostrarSimulacion(maxCreditos, listaRamos, mapaRamos){
    indexSemestre = 0;
    //se genera malla simulada
    datosSimulados = mallaLoAntesPosible(maxCreditos,listaRamos,mapaRamos);
    //se muestra overlay y dibuja malla
    const over = document.getElementById("overlay-simulador");
    over.classList.remove("oculto");
    dibujarSemestre(document.getElementById("malla-simulador-container"),datosSimulados[0],1);
}
function cerrarSimulacion(){
    datosSimulados = [];
    indexSemestre = 0;
    document.getElementById("overlay-simulador").classList.add("oculto");
    document.getElementById("malla-simulador-container").innerHTML = '';
}

function activarEventos() {
    const contenedor = document.getElementById('malla-container');

    //interacción con ramos
    contenedor.addEventListener('click', (e) => clickRamo(e, mapaRamos));

    //interacción con popup-ramo
    contenedor.addEventListener('mouseover', (e) => mostrarPopup(e, mapaRamos));
    contenedor.addEventListener('mouseout', (e) => ocultarPopup(e));

    const botonSimulador = document.getElementById('boton-simulador'); 
    const input = document.getElementById('input-creditos');
    const mensajeError = document.getElementById('mensaje-error');


    //volver al menu
    const botonRegresar = document.getElementById("regresar");
    botonRegresar.addEventListener('click', (e)=> cerrarMalla());

    //apertura de simulación
    botonSimulador.addEventListener('click', (e) => {
        let maxCreditos = parseInt(input.value);
        mensajeError.textContent = ""; 

        
        if (isNaN(maxCreditos)) {
            mensajeError.textContent = "Ingrese un número.";
            return;
        } 
        
        if (maxCreditos < 6) {
            mensajeError.textContent = "Mínimo 6 SCT.";
            return;
        } 
        
        if (maxCreditos > 30) {
            mensajeError.textContent = "Máximo 30 SCT.";
            return;
        }

        console.log(maxCreditos);

        mostrarSimulacion(maxCreditos, listaRamos, mapaRamos); 
        
        //activarBotonesSimulacion(); 
        const botonBackSimulador = document.getElementById("cerrar-simulacion");

        botonBackSimulador.addEventListener('click', cerrarSimulacion);
    });
    
    input.addEventListener('input', () => {
        mensajeError.textContent = ""; 
    });

    const prev = document.getElementById("prev-semestre");
    const sig = document.getElementById("sig-semestre");
    const contSimulador = document.getElementById("malla-simulador-container");

    prev.addEventListener('click', ()=> {
        if(indexSemestre>0) {
            contSimulador.innerHTML='';
            dibujarSemestre(contSimulador,datosSimulados[--indexSemestre],indexSemestre+1)
        }
    }
    );
    sig.addEventListener('click', () => {
        if(indexSemestre<datosSimulados.length - 1) {
            contSimulador.innerHTML='';
            dibujarSemestre(contSimulador,datosSimulados[++indexSemestre],indexSemestre+1);
        }
    }
    );

}
function cerrarMalla(){
    const espacio = document.getElementById("espacio-malla");
    espacio.classList.add("oculto");
    document.getElementById("menu-mallas").classList.remove("oculto");
}
/**setupBotonesMenu():
 * Recorre la lista de carreras y crea un botón para cada una de ellas.
 */
function setupBotonesMenu(){
    const menu = document.getElementById("botones-malla");
    nombreCodigos.forEach(carrera=>{
        const boton = document.createElement('button');
        boton.className = 'boton-menu';
        boton.textContent = carrera.codigo;
        boton.addEventListener("click" ,()=>{cargarMalla(carrera.nombre,carrera.codigo);});
        menu.appendChild(boton);
    });
}
/**cargarMallas()
 * Funcion asincrónica, debe llamarse con await, para asegurarse que
 * cargue el .json correctamente antes de seguir con el programa.
 * 
 * Carga la información de mallas.json
 * 
 * @returns vector de objetos-carrera: {nombre:,codigo:}
 */
async function cargarMallas() {
    try {
        //CARGA Y GUARDA DATOS DE mallas.json (nombres y codigos de cada carrera)
        const [codigoCarreras] = await Promise.all([fetch('../data/mallas.json')]);
        if(!codigoCarreras.ok){
            throw new Error("No se pudo encontrar el archivo JSON");
        }
        const jsCarrera = await codigoCarreras.json();
        return jsCarrera;

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2 style="color:red">Error: ${error.message}</h2>`;
    }
}
/**cargarMalla(id) 
 * @param {*} id : corresponde la índice que tiene la carrera seleccionada
 * dentro del vector de mallas.json.
 * 
 * Carga la data de la carrera seleccionada (nombre y codigo) desde el .json 
 * y construye la malla.
 */
async function cargarMalla(nombreCarrera,codigoCarrera) {
    try {
        //UBICA DATA DE LA CARRERA Y LA CARGA
        const [malla,colores] = await Promise.all([fetch('../data/data_'+codigoCarrera+'.json'),
            fetch("../data/colores_INGC.json")]); 
        if (!malla.ok || !colores.ok) {
            throw new Error("No se pudo encontrar el archivo JSON");
        }

        const jsMalla = await malla.json();
        const jsColor = await colores.json();

        
        const datos = procesarJSON(jsMalla);
        listaRamos = datos.listaRamos;
        mapaRamos = datos.mapaRamos;
        
        cargarColoresFacultades(jsColor);
        dibujarLeyenda(jsColor);

        const datosAgrupados = agruparPorSemestres(listaRamos);
        dibujarMalla('malla-container',datosAgrupados);

        document.getElementById("titulo-carrera").innerText = nombreCarrera;
        document.getElementById("espacio-malla").classList.remove("oculto");
        document.getElementById("menu-mallas").classList.add("oculto");
    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2 style="color:red">Error: ${error.message}</h2>`;
    }
}

/**iniciarApp():
 * inicia toda la aplicación.
 * 1. Espera cargar la lista de las carreras en la variable global 'nombresCodigos'
 * 2. Activa los eventos en el menu.
 * 3. Activa los eventos en el malla-container.
 * 
 * error: el procesamiento para cargar los datos de las carreras falló.
 */
async function iniciarApp(){
    try{
        nombreCodigos = await cargarMallas();
        console.log(nombreCodigos);
        setupBotonesMenu();
        activarEventos();
    } catch(error){
        throw new Error("ERROR AL INCIAR EL PROGRAMA",error);
    }
}

iniciarApp();