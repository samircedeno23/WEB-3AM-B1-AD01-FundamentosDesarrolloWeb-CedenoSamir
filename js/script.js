/*
  Práctica de Programación Web 1.
  No se usa servidor ni base de datos. Los usuarios son de ejemplo.
  Las solicitudes se guardan en un array y en localStorage.
*/

const usuarios = [
  { id: 1, nombre: "Ana Torres", correo: "ana@taller.com", clave: "123456", telefono: "0991234567", rol: "cliente", activo: true },
  { id: 2, nombre: "Luis Mora", correo: "luis@taller.com", clave: "123456", telefono: "0987654321", rol: "cliente", activo: true },
  { id: 3, nombre: "Andrea Ruiz", correo: "admin@taller.com", clave: "admin123", telefono: "0974561230", rol: "admin", activo: true },
  { id: 4, nombre: "Usuario Inactivo", correo: "inactivo@taller.com", clave: "123456", telefono: "0990000000", rol: "cliente", activo: false }
];

const estados = ["Pendiente", "En revisión", "En proceso", "Finalizado", "Cancelado"];
let solicitudes = [];
let usuarioActual = null;
let idEdicion = null;

// Atajo para obtener campos del HTML por su identificador.
function campo(id) {
  return document.getElementById(id);
}

function fechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

function fechaEjemplo(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1);
  return fechaLocal(fecha);
}

// Datos de ejemplo: sirven para comprobar los diferentes permisos.
function cargarSolicitudes() {
  const guardadas = localStorage.getItem("taller_solicitudes_v2");
  if (guardadas === null) {
    solicitudes = [
      { id: "S0001", usuarioId: 1, nombre: "Ana Torres", correo: "ana@taller.com", telefono: "0991234567", placa: "PBA-1234", marca: "Toyota", modelo: "Corolla", anio: 2020, kilometraje: 42500, servicio: "Cambio de aceite", fecha: fechaEjemplo(2), hora: "09:00", prioridad: "Normal", revisionExtra: false, observaciones: "Revisar el filtro.", estado: "Pendiente" },
      { id: "S0002", usuarioId: 2, nombre: "Luis Mora", correo: "luis@taller.com", telefono: "0987654321", placa: "GBC-9876", marca: "Chevrolet", modelo: "Aveo", anio: 2018, kilometraje: 71000, servicio: "Revisión de frenos", fecha: fechaEjemplo(3), hora: "11:30", prioridad: "Urgente", revisionExtra: true, observaciones: "Ruido al frenar.", estado: "En revisión" },
      { id: "S0003", usuarioId: 3, nombre: "Andrea Ruiz", correo: "admin@taller.com", telefono: "0974561230", placa: "PCE-4321", marca: "Kia", modelo: "Rio", anio: 2021, kilometraje: 28000, servicio: "Revisión de batería", fecha: fechaEjemplo(4), hora: "15:00", prioridad: "Normal", revisionExtra: false, observaciones: "", estado: "En proceso" }
    ];
    guardarSolicitudes();
  } else {
    try {
      const datos = JSON.parse(guardadas);
      solicitudes = Array.isArray(datos) ? datos : [];
    } catch (error) {
      solicitudes = [];
    }
  }
}

function guardarSolicitudes() {
  localStorage.setItem("taller_solicitudes_v2", JSON.stringify(solicitudes));
}

function esAdmin() {
  return usuarioActual !== null && usuarioActual.rol === "admin";
}

function mostrarAviso(titulo, mensaje, tipo) {
  if (window.Swal) {
    Swal.fire({ title: titulo, text: mensaje, icon: tipo, confirmButtonColor: "#a33e35" });
  } else {
    alert(titulo + "\n" + mensaje);
  }
}

function iniciarSesion(evento) {
  evento.preventDefault();
  const correo = campo("loginCorreo").value.trim().toLowerCase();
  const clave = campo("loginClave").value;

  if (correo === "" || clave === "") {
    mostrarAviso("Faltan datos", "Ingresa tu correo y contraseña.", "warning");
    return;
  }
  const usuario = usuarios.find(function (persona) {
    return persona.correo === correo && persona.clave === clave;
  });
  if (!usuario) {
    mostrarAviso("Acceso inválido", "El correo o la contraseña son incorrectos.", "error");
    return;
  }
  if (!usuario.activo) {
    mostrarAviso("Cuenta deshabilitada", "Esta cuenta no puede iniciar sesión.", "error");
    return;
  }

  usuarioActual = usuario;
  sessionStorage.setItem("taller_usuario_v2", String(usuario.id));
  campo("formLogin").reset();
  actualizarPantalla();
  location.hash = "#panel";
  mostrarAviso("Sesión iniciada", "Bienvenido, " + usuario.nombre + ".", "success");
}

function cerrarSesion() {
  usuarioActual = null;
  idEdicion = null;
  sessionStorage.removeItem("taller_usuario_v2");
  actualizarPantalla();
  location.hash = "#inicio";
}

function actualizarPantalla() {
  const conectado = usuarioActual !== null;
  const admin = esAdmin();
  campo("acceso").classList.toggle("d-none", conectado);
  campo("panel").classList.toggle("d-none", !conectado);
  campo("solicitud").classList.toggle("d-none", !conectado);
  campo("administracion").classList.toggle("d-none", !admin);
  campo("menuIngresar").classList.toggle("d-none", conectado);
  campo("menuSalir").classList.toggle("d-none", !conectado);
  campo("menuPanel").classList.toggle("d-none", !conectado);
  campo("menuAdmin").classList.toggle("d-none", !admin);
  campo("grupoSeleccionUsuario").classList.toggle("d-none", !admin);
  campo("enlaceSolicitar").href = conectado ? "#solicitud" : "#acceso";
  campo("botonHero").href = conectado ? "#solicitud" : "#acceso";

  if (conectado) {
    campo("nombreBienvenida").textContent = usuarioActual.nombre.split(" ")[0];
    campo("perfilNombre").textContent = usuarioActual.nombre;
    campo("perfilCorreo").textContent = usuarioActual.correo;
    campo("perfilTelefono").textContent = usuarioActual.telefono;
    campo("perfilRol").textContent = admin ? "Administrador" : "Cliente";
    cargarUsuarios();
    limpiarFormulario();
    mostrarMisSolicitudes();
    if (admin) mostrarAdministracion();
  }
}

// Los enlaces privados no deben abrirse desde una cuenta sin permisos.
function revisarAcceso() {
  const destino = location.hash;
  if (destino === "#administracion" && !esAdmin()) {
    location.hash = usuarioActual ? "#panel" : "#acceso";
    mostrarAviso("Acceso denegado", "Esta sección es solo para administradores.", "error");
  } else if ((destino === "#panel" || destino === "#solicitud") && !usuarioActual) {
    location.hash = "#acceso";
    mostrarAviso("Acceso restringido", "Primero debes iniciar sesión.", "warning");
  }
}

function cargarUsuarios() {
  campo("usuarioSolicitud").innerHTML = "";
  usuarios.forEach(function (usuario) {
    if (usuario.activo) {
      const opcion = document.createElement("option");
      opcion.value = usuario.id;
      opcion.textContent = usuario.nombre;
      campo("usuarioSolicitud").appendChild(opcion);
    }
  });
}

function llenarDatosCliente() {
  if (!esAdmin()) return;
  const id = Number(campo("usuarioSolicitud").value);
  const usuario = usuarios.find(function (persona) { return persona.id === id; });
  if (usuario) {
    campo("clienteNombre").value = usuario.nombre;
    campo("clienteCorreo").value = usuario.correo;
    campo("clienteTelefono").value = usuario.telefono;
  }
}

function limpiarFormulario() {
  campo("formSolicitud").reset();
  idEdicion = null;
  campo("tituloFormulario").textContent = "Nueva solicitud";
  campo("botonGuardar").textContent = "Guardar solicitud";
  campo("botonCancelarEdicion").classList.add("d-none");
  campo("fechaSolicitud").min = fechaLocal(new Date());
  campo("vehiculoAnio").max = new Date().getFullYear();

  if (usuarioActual) {
    campo("clienteNombre").readOnly = !esAdmin();
    campo("clienteCorreo").readOnly = !esAdmin();
    campo("clienteTelefono").readOnly = !esAdmin();
    if (esAdmin()) {
      campo("usuarioSolicitud").value = usuarioActual.id;
      llenarDatosCliente();
    } else {
      campo("clienteNombre").value = usuarioActual.nombre;
      campo("clienteCorreo").value = usuarioActual.correo;
      campo("clienteTelefono").value = usuarioActual.telefono;
    }
  }
}

// Cada condición devuelve un mensaje de error. Una cadena vacía significa que todo está bien.
function validarSolicitud(datos) {
  if (datos.nombre.length < 3 || datos.marca === "" || datos.modelo === "") return "Completa el nombre, la marca y el modelo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) return "Ingresa un correo válido.";
  if (!/^0[0-9]{8,9}$/.test(datos.telefono)) return "El teléfono debe iniciar con 0 y tener 9 o 10 números.";
  if (!/^[A-Z]{3}-[0-9]{3,4}$/.test(datos.placa)) return "La placa debe tener tres letras y tres o cuatro números. Ejemplo: ABC-1234.";
  const anioActual = new Date().getFullYear();
  if (!Number.isInteger(datos.anio) || datos.anio < 1980 || datos.anio > anioActual) return "El año debe estar entre 1980 y " + anioActual + ".";
  if (campo("vehiculoKm").value.trim() === "" || !Number.isInteger(datos.kilometraje) || datos.kilometraje < 0 || datos.kilometraje > 1000000) return "Ingresa un kilometraje válido entre 0 y 1.000.000.";
  if (datos.servicio === "") return "Selecciona un servicio de mantenimiento.";
  if (datos.prioridad !== "Normal" && datos.prioridad !== "Urgente") return "Selecciona la prioridad.";
  if (datos.fecha === "") return "Debes ingresar la fecha.";
  const fecha = new Date(datos.fecha + "T12:00:00");
  if (isNaN(fecha.getTime()) || fechaLocal(fecha) !== datos.fecha) return "La fecha ingresada no es válida.";
  const hoy = fechaLocal(new Date());
  if (datos.fecha < hoy) return "No se permiten fechas anteriores a hoy.";
  if (fecha.getDay() === 0) return "El taller no atiende los domingos.";
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(datos.hora) || datos.hora < "08:00" || datos.hora > "17:00") return "La hora debe estar entre las 08:00 y las 17:00.";
  if (datos.fecha === hoy) {
    const ahora = new Date();
    const horaActual = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
    if (datos.hora <= horaActual) return "Para hoy elige una hora posterior a la actual.";
  }
  return "";
}

function nuevoId() {
  let mayor = 0;
  for (const solicitud of solicitudes) {
    const numero = Number(solicitud.id.substring(1));
    if (numero > mayor) mayor = numero;
  }
  return "S" + String(mayor + 1).padStart(4, "0");
}

function registrarSolicitud(evento) {
  evento.preventDefault();
  if (!usuarioActual || (idEdicion !== null && !esAdmin())) {
    mostrarAviso("Acceso denegado", "No tienes permiso para guardar estos cambios.", "error");
    return;
  }

  // Un cliente siempre crea solicitudes para su propia cuenta.
  let idUsuario = usuarioActual.id;
  if (esAdmin()) {
    idUsuario = Number(campo("usuarioSolicitud").value);
    const cuenta = usuarios.find(function (u) { return u.id === idUsuario && u.activo; });
    if (!cuenta) {
      mostrarAviso("Usuario inválido", "Selecciona un usuario activo.", "error");
      return;
    }
  }

  let placa = campo("vehiculoPlaca").value.trim().toUpperCase().replaceAll(" ", "");
  if (/^[A-Z]{3}[0-9]{3,4}$/.test(placa)) placa = placa.slice(0, 3) + "-" + placa.slice(3);
  const prioridad = document.querySelector("input[name='prioridad']:checked");
  const datos = {
    usuarioId: idUsuario,
    nombre: campo("clienteNombre").value.trim(),
    correo: campo("clienteCorreo").value.trim().toLowerCase(),
    telefono: campo("clienteTelefono").value.trim(),
    placa: placa,
    marca: campo("vehiculoMarca").value.trim(),
    modelo: campo("vehiculoModelo").value.trim(),
    anio: Number(campo("vehiculoAnio").value),
    kilometraje: Number(campo("vehiculoKm").value),
    servicio: campo("tipoServicio").value,
    fecha: campo("fechaSolicitud").value,
    hora: campo("horaSolicitud").value,
    prioridad: prioridad ? prioridad.value : "",
    revisionExtra: campo("revisionExtra").checked,
    observaciones: campo("observaciones").value.trim()
  };
  // El cliente no puede cambiar su identidad modificando el HTML.
  if (!esAdmin()) {
    datos.nombre = usuarioActual.nombre;
    datos.correo = usuarioActual.correo;
    datos.telefono = usuarioActual.telefono;
  }

  const error = validarSolicitud(datos);
  if (error !== "") {
    mostrarAviso("Revisa el formulario", error, "warning");
    return;
  }
  if (!campo("confirmacionDatos").checked) {
    mostrarAviso("Falta confirmación", "Debes confirmar que los datos son correctos.", "warning");
    return;
  }

  if (idEdicion === null) {
    datos.id = nuevoId();
    datos.estado = "Pendiente";
    solicitudes.push(datos);
    mostrarAviso("Solicitud guardada", "Se registró el mantenimiento.", "success");
  } else {
    const posicion = solicitudes.findIndex(function (s) { return s.id === idEdicion; });
    if (posicion === -1) return;
    datos.id = idEdicion;
    datos.estado = solicitudes[posicion].estado;
    solicitudes[posicion] = datos;
    mostrarAviso("Cambios guardados", "La solicitud fue actualizada.", "success");
  }
  guardarSolicitudes();
  limpiarFormulario();
  mostrarMisSolicitudes();
  if (esAdmin()) mostrarAdministracion();
  location.hash = esAdmin() ? "#administracion" : "#panel";
}

function agregarCelda(fila, texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  fila.appendChild(celda);
  return celda;
}

function mostrarMisSolicitudes() {
  if (!usuarioActual) return;
  const propias = solicitudes.filter(function (s) { return s.usuarioId === usuarioActual.id; });
  const tabla = document.querySelector("#tablaPropias tbody");
  tabla.innerHTML = "";
  propias.forEach(function (s) {
    const fila = document.createElement("tr");
    agregarCelda(fila, s.id);
    agregarCelda(fila, s.placa + " · " + s.marca + " " + s.modelo);
    agregarCelda(fila, s.servicio);
    agregarCelda(fila, s.fecha + " / " + s.hora);
    const celdaEstado = agregarCelda(fila, "");
    const texto = document.createElement("span");
    texto.className = "estado " + claseEstado(s.estado);
    texto.textContent = s.estado;
    celdaEstado.appendChild(texto);
    tabla.appendChild(fila);
  });
  campo("sinPropias").classList.toggle("d-none", propias.length > 0);
}

function claseEstado(estado) {
  if (estado === "Pendiente") return "estado-pendiente";
  if (estado === "En revisión") return "estado-revision";
  if (estado === "En proceso") return "estado-proceso";
  if (estado === "Finalizado") return "estado-finalizado";
  return "estado-cancelado";
}

function mostrarAdministracion() {
  if (!esAdmin()) return;
  const busqueda = campo("buscarSolicitud").value.trim().toLowerCase();
  const filtro = campo("filtrarEstado").value;
  const encontrados = solicitudes.filter(function (s) {
    const texto = (s.id + " " + s.nombre + " " + s.placa).toLowerCase();
    return texto.includes(busqueda) && (filtro === "" || s.estado === filtro);
  });
  const tabla = document.querySelector("#tablaAdmin tbody");
  tabla.innerHTML = "";
  encontrados.forEach(function (s) {
    const fila = document.createElement("tr");
    agregarCelda(fila, s.id);
    const cliente = agregarCelda(fila, s.nombre);
    const correo = document.createElement("small");
    correo.className = "detalle-secundario";
    correo.textContent = s.correo;
    cliente.appendChild(correo);
    agregarCelda(fila, s.placa + " · " + s.marca + " " + s.modelo);
    agregarCelda(fila, s.servicio);
    agregarCelda(fila, s.fecha + " / " + s.hora);

    const celdaEstado = agregarCelda(fila, "");
    const selector = document.createElement("select");
    selector.className = "form-select";
    selector.setAttribute("aria-label", "Estado de " + s.id);
    estados.forEach(function (estado) {
      const opcion = document.createElement("option");
      opcion.value = estado;
      opcion.textContent = estado;
      selector.appendChild(opcion);
    });
    selector.value = s.estado;
    selector.addEventListener("change", function () { cambiarEstado(s.id, selector.value); });
    celdaEstado.appendChild(selector);

    const acciones = agregarCelda(fila, "");
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn btn-sm btn-outline-secondary accion-tabla me-1 mb-1";
    editar.textContent = "Editar";
    editar.addEventListener("click", function () { editarSolicitud(s.id); });
    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "btn btn-sm btn-outline-danger accion-tabla mb-1";
    eliminar.textContent = "Eliminar";
    eliminar.addEventListener("click", function () { confirmarEliminar(s.id); });
    acciones.appendChild(editar);
    acciones.appendChild(eliminar);
    tabla.appendChild(fila);
  });
  campo("sinAdmin").classList.toggle("d-none", encontrados.length > 0);
}

function cambiarEstado(id, nuevoEstado) {
  if (!esAdmin() || !estados.includes(nuevoEstado)) return;
  const solicitud = solicitudes.find(function (s) { return s.id === id; });
  if (solicitud) {
    solicitud.estado = nuevoEstado;
    guardarSolicitudes();
    mostrarMisSolicitudes();
    mostrarAdministracion();
    mostrarAviso("Estado actualizado", "Se cambió el estado de " + id + ".", "success");
  }
}

function editarSolicitud(id) {
  if (!esAdmin()) return;
  const s = solicitudes.find(function (registro) { return registro.id === id; });
  if (!s) return;
  limpiarFormulario();
  idEdicion = id;
  campo("tituloFormulario").textContent = "Editar solicitud " + id;
  campo("botonGuardar").textContent = "Guardar cambios";
  campo("botonCancelarEdicion").classList.remove("d-none");
  campo("usuarioSolicitud").value = s.usuarioId;
  campo("clienteNombre").value = s.nombre;
  campo("clienteCorreo").value = s.correo;
  campo("clienteTelefono").value = s.telefono;
  campo("vehiculoPlaca").value = s.placa;
  campo("vehiculoMarca").value = s.marca;
  campo("vehiculoModelo").value = s.modelo;
  campo("vehiculoAnio").value = s.anio;
  campo("vehiculoKm").value = s.kilometraje;
  campo("tipoServicio").value = s.servicio;
  campo("fechaSolicitud").value = s.fecha;
  campo("horaSolicitud").value = s.hora;
  campo("prioridadNormal").checked = s.prioridad !== "Urgente";
  campo("prioridadUrgente").checked = s.prioridad === "Urgente";
  campo("revisionExtra").checked = s.revisionExtra;
  campo("observaciones").value = s.observaciones;
  location.hash = "#solicitud";
}

function confirmarEliminar(id) {
  if (!esAdmin()) return;
  if (window.Swal) {
    Swal.fire({
      title: "¿Eliminar solicitud?", text: "Se borrará " + id + ".",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
      confirmButtonColor: "#a33e35"
    }).then(function (respuesta) {
      if (respuesta.isConfirmed) eliminarSolicitud(id);
    });
  } else {
    if (confirm("¿Deseas eliminar la solicitud " + id + "?")) eliminarSolicitud(id);
  }
}

function eliminarSolicitud(id) {
  if (!esAdmin()) return;
  solicitudes = solicitudes.filter(function (s) { return s.id !== id; });
  guardarSolicitudes();
  mostrarMisSolicitudes();
  mostrarAdministracion();
  mostrarAviso("Solicitud eliminada", "Se eliminó el registro " + id + ".", "success");
}

// Conectar botones y formularios una vez cargado el HTML.
document.addEventListener("DOMContentLoaded", function () {
  cargarSolicitudes();
  const sesion = Number(sessionStorage.getItem("taller_usuario_v2"));
  usuarioActual = usuarios.find(function (u) { return u.id === sesion && u.activo; }) || null;
  campo("anioActual").textContent = new Date().getFullYear();
  campo("formLogin").addEventListener("submit", iniciarSesion);
  campo("botonSalir").addEventListener("click", cerrarSesion);
  campo("formSolicitud").addEventListener("submit", registrarSolicitud);
  campo("botonCancelarEdicion").addEventListener("click", limpiarFormulario);
  campo("usuarioSolicitud").addEventListener("change", llenarDatosCliente);
  campo("buscarSolicitud").addEventListener("input", mostrarAdministracion);
  campo("filtrarEstado").addEventListener("change", mostrarAdministracion);
  campo("botonNuevaAdmin").addEventListener("click", limpiarFormulario);
  campo("botonNuevaCliente").addEventListener("click", limpiarFormulario);
  campo("enlaceSolicitar").addEventListener("click", function () { if (usuarioActual) limpiarFormulario(); });
  campo("botonHero").addEventListener("click", function () { if (usuarioActual) limpiarFormulario(); });
  window.addEventListener("hashchange", revisarAcceso);
  actualizarPantalla();
  revisarAcceso();
});
