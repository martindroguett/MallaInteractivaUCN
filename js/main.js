import { Asignatura } from "../js/asignatura.js";

function procesarJSON(json) {
    const ramos = [];
    
    for (const [sem, ramosSemestre] of Object.entries(json)) {
        ramosSemestre.forEach(ramoData => { 
            const [id, nombre, creditos, prerrequisitos] = ramoData;
            const asignatura = new Asignatura(id, nombre, creditos, prerrequisitos);
            asignatura.semestre = parseInt(sem.replace("s", ""));
            ramos.push(asignatura);
        });
    }
    return ramos;
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
        default: return "";
    }

}

function dibujarMalla(datosAgrupados) { //Añade los elementos al grid de la malla
    const contenedor = document.getElementById('malla-container');
    contenedor.innerHTML = ''; //Limpia CSS

    const totalSemestres = datosAgrupados.length;
    contenedor.style.gridTemplateColumns = `repeat(${totalSemestres}, 1fr)`; //Varía según la cantidad de semestres

    datosAgrupados.forEach((ramosSemestre, index) => {
        
        const columna = document.createElement('div');
        columna.className = 'semestre-column'; //Columnas

        const titulo = document.createElement('div');
        titulo.className = 'semestre-title';
        titulo.textContent = romano(index + 1);
        columna.appendChild(titulo); //Título

        ramosSemestre.forEach(ramo => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'ramo';
            tarjeta.textContent = ramo.nombre;
            
            tarjeta.dataset.id = ramo.id; 

            columna.appendChild(tarjeta);
        }); //Ramos

        contenedor.appendChild(columna); //Lo agrega todo al grid
    });
}

function agruparPorSemestres(listaPlana) { //Obtiene el semestre y crea una lista por cada uno, donde se agregan los ramos
    const mallasPorSemestre = [];
    listaPlana.forEach(ramo => {
        const indice = ramo.semestre - 1; 
        if (!mallasPorSemestre[indice]) {
            mallasPorSemestre[indice] = [];
        }
        mallasPorSemestre[indice].push(ramo);
    });
    return mallasPorSemestre;
}

async function iniciarApp() {
    try {

        const response = await fetch('../data/data_ICCI.json'); 
        
        if (!response.ok) {
            throw new Error("No se pudo encontrar el archivo JSON");
        }

        const json = await response.json();

        const listaRamos = procesarJSON(json);

        const datosAgrupados = agruparPorSemestres(listaRamos);

        dibujarMalla(datosAgrupados);

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2 style="color:red">Error: ${error.message}</h2>`;
    }
}

iniciarApp();