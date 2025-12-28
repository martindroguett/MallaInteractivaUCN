import { Asignatura } from "../js/asignatura.js";

let minSemestre = 1;

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
    return { listaRamos: ramos, map: map };
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
        default: return "";
    }

}

function dibujarMalla(datosAgrupados) { //Añade los elementos al grid de la malla
    const contenedor = document.getElementById('malla-container');
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

function activarEventos(map) {
    document.getElementById('malla-container').addEventListener('click', (event) => {
        const ramo = event.target.closest('.ramo');
        if (!ramo) return;

        const id = ramo.dataset.id;
        console.log(`Ramo seleccionado: ${id}`);

        const ramoObj = map[id];
        if(ramoObj.disponible){
            ramo.classList.add('aprobado');
            ramoObj.aprobado = !ramoObj.aprobado;   
            ramoObj.disponible = !ramoObj.disponible;
        } else if(ramoObj.aprobado){
            ramo.classList.remove('aprobado');
            ramoObj.aprobado = !ramoObj.aprobado;
            ramoObj.disponible = !ramoObj.disponible;
        }
        

        console.log(`Estado de ${ramoObj.nombre}: Aprobado = ${ramoObj.aprobado}`);

        minSemestre = Math.min(...Object.values(map).filter(r => !r.aprobado).map(r => r.semestre)); //Se determina el semestre mínimo no aprobado
        console.log(`Mínimo semestre no aprobado: ${minSemestre}`);

        Object.values(map).filter(r => r.prerrequisitos.length == 0 || r.prerrequisitos.every(prereqId => map[prereqId].aprobado)).forEach(r => { //Revisa los ramos que no tienen prerrequisitos o que todos sus prerrequisitos están aprobados
            if (!r.aprobado && minSemestre + 2 >= r.semestre) {
                r.disponible = true;
                const ramoLibre = document.querySelector(`.ramo[data-id='${r.id}']`);
                ramoLibre.classList.add('disponible');
            } else {
                r.disponible = false;
                const ramoLibre = document.querySelector(`.ramo[data-id='${r.id}']`);
                ramoLibre.classList.remove('disponible');
            }
        });

        if (ramoObj.aprobado) { //Si está aprobado revisa que desbloquea
            ramoObj.desbloquea.forEach(idDesbloqueado => {
                const ramoCandidatoObj = map[idDesbloqueado];
                if (!ramoCandidatoObj.aprobado && ramoCandidatoObj.prerrequisitos.every(prereqId => map[prereqId].aprobado) && minSemestre + 2 >= ramoCandidatoObj.semestre) {
                    ramoCandidatoObj.disponible = true;
                    const ramoCandidato = document.querySelector(`.ramo[data-id='${idDesbloqueado}']`);
                    ramoCandidato.classList.add('disponible');
                    console.log(`Ramo desbloqueado: ${ramoCandidatoObj.nombre}`);
                }
            });
        } else { //Si no está aprobado revisa que ramos se bloquean y si está disponible
            for (const ramoCandidatoObj of Object.values(map)) {
                if (ramoCandidatoObj.prerrequisitos.includes(id)) {
                    ramoCandidatoObj.disponible = false;
                    const ramoCandidato = document.querySelector(`.ramo[data-id='${ramoCandidatoObj.id}']`);
                    ramoCandidato.classList.remove('disponible');
                }
            }

            if (ramoObj.prerrequisitos.every(prereqId => map[prereqId].aprobado) && minSemestre + 2 >= ramoObj.semestre) {
                ramoObj.disponible = true;
                ramo.classList.add('disponible');
            }
        }

    });
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

        const {listaRamos, map} = procesarJSON(jsMalla);
        cargarColoresFacultades(listaRamos,jsColor);
        dibujarLeyenda(jsColor);

        activarEventos(map);

        const datosAgrupados = agruparPorSemestres(listaRamos);

        dibujarMalla(datosAgrupados);

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2 style="color:red">Error: ${error.message}</h2>`;
    }
}

iniciarApp();