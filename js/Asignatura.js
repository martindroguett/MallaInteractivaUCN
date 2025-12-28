export class Asignatura{
    constructor(id, nombre, creditos, prerrequisitos) {
        this.id = id;
        this.nombre = nombre;
        this.creditos = creditos;
        this.prerrequisitos = prerrequisitos;
        this.semestre = 0;
        this.aprobado = false;
        this.disponible = false;
        this.desbloquea = [];
        this.color="#ccc";
        this.facultad = "";

        if (prerrequisitos.length == 0) {
            this.disponible = true;
        }
    }
}