/**
 * ORDERAPP - servidor (Google Apps Script)
 * Va pegado dentro de la hoja de Google (Extensiones > Apps Script).
 * Guarda pedidos en la hoja, fotos en Drive y manda correos desde Gmail.
 *
 * Versión piloto: PIN por persona, pedidos agendados, cierre por entrega,
 * motivos de problema y una hoja "Piloto" con las 5 preguntas.
 */

const TZ = 'America/Bogota';

const CONFIG = {
  // CAMBIA estos correos por los reales cuando termines las pruebas
  CORREO_LIDER: 'jheanboder11@gmail.com',
  CORREO_ADMIN: 'jheanboder11@gmail.com',
  // TEMPORAL para pruebas: muestra usuarios y PIN debajo de la entrada. Ponlo en false antes de usarla de verdad.
  MOSTRAR_ACCESOS: true,
  DOMI: { 'Medellín': 12000, 'Aledaño': 15000, 'Especial': 15000 },
  LIMITE_MIN: { 'Medellín': 120, 'Aledaño': 180, 'Especial': 180 },
  DOMICILIARIOS: ['Teo', 'Luz'],
  // Usuarios de ejemplo: cámbialos por los nombres reales en la pestaña Usuarios (Nombre, Rol, PIN)
  // Roles: Administrador (el jefe: ve todo, analiza y crea usuarios) · Colaborador (opera los pedidos) · Mensajero (entrega)
  // Por dentro el código usa: Administrador = 'Lider', Colaborador = 'Admin', Mensajero = 'Domiciliario'
  USUARIOS_INICIALES: [['Leo', 'Administrador'], ['Ana', 'Colaborador'], ['Teo', 'Mensajero'], ['Luz', 'Mensajero']],
  FORMAS_PAGO: ['Efectivo', 'Transferencia', 'Ya pagado'],
  MOTIVOS: ['No contesta', 'No estaba', 'Dirección incorrecta', 'Error al empacar', 'Rechazó el pedido', 'Otro'],
  MOTIVOS_CANCELAR: ['El cliente canceló', 'Error al crear el pedido', 'No hay el producto', 'Otro'],
  CARPETA_FOTOS: 'Orderapp - fotos',
  // Punto de partida del piloto (lo que tú estimas hoy, sin medir)
  ANTES: {
    tiempo: '5 horas en promedio, contando los pedidos agendados',
    fallas: 'Alrededor de 6% (3 de cada 50)',
    plata: 'Casi siempre cuadra',
    trabajo: 'Unas 2 horas diarias de trabajo; el cierre es lo más tedioso',
    decision: ''
  }
};

const PEDIDOS = 'Pedidos', CIERRES = 'Cierres', USUARIOS = 'Usuarios', PILOTO = 'Piloto';
const COLS_PEDIDOS = ['ID', 'Número', 'Fecha', 'Creado por', 'Cliente', 'Celular', 'Dirección', 'Municipio', 'Qué lleva', 'Notas', 'Forma de pago', 'Valor del pedido', 'Valor domi', 'Domiciliario', 'Estado', 'Hora salida', 'Foto salida', 'Hora entrega', 'Foto entrega', 'Problema', 'Hora devuelto', 'Alerta enviada',
  'Hora creado', 'Entregar el día', 'Entregar antes de', 'Motivo', 'Cerrado en', 'Min en local', 'Min en calle', 'Horas totales', 'Entregó a tiempo', 'Hora cancelado'];
const COLS_CIERRES = ['Fecha', 'Domiciliario', 'Pedidos', 'Efectivo recibido', 'Pago domiciliario', 'Neto', 'Foto consignación', 'Hora del cierre'];
const COLS_USUARIOS = ['Nombre', 'Rol', 'PIN'];
const NUM_FMT = { 'Número': '0', 'Valor del pedido': '#,##0', 'Valor domi': '#,##0', 'Efectivo recibido': '#,##0', 'Pago domiciliario': '#,##0', 'Neto': '#,##0', 'Pedidos': '0', 'Min en local': '0', 'Min en calle': '0', 'Horas totales': '0.0' };
const ABIERTOS = ['Empacado', 'En entrega'];

/* ---------- Página ---------- */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Orderapp')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- Ayudas internas ---------- */

function ahora_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function hoy_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function manana_() { return Utilities.formatDate(new Date(Date.now() + 864e5), TZ, 'yyyy-MM-dd'); }
function horaHM_() { return Utilities.formatDate(new Date(), TZ, 'HH:mm'); }
function conLock_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(25000);
  try { return fn(); } finally { l.releaseLock(); }
}
function limpiar_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}
function dinero_(n) {
  const v = Math.round(Math.abs(Number(n) || 0));
  return (n < 0 ? '-' : '') + '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function fmtVal_(v, esFecha) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, TZ, esFecha ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return v;
}
function diaDe_(iso) { return String(iso || '').slice(0, 10); }
// Día para el que se prometió el pedido (los pedidos viejos usan el día en que se crearon)
function dia_(r) { return r['Entregar el día'] || r.Fecha; }

function hoja_(nombre, cols) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  return sh;
}

function encabezados_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function leer_(sh, max) {
  const ult = sh.getLastRow(), nc = sh.getLastColumn();
  if (ult < 2) return [];
  const head = encabezados_(sh);
  const desde = Math.max(2, ult - (max || 600) + 1);
  const vals = sh.getRange(desde, 1, ult - desde + 1, nc).getValues();
  return vals.map(function (v, i) {
    const o = { _fila: desde + i };
    head.forEach(function (h, j) { o[h] = fmtVal_(v[j], h === 'Fecha' || h === 'Entregar el día'); });
    return o;
  });
}

function agregar_(sh, obj) {
  const head = encabezados_(sh);
  const fila = sh.getLastRow() + 1;
  const r = sh.getRange(fila, 1, 1, head.length);
  r.setNumberFormats([head.map(function (h) { return NUM_FMT[h] || '@'; })]);
  r.setValues([head.map(function (h) { return obj[h] === undefined ? '' : obj[h]; })]);
  return fila;
}

function escribir_(sh, fila, cambios) {
  const head = encabezados_(sh);
  Object.keys(cambios).forEach(function (k) {
    const j = head.indexOf(k);
    if (j < 0) throw new Error('Falta la columna "' + k + '" en la hoja ' + sh.getName() + '. Corre setup().');
    const c = sh.getRange(fila, j + 1);
    c.setNumberFormat(NUM_FMT[k] || '@');
    c.setValue(cambios[k]);
  });
}

function esPedido_(r) { return r.ID && String(r.ID).indexOf('ejemplo') !== 0; }

function pub_(r) {
  return {
    id: String(r.ID), num: Number(r['Número']) || 0, fecha: r.Fecha, por: r['Creado por'],
    cli: r.Cliente, tel: String(r.Celular), dir: r['Dirección'], mun: r.Municipio,
    items: r['Qué lleva'], nota: r.Notas, pago: r['Forma de pago'],
    val: Number(r['Valor del pedido']) || 0, domi: Number(r['Valor domi']) || 0,
    cour: r.Domiciliario, st: r.Estado,
    tOut: r['Hora salida'] || '', fOut: r['Foto salida'] || '',
    tIn: r['Hora entrega'] || '', fIn: r['Foto entrega'] || '',
    prob: r.Problema || '', motivo: r.Motivo || '',
    dia: dia_(r), antes: r['Entregar antes de'] || '', creado: r['Hora creado'] || '',
    cerrado: r['Cerrado en'] || ''
  };
}

function calcular_(pedidos) {
  const e = pedidos.filter(function (r) { return r.Estado === 'Entregado'; });
  const efectivo = e.filter(function (r) { return r['Forma de pago'] === 'Efectivo'; })
    .reduce(function (a, r) { return a + (Number(r['Valor del pedido']) || 0); }, 0);
  const pago = e.reduce(function (a, r) { return a + (Number(r['Valor domi']) || 0); }, 0);
  return { n: e.length, efectivo: efectivo, pago: pago, neto: efectivo - pago };
}

/* ---------- Usuarios y PIN ---------- */

function usuarios_() {
  const cache = CacheService.getScriptCache();
  const c = cache.get('usuarios');
  if (c) return JSON.parse(c);
  const sh = SpreadsheetApp.getActive().getSheetByName(USUARIOS);
  const lista = [];
  if (sh && sh.getLastRow() >= 2) {
    const head = encabezados_(sh);
    const iN = head.indexOf('Nombre'), iR = head.indexOf('Rol'), iP = head.indexOf('PIN');
    if (iN >= 0 && iR >= 0 && iP >= 0) {
      const vals = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
      vals.forEach(function (v) {
        let r = limpiar_(v[iR], 20);
        const n = limpiar_(v[iN], 40), p = String(v[iP] == null ? '' : v[iP]).trim();
        r = ({ 'Administrador': 'Lider', 'Colaborador': 'Admin', 'Mensajero': 'Domiciliario', 'Líder': 'Lider' })[r] || r;
        if (n && (r === 'Admin' || r === 'Lider' || r === 'Domiciliario')) lista.push({ nombre: n, rol: r, pin: p });
      });
    }
  }
  cache.put('usuarios', JSON.stringify(lista), 60);
  return lista;
}

function cours_() {
  const l = usuarios_().filter(function (u) { return u.rol === 'Domiciliario'; }).map(function (u) { return u.nombre; });
  return l.length ? l : CONFIG.DOMICILIARIOS;
}

function auth_(a, roles) {
  a = a || {};
  const nombre = limpiar_(a.u, 40), pin = String(a.p == null ? '' : a.p).trim();
  if (!nombre || !pin) throw new Error('Escribe tu usuario y tu PIN');
  const cache = CacheService.getScriptCache();
  const kF = 'fallos_' + clave_(nombre);
  if (Number(cache.get(kF) || 0) >= 5) throw new Error('Demasiados intentos. Espera 10 minutos o pídele el PIN al Administrador.');
  // El usuario se puede escribir con o sin mayúsculas y tildes: "ana" = "Ana"
  const u = usuarios_().filter(function (x) { return clave_(x.nombre) === clave_(nombre); })[0];
  if (!u || !u.pin || u.pin !== pin) {
    cache.put(kF, String(Number(cache.get(kF) || 0) + 1), 600);
    throw new Error('Usuario o PIN incorrecto. Revisa e intenta de nuevo.');
  }
  cache.remove(kF);
  if (roles && roles.indexOf(u.rol) < 0) throw new Error('No tienes permiso para esto');
  return u;
}

function clave_(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }

// (Ya no se usa en la entrada: cada quien escribe su usuario. Se deja solo para pruebas.)
function nombres() {
  const us = usuarios_();
  if (!us.length) throw new Error('Falta la pestaña Usuarios. Corre setup() en el editor.');
  return {
    admins: us.filter(function (u) { return u.rol === 'Admin' || u.rol === 'Lider'; }).map(function (u) { return u.nombre; }),
    cours: us.filter(function (u) { return u.rol === 'Domiciliario'; }).map(function (u) { return u.nombre; })
  };
}

// Lista de usuarios y PIN para la pantalla de entrada (solo si MOSTRAR_ACCESOS es true)
function accesosDemo() {
  if (!CONFIG.MOSTRAR_ACCESOS) return [];
  const nom = { Admin: 'Colaborador', Lider: 'Administrador', Domiciliario: 'Mensajero' };
  return usuarios_().map(function (u) { return { nombre: u.nombre, rol: nom[u.rol] || u.rol, pin: u.pin }; });
}

function login(a) {
  const u = auth_(a);
  return { nombre: u.nombre, rol: u.rol };
}

/* ---------- Equipo: solo el Administrador crea usuarios ---------- */

const ROLES_ = { 'Administrador': 'Lider', 'Colaborador': 'Admin', 'Mensajero': 'Domiciliario' };
const ROL_TXT_ = { Admin: 'Colaborador', Lider: 'Administrador', Domiciliario: 'Mensajero' };

function equipo(a) {
  auth_(a, ['Lider']);
  return usuarios_().map(function (u) { return { nombre: u.nombre, rol: ROL_TXT_[u.rol] || u.rol }; });
}

function pinNuevo_() {
  const usados = {};
  usuarios_().forEach(function (u) { usados[u.pin] = true; });
  let p;
  do { p = String(Math.floor(1000 + Math.random() * 9000)); } while (usados[p]);
  return p;
}

function crearUsuario(a, d) {
  auth_(a, ['Lider']);
  d = d || {};
  const nombre = limpiar_(d.nombre, 30), rol = ROLES_[d.rol];
  if (!nombre) throw new Error('Escribe el nombre del usuario');
  if (!rol) throw new Error('Elige el rol');
  return conLock_(function () {
    CacheService.getScriptCache().remove('usuarios');
    if (usuarios_().some(function (u) { return clave_(u.nombre) === clave_(nombre); })) throw new Error('Ya existe un usuario llamado ' + nombre + '. Usa otro nombre.');
    const pin = pinNuevo_();
    const sh = hoja_(USUARIOS, COLS_USUARIOS), head = encabezados_(sh), fila = head.map(function () { return ''; });
    fila[head.indexOf('Nombre')] = nombre; fila[head.indexOf('Rol')] = ROL_TXT_[rol]; fila[head.indexOf('PIN')] = pin;
    sh.getRange(sh.getLastRow() + 1, 1, 1, fila.length).setNumberFormat('@').setValues([fila]);
    CacheService.getScriptCache().remove('usuarios');
    return { nombre: nombre, rol: ROL_TXT_[rol], pin: pin, equipo: equipo(a) };
  });
}

function nuevoPin(a, nombre) {
  auth_(a, ['Lider']);
  return conLock_(function () {
    CacheService.getScriptCache().remove('usuarios');
    const sh = hoja_(USUARIOS, COLS_USUARIOS), head = encabezados_(sh);
    const iN = head.indexOf('Nombre'), iP = head.indexOf('PIN');
    const vals = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), sh.getLastColumn()).getValues();
    for (let i = 0; i < vals.length; i++) {
      if (clave_(vals[i][iN]) === clave_(nombre)) {
        const pin = pinNuevo_();
        sh.getRange(i + 2, iP + 1).setNumberFormat('@').setValue(pin);
        CacheService.getScriptCache().remove('usuarios');
        CacheService.getScriptCache().remove('fallos_' + clave_(nombre));
        return { nombre: String(vals[i][iN]), pin: pin };
      }
    }
    throw new Error('No encontré ese usuario');
  });
}

/* ---------- Lo que lee la página ---------- */

function getState(a) { return estado_(auth_(a)); }

function relevante_(r, hoy) {
  return dia_(r) >= diaAtras_(1) ||
    diaDe_(r['Hora entrega']) >= diaAtras_(1) ||
    ABIERTOS.concat(['Problema']).indexOf(r.Estado) >= 0 ||
    diaDe_(r['Hora entrega']) === hoy ||
    (r.Estado === 'Entregado' && !r['Cerrado en']);
}

function estado_(u) {
  const hoy = hoy_();
  if (u.rol === 'Lider') {
    return { hoy: hoy, ahora: Date.now(), rol: u.rol, nombre: u.nombre, cours: cours_(), motivos: CONFIG.MOTIVOS, pedidos: [], cierres: {}, panel: panel_(hoy) };
  }
  const esAdmin = u.rol === 'Admin';
  const pedidos = leer_(hoja_(PEDIDOS, COLS_PEDIDOS), 600)
    .filter(esPedido_)
    .filter(function (r) { return relevante_(r, hoy); })
    .filter(function (r) { return esAdmin || r.Domiciliario === u.nombre; })
    .map(pub_);
  const cierres = {};
  leer_(hoja_(CIERRES, COLS_CIERRES), 100).filter(function (r) { return r.Fecha === hoy; }).forEach(function (r) {
    if (!esAdmin && r.Domiciliario !== u.nombre) return;
    const prev = cierres[r.Domiciliario] || { n: 0 };
    cierres[r.Domiciliario] = {
      n: prev.n + 1,
      efectivo: Number(r['Efectivo recibido']) || 0, pago: Number(r['Pago domiciliario']) || 0,
      neto: Number(r['Neto']) || 0, foto: r['Foto consignación'] || '', hora: r['Hora del cierre'] || ''
    };
  });
  return {
    hoy: hoy, ahora: Date.now(), rol: u.rol, nombre: u.nombre, cours: cours_(),
    motivos: CONFIG.MOTIVOS, motivosCancelar: CONFIG.MOTIVOS_CANCELAR, ayer: diaAtras_(1), pedidos: pedidos, cierres: cierres
  };
}

/* ---------- Acciones ---------- */

// Revisa y limpia los datos de un pedido (sirve para crear y para editar)
function validarPedido_(p) {
  p = p || {};
  const cli = limpiar_(p.cli, 80), tel = limpiar_(p.tel, 20), dir = limpiar_(p.dir, 200);
  const items = limpiar_(p.items, 200), nota = limpiar_(p.nota, 200);
  if (!cli || !tel || !dir || !items) throw new Error('Te falta el nombre, el celular, la dirección o qué lleva');
  if (!Object.prototype.hasOwnProperty.call(CONFIG.DOMI, p.mun)) throw new Error('Municipio no válido');
  if (CONFIG.FORMAS_PAGO.indexOf(p.pago) < 0) throw new Error('Forma de pago no válida');
  if (cours_().indexOf(p.cour) < 0) throw new Error('Domiciliario no válido');
  const val = p.pago === 'Ya pagado' ? 0 : Math.round(Number(p.val) || 0);
  if (p.pago !== 'Ya pagado' && val <= 0) throw new Error('Te falta decir cuánto cobra en total (con domi)');
  const antes = limpiar_(p.antes, 5);
  if (antes && !/^([01]\d|2[0-3]):[0-5]\d$/.test(antes)) throw new Error('La hora límite no es válida');
  return {
    'Cliente': cli, 'Celular': tel, 'Dirección': dir, 'Municipio': p.mun, 'Qué lleva': items,
    'Notas': nota, 'Forma de pago': p.pago, 'Valor del pedido': val, 'Valor domi': CONFIG.DOMI[p.mun],
    'Domiciliario': p.cour, 'Entregar el día': p.dia === 'Mañana' ? manana_() : hoy_(), 'Entregar antes de': antes
  };
}

function crearPedido(a, p) {
  const u = auth_(a, ['Admin']);
  const datos = validarPedido_(p);
  return conLock_(function () {
    const sh = hoja_(PEDIDOS, COLS_PEDIDOS), hoy = hoy_();
    const num = leer_(sh, 300).filter(function (r) { return esPedido_(r) && r.Fecha === hoy; })
      .reduce(function (m, r) { return Math.max(m, Number(r['Número']) || 0); }, 0) + 1;
    agregar_(sh, Object.assign({
      'ID': hoy.replace(/-/g, '') + '-' + num, 'Número': num, 'Fecha': hoy, 'Creado por': u.nombre,
      'Estado': 'Empacado', 'Hora creado': ahora_()
    }, datos));
    return estado_(u);
  });
}

function carpeta_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* se vuelve a crear */ } }
  const it = DriveApp.getFoldersByName(CONFIG.CARPETA_FOTOS);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.CARPETA_FOTOS);
  props.setProperty('CARPETA_ID', f.getId());
  return f;
}

function subirFoto(a, dataUrl, etiqueta) {
  auth_(a);
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) throw new Error('La foto no es válida, intenta de nuevo');
  if (m[2].length > 7 * 1024 * 1024) throw new Error('La foto pesa demasiado');
  const nombre = limpiar_(etiqueta, 40).replace(/[^\w\- ]/g, '_') + '-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss') + '.jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nombre);
  return carpeta_().createFile(blob).getUrl();
}

function fotoValida_(u) { return /^https:\/\/(drive|docs)\.google\.com\//.test(String(u || '')); }

function minutosDesde_(iso) {
  const t = Date.parse(iso);
  return t ? Math.max(0, Math.round((Date.now() - t) / 60000)) : '';
}

function accion(a, id, tipo, d) {
  const u = auth_(a);
  if (u.rol === 'Lider') throw new Error('El Administrador solo consulta, no modifica pedidos');
  const esAdmin = u.rol === 'Admin';
  d = d || {};
  return conLock_(function () {
    const sh = hoja_(PEDIDOS, COLS_PEDIDOS);
    const r = leer_(sh, 600).filter(function (x) { return esPedido_(x) && String(x.ID) === String(id); })[0];
    if (!r) throw new Error('No encontré el pedido. Actualiza la pantalla.');
    if (!esAdmin && r.Domiciliario !== u.nombre) throw new Error('Ese pedido no es tuyo');
    if (!esAdmin && (tipo === 'devuelto' || tipo === 'reasignar' || tipo === 'editar' || tipo === 'cancelar')) throw new Error('No tienes permiso para esto');
    const cambio = 'Este pedido ya cambió de estado. Actualiza la pantalla.';
    const hoy = hoy_();
    if (tipo === 'salida') {
      if (r.Estado !== 'Empacado') throw new Error(cambio);
      if (dia_(r) > hoy) throw new Error('Este pedido es para el ' + dia_(r) + ', todavía no sale');
      if (!fotoValida_(d.foto)) throw new Error('Falta la foto de salida');
      const cam = { 'Estado': 'En entrega', 'Hora salida': ahora_(), 'Foto salida': d.foto };
      // La espera en el local solo tiene sentido si el pedido era para el mismo día
      if (r['Hora creado'] && dia_(r) === r.Fecha) cam['Min en local'] = minutosDesde_(r['Hora creado']);
      escribir_(sh, r._fila, cam);
    } else if (tipo === 'entrega') {
      if (r.Estado !== 'En entrega') throw new Error(cambio);
      if (!fotoValida_(d.foto)) throw new Error('Falta la foto de entrega');
      const cam = { 'Estado': 'Entregado', 'Hora entrega': ahora_(), 'Foto entrega': d.foto };
      const calle = minutosDesde_(r['Hora salida']);
      if (calle !== '') cam['Min en calle'] = calle;
      const tc = Date.parse(r['Hora creado']);
      if (tc) cam['Horas totales'] = Math.round(((Date.now() - tc) / 3600000) * 10) / 10;
      const prometido = dia_(r), antes = String(r['Entregar antes de'] || '');
      let ok = hoy <= prometido;
      if (ok && antes && hoy === prometido) ok = horaHM_() <= antes;
      cam['Entregó a tiempo'] = ok ? 'Sí' : 'No';
      escribir_(sh, r._fila, cam);
    } else if (tipo === 'problema') {
      if (r.Estado !== 'En entrega') throw new Error(cambio);
      const motivo = limpiar_(d.motivo, 40), texto = limpiar_(d.texto, 300);
      if (CONFIG.MOTIVOS.indexOf(motivo) < 0) throw new Error('Elige qué pasó');
      if (motivo === 'Otro' && !texto) throw new Error('Cuéntanos qué pasó, aunque sea corto');
      escribir_(sh, r._fila, { 'Estado': 'Problema', 'Motivo': motivo, 'Problema': texto || motivo });
    } else if (tipo === 'devuelto') {
      if (r.Estado !== 'Problema') throw new Error(cambio);
      escribir_(sh, r._fila, { 'Estado': 'Devuelto', 'Hora devuelto': ahora_() });
    } else if (tipo === 'editar') {
      if (r.Estado !== 'Empacado') throw new Error('Solo se puede editar un pedido que todavía está empacado');
      const datos = validarPedido_(d);
      // Si no cambia el día, se conserva la fecha original (evita mover un pedido de mañana a hoy sin querer)
      if ((d.dia === 'Mañana') === (dia_(r) > hoy)) datos['Entregar el día'] = dia_(r);
      escribir_(sh, r._fila, datos);
    } else if (tipo === 'cancelar') {
      if (ABIERTOS.indexOf(r.Estado) < 0) throw new Error(cambio);
      const motivo = limpiar_(d.motivo, 40), texto = limpiar_(d.texto, 300);
      if (CONFIG.MOTIVOS_CANCELAR.indexOf(motivo) < 0) throw new Error('Elige por qué se cancela');
      if (motivo === 'Otro' && !texto) throw new Error('Cuéntanos por qué se cancela, aunque sea corto');
      escribir_(sh, r._fila, { 'Estado': 'Cancelado', 'Problema': 'Cancelado: ' + (texto || motivo), 'Hora cancelado': ahora_() });
    } else if (tipo === 'reasignar') {
      if (ABIERTOS.indexOf(r.Estado) < 0) throw new Error(cambio);
      if (cours_().indexOf(d.cour) < 0) throw new Error('Domiciliario no válido');
      escribir_(sh, r._fila, { 'Domiciliario': d.cour });
    } else {
      throw new Error('Acción no válida');
    }
    return estado_(u);
  });
}

// El mensajero sale con todos sus pedidos listos usando UNA sola foto del conjunto
function iniciarEntrega(a, foto) {
  const u = auth_(a, ['Domiciliario']);
  if (!fotoValida_(foto)) throw new Error('Falta la foto de los pedidos');
  return conLock_(function () {
    const sh = hoja_(PEDIDOS, COLS_PEDIDOS), hoy = hoy_();
    const lista = leer_(sh, 600).filter(function (r) {
      return esPedido_(r) && r.Domiciliario === u.nombre && r.Estado === 'Empacado' && dia_(r) <= hoy;
    });
    if (!lista.length) throw new Error('No tienes pedidos listos para salir. Actualiza la pantalla.');
    const hora = ahora_();
    lista.forEach(function (r) {
      const cam = { 'Estado': 'En entrega', 'Hora salida': hora, 'Foto salida': foto };
      if (r['Hora creado'] && dia_(r) === r.Fecha) cam['Min en local'] = minutosDesde_(r['Hora creado']);
      escribir_(sh, r._fila, cam);
    });
    return estado_(u);
  });
}

// El cierre suma todo lo entregado que todavía no entró en ningún cierre.
// Los pedidos agendados para otro día no bloquean el cierre de hoy.
function hacerCierre(a, foto) {
  const u = auth_(a, ['Domiciliario']);
  const nombre = u.nombre;
  const res = conLock_(function () {
    const hoy = hoy_();
    const todos = leer_(hoja_(PEDIDOS, COLS_PEDIDOS), 600).filter(esPedido_).filter(function (r) { return r.Domiciliario === nombre; });
    const vencidos = todos.filter(function (r) { return ABIERTOS.indexOf(r.Estado) >= 0 && dia_(r) <= hoy; });
    if (vencidos.length) throw new Error('Antes del cierre, termina tus ' + vencidos.length + ' pedidos pendientes');
    const shP = hoja_(PEDIDOS, COLS_PEDIDOS), shC = hoja_(CIERRES, COLS_CIERRES);
    const pend = todos.filter(function (r) { return r.Estado === 'Entregado' && !r['Cerrado en']; });
    const yaHoy = leer_(shC, 100).some(function (r) { return r.Fecha === hoy && r.Domiciliario === nombre; });
    const huboHoy = todos.some(function (r) { return r.Estado !== 'Cancelado' && (dia_(r) === hoy || diaDe_(r['Hora entrega']) === hoy); });
    if (!pend.length && yaHoy) throw new Error('Ya hiciste el cierre de hoy');
    if (!pend.length && !huboHoy) throw new Error('No tienes pedidos para cerrar');
    const k = calcular_(pend);
    if (k.neto > 0 && !fotoValida_(foto)) throw new Error('Sube la foto de la consignación para poder cerrar');
    const hora = ahora_();
    agregar_(shC, {
      'Fecha': hoy, 'Domiciliario': nombre, 'Pedidos': k.n, 'Efectivo recibido': k.efectivo, 'Pago domiciliario': k.pago,
      'Neto': k.neto, 'Foto consignación': k.neto > 0 ? foto : '', 'Hora del cierre': hora
    });
    pend.forEach(function (r) { escribir_(shP, r._fila, { 'Cerrado en': hora }); });
    return estado_(u);
  });
  try { cierreCompleto_(); } catch (e) { Logger.log('Resumen no enviado: ' + e); }
  return res;
}

/* ---------- Pantalla del Administrador / jefe (solo lectura; internamente rol 'Lider') ---------- */

function diaAtras_(n) { return Utilities.formatDate(new Date(Date.now() - n * 864e5), TZ, 'yyyy-MM-dd'); }

function panel_(hoy) {
  const todos = leer_(hoja_(PEDIDOS, COLS_PEDIDOS), 600).filter(esPedido_);
  const cierres = leer_(hoja_(CIERRES, COLS_CIERRES), 300);
  const entHoy = todos.filter(function (r) { return r.Estado === 'Entregado' && diaDe_(r['Hora entrega']) === hoy; });
  const suma = function (l, f) { return l.reduce(function (a, r) { return a + (Number(r[f]) || 0); }, 0); };
  // Ventas = lo que se vendió en productos, SIN el valor del domicilio (el valor del pedido incluye el domi)
  const ventasDe = function (l) { return l.reduce(function (a, r) { const v = Number(r['Valor del pedido']) || 0; return v > 0 ? a + Math.max(0, v - (Number(r['Valor domi']) || 0)) : a; }, 0); };
  const yaPagados = function (l) { return l.filter(function (r) { return !(Number(r['Valor del pedido']) > 0); }).length; };
  const porPago = function (t) { return suma(entHoy.filter(function (r) { return r['Forma de pago'] === t; }), 'Valor del pedido'); };
  const hoyKpi = {
    entregados: entHoy.length, ventas: ventasDe(entHoy), cobrado: suma(entHoy, 'Valor del pedido'), yaPagados: yaPagados(entHoy),
    efectivo: porPago('Efectivo'), transferencia: porPago('Transferencia'), domis: suma(entHoy, 'Valor domi'),
    problemas: todos.filter(function (r) { return (r.Estado === 'Problema' || r.Estado === 'Devuelto') && (dia_(r) === hoy || diaDe_(r['Hora salida']) === hoy); }).length,
    enCalle: todos.filter(function (r) { return r.Estado === 'En entrega'; }).length,
    porEntregar: todos.filter(function (r) { return r.Estado === 'Empacado' && dia_(r) <= hoy; }).length
  };
  const mens = cours_().map(function (c) {
    const mios = todos.filter(function (r) { return r.Domiciliario === c; });
    const ent = mios.filter(function (r) { return r.Estado === 'Entregado' && (diaDe_(r['Cerrado en']) === hoy || (!r['Cerrado en'] && diaDe_(r['Hora entrega']) === hoy)); });
    const k = calcular_(ent);
    const cz = cierres.filter(function (x) { return x.Fecha === hoy && x.Domiciliario === c; });
    const sinCerrar = mios.filter(function (r) { return r.Estado === 'Entregado' && !r['Cerrado en']; }).length;
    const abiertos = mios.filter(function (r) { return ABIERTOS.indexOf(r.Estado) >= 0 && dia_(r) <= hoy; }).length;
    const foto = cz.map(function (x) { return x['Foto consignación']; }).filter(Boolean)[0] || '';
    return { nombre: c, entregados: k.n, efectivo: k.efectivo, pago: k.pago, neto: k.neto,
      cerrado: cz.length > 0 && sinCerrar === 0, sinCerrar: sinCerrar, abiertos: abiertos, foto: foto };
  });
  const dias = [];
  for (let i = 0; i < 10; i++) {
    const d = diaAtras_(i);
    const e = todos.filter(function (r) { return r.Estado === 'Entregado' && diaDe_(r['Hora entrega']) === d; });
    dias.push({ dia: d, entregados: e.length, ventas: ventasDe(e), domis: suma(e, 'Valor domi'),
      problemas: todos.filter(function (r) { return (r.Estado === 'Problema' || r.Estado === 'Devuelto') && dia_(r) === d; }).length });
  }
  const desde = diaAtras_(9);
  const historial = todos.filter(function (r) { return dia_(r) >= desde || diaDe_(r['Hora entrega']) >= desde; }).sort(function (a, b) {
    return String(dia_(b)) === String(dia_(a)) ? (Number(b['Número']) || 0) - (Number(a['Número']) || 0) : (String(dia_(b)) > String(dia_(a)) ? 1 : -1);
  }).map(pub_);
  return { hoy: hoyKpi, mensajeros: mens, dias: dias, historial: historial };
}

/* ---------- Correos ---------- */

function estadoDia_() {
  const hoy = hoy_();
  const todos = leer_(hoja_(PEDIDOS, COLS_PEDIDOS), 600).filter(esPedido_);
  const cierres = leer_(hoja_(CIERRES, COLS_CIERRES), 100).filter(function (r) { return r.Fecha === hoy; });
  const activos = cours_().filter(function (c) {
    return todos.some(function (r) { return r.Domiciliario === c && r.Estado !== 'Cancelado' && (dia_(r) === hoy || diaDe_(r['Hora entrega']) === hoy); }) ||
      cierres.some(function (x) { return x.Domiciliario === c; });
  });
  const sinCierre = activos.filter(function (c) {
    return !cierres.some(function (x) { return x.Domiciliario === c; }) ||
      todos.some(function (r) { return r.Domiciliario === c && r.Estado === 'Entregado' && !r['Cerrado en']; });
  });
  const abiertos = todos.filter(function (r) { return ABIERTOS.indexOf(r.Estado) >= 0 && dia_(r) <= hoy; });
  return { hoy: hoy, todos: todos, cierres: cierres, activos: activos, sinCierre: sinCierre, abiertos: abiertos };
}

function miles_(n) { return String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

// Mismo formato del cierre que hoy se manda por WhatsApp
function textoResumen_() {
  const e = estadoDia_(), hoy = e.hoy;
  const L = ['Cierre domis ' + hoy];
  let totalDomis = 0;
  e.activos.forEach(function (c) {
    const mios = e.todos.filter(function (r) { return r.Domiciliario === c; });
    // Lo que entra en el cierre de hoy: cerrado hoy, o entregado hoy y todavía sin cerrar
    const ent = mios.filter(function (r) {
      return r.Estado === 'Entregado' && (diaDe_(r['Cerrado en']) === hoy || (!r['Cerrado en'] && diaDe_(r['Hora entrega']) === hoy));
    }).sort(function (a, b) { return String(a['Hora entrega']) < String(b['Hora entrega']) ? -1 : 1; });
    const k = calcular_(ent);
    totalDomis += k.pago;
    const sinCerrar = ent.filter(function (r) { return !r['Cerrado en']; }).length;
    const abiertos = mios.filter(function (r) { return ABIERTOS.indexOf(r.Estado) >= 0 && dia_(r) <= hoy; }).length;
    const prob = mios.filter(function (r) { return (r.Estado === 'Problema' || r.Estado === 'Devuelto') && (dia_(r) === hoy || diaDe_(r['Hora salida']) === hoy); });
    const cz = e.cierres.filter(function (x) { return x.Domiciliario === c; });
    L.push('', '--- ' + c + ' ---');
    ent.forEach(function (r, i) {
      const previo = diaDe_(r['Hora entrega']) !== hoy ? ' (entregado el ' + diaDe_(r['Hora entrega']) + ')' : '';
      const nota = r.Notas ? ' (' + r.Notas + ')' : '';
      const pago = r['Forma de pago'] === 'Efectivo' ? 'Efectivo' : (r['Forma de pago'] === 'Transferencia' ? 'Transferencia' : 'Ya pagado');
      L.push((i + 1) + '. ' + miles_(r['Valor domi']) + nota + previo, ' ' + pago + ': ' + miles_(r['Valor del pedido']));
    });
    L.push('', 'Total domis: ' + miles_(k.pago));
    L.push('Efectivo: ' + miles_(k.efectivo) + ' - ' + miles_(k.pago) + ' = ' + (k.neto < 0 ? '-' : '') + miles_(k.neto));
    L.push(k.neto >= 0 ? 'Debe consignar: ' + miles_(k.neto) : 'HAY QUE CONSIGNARLE: ' + miles_(-k.neto));
    cz.forEach(function (x) { if (x['Foto consignación']) L.push('Comprobante: ' + x['Foto consignación']); });
    if (k.neto > 0 && !cz.some(function (x) { return x['Foto consignación']; })) L.push('Comprobante: PENDIENTE');
    if (!cz.length) L.push('Cierre: SIN HACER');
    else if (sinCerrar || abiertos) L.push('Ojo: ' + (sinCerrar ? sinCerrar + ' entregas sin cerrar. ' : '') + (abiertos ? abiertos + ' pedidos sin terminar.' : ''));
    prob.forEach(function (r) { L.push('Novedad #' + r['Número'] + ' ' + r.Cliente + ': ' + [r.Motivo, (r.Problema && r.Problema !== r.Motivo ? r.Problema : '')].filter(Boolean).join('. ') + ' (' + r.Estado + ')'); });
  });
  L.push('', 'Total domis del día: ' + miles_(totalDomis));
  return L.join('\n');
}

function enviarResumen_() {
  MailApp.sendEmail(CONFIG.CORREO_LIDER, 'Orderapp · Cierre de domicilios ' + hoy_(), textoResumen_());
}

function enviarResumenAhora(a) {
  const u = auth_(a, ['Admin', 'Lider']);
  enviarResumen_();
  return estado_(u);
}

// Se manda solo cuando todos los domiciliarios que trabajaron hoy ya hicieron su cierre
function cierreCompleto_() {
  const props = PropertiesService.getScriptProperties();
  const e = estadoDia_();
  if (props.getProperty('resumen_' + e.hoy)) return;
  if (e.activos.length && !e.sinCierre.length && !e.abiertos.length) {
    enviarResumen_();
    props.setProperty('resumen_' + e.hoy, '1');
  }
}

// Corre cada 15 minutos
function revisarEstancados() {
  const sh = hoja_(PEDIDOS, COLS_PEDIDOS);
  const ahora = Date.now(), lista = [];
  leer_(sh, 300).filter(function (r) { return esPedido_(r) && r.Estado === 'En entrega' && !r['Alerta enviada']; }).forEach(function (r) {
    const t = Date.parse(r['Hora salida']);
    if (!t) return;
    const min = Math.round((ahora - t) / 60000);
    if (min > (CONFIG.LIMITE_MIN[r.Municipio] || 180)) {
      lista.push('#' + r['Número'] + ' ' + r.Cliente + ' (' + r.Municipio + ') lleva ' + min + ' min en la calle con ' + r.Domiciliario + '. Celular del cliente: ' + r.Celular);
      escribir_(sh, r._fila, { 'Alerta enviada': ahora_() });
    }
  });
  if (lista.length) {
    MailApp.sendEmail(CONFIG.CORREO_ADMIN, 'Orderapp · Pedidos que se están demorando (' + lista.length + ')', lista.join('\n'));
  }
}

// Corre todos los dias a las 10 pm
function revisarCierres10pm() {
  const e = estadoDia_();
  if (!e.sinCierre.length && !e.abiertos.length) return;
  const L = ['Son las 10 pm y el día de domicilios no está cerrado.'];
  if (e.sinCierre.length) L.push('Sin hacer el cierre: ' + e.sinCierre.join(', '));
  e.abiertos.forEach(function (r) { L.push('Pedido sin terminar: #' + r['Número'] + ' ' + r.Cliente + ' (' + r.Domiciliario + ', ' + r.Estado + ')'); });
  MailApp.sendEmail(CONFIG.CORREO_ADMIN, 'Orderapp · Falta cerrar los domicilios de hoy', L.join('\n'));
}

/* ---------- Hoja "Piloto": las 5 preguntas ---------- */

function letra_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function rng_(nombre, hoja) {
  const h = hoja || PEDIDOS;
  const sh = SpreadsheetApp.getActive().getSheetByName(h);
  const i = encabezados_(sh).indexOf(nombre);
  if (i < 0) throw new Error('Falta la columna ' + nombre + ' en ' + h + '. Corre setup().');
  const L = letra_(i + 1);
  return h + '!$' + L + '$2:$' + L + '$3000';
}

// Devuelve las filas de la hoja Piloto. Cada fila: { tipo, k, a, b, f, fmt, n }
// tipo: 'tit' (pregunta), 'f' (fórmula), 'in' (celda que escribes tú)
function filasPiloto_() {
  const P = function (n) { return rng_(n); }, C = function (n) { return rng_(n, CIERRES); };
  const est = P('Estado'), A = CONFIG.ANTES;
  const prob = 'COUNTIF(' + est + ',"Problema")+COUNTIF(' + est + ',"Devuelto")';
  const filas = [
    { tipo: 'tit', a: '1. ¿Cuánto se demora un pedido, desde que se crea hasta que se entrega?', b: A.tiempo },
    { tipo: 'f', a: 'Horas promedio desde que se crea hasta que se entrega', f: '=IFERROR(AVERAGE(' + P('Horas totales') + '),"")', fmt: '0.0', n: 'Incluye pedidos agendados para otro día.' },
    { tipo: 'f', a: 'Minutos promedio en la calle (de que sale a que entrega)', f: '=IFERROR(AVERAGE(' + P('Min en calle') + '),"")', fmt: '0', n: 'Este es el número más justo para comparar.' },
    { tipo: 'f', a: 'Minutos promedio en el local (solo pedidos del mismo día)', f: '=IFERROR(AVERAGE(' + P('Min en local') + '),"")', fmt: '0', n: 'Desde que se crea hasta que sale.' },
    { tipo: 'f', a: '% entregados en la fecha y hora prometida', f: '=IFERROR(COUNTIF(' + P('Entregó a tiempo') + ',"Sí")/(COUNTIF(' + P('Entregó a tiempo') + ',"Sí")+COUNTIF(' + P('Entregó a tiempo') + ',"No")),"")', fmt: '0%', n: 'Usa "Entregar el día" y "Antes de".' },

    { tipo: 'tit', a: '2. ¿Cuántos pedidos fallan y por qué?', b: A.fallas },
    { tipo: 'f', k: 'reg', a: 'Pedidos registrados', f: '=SUMPRODUCT(--(LEN(' + P('ID') + ')>0))', fmt: '0' },
    { tipo: 'f', a: 'Entregados', f: '=COUNTIF(' + est + ',"Entregado")', fmt: '0' },
    { tipo: 'f', a: 'Con problema o devueltos', f: '=' + prob, fmt: '0' },
    { tipo: 'f', a: '% con problema', f: '=IFERROR((' + prob + ')/(COUNTIF(' + est + ',"Entregado")+' + prob + '),"")', fmt: '0.0%', n: 'Sobre los pedidos que ya terminaron.' }
  ];
  CONFIG.MOTIVOS.forEach(function (m) {
    filas.push({ tipo: 'f', a: 'Motivo: ' + m, f: '=COUNTIF(' + P('Motivo') + ',"' + m + '")', fmt: '0' });
  });
  filas.push(
    { tipo: 'tit', a: '3. ¿Cuadra lo que debía consignarse con lo que entró al banco?', b: A.plata },
    { tipo: 'f', a: 'Efectivo que recibieron los domiciliarios (entregas)', f: '=SUMIFS(' + P('Valor del pedido') + ',' + est + ',"Entregado",' + P('Forma de pago') + ',"Efectivo")', fmt: '#,##0' },
    { tipo: 'f', a: 'Pago de domicilios (entregados)', f: '=SUMIFS(' + P('Valor domi') + ',' + est + ',"Entregado")', fmt: '#,##0' },
    { tipo: 'f', k: 'debian', a: 'Los domiciliarios debían consignar (según los cierres)', f: '=SUMIF(' + C('Neto') + ',">0")', fmt: '#,##0' },
    { tipo: 'f', a: 'La empresa debía consignarles a ellos (según los cierres)', f: '=-SUMIF(' + C('Neto') + ',"<0")', fmt: '#,##0' },
    { tipo: 'in', k: 'banco', a: 'Lo que entró al banco por consignaciones (escríbelo tú)', fmt: '#,##0' },
    { tipo: 'f', a: 'Diferencia contra el banco', f: '=IF({banco}="","",{banco}-{debian})', fmt: '#,##0', n: 'Si da 0, cuadra.' },

    { tipo: 'tit', a: '4. ¿Cuánto trabajo da y cuánto ahorra?', b: A.trabajo },
    { tipo: 'in', a: 'Minutos que tomaba el cierre antes de la app', fmt: '0' },
    { tipo: 'in', a: 'Minutos que toma el cierre ahora', fmt: '0' },
    { tipo: 'in', a: 'Minutos que toma registrar un pedido (cronométralo)', fmt: '0' },
    { tipo: 'in', k: 'wa', a: 'Domicilios según tu cierre de WhatsApp (escríbelo tú)', fmt: '0' },
    { tipo: 'f', a: '% de domicilios que quedaron registrados en la app', f: '=IFERROR({reg}/{wa},"")', fmt: '0%', n: 'Debería estar cerca de 100%.' },

    { tipo: 'tit', a: '5. ¿Quieren seguir usándola y qué dato quiere ver el Administrador cada semana?', b: A.decision },
    { tipo: 'in', a: '¿El Colaborador quiere seguir usándola? Por qué' },
    { tipo: 'in', a: '¿Los Mensajeros quieren seguir usándola? Por qué' },
    { tipo: 'in', a: '¿Qué dato quiere ver el Administrador cada semana, y cuánto pagaría?' }
  );
  return filas;
}

function crearPiloto() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(PILOTO);
  const nueva = !sh;
  if (!sh) sh = ss.insertSheet(PILOTO);
  const filas = filasPiloto_();
  const filaDe = {};
  filas.forEach(function (f, i) { if (f.k) filaDe[f.k] = i + 2; });
  sh.getRange(1, 1, 1, 4).setValues([['Pregunta del piloto', 'Antes (tu estimación)', 'Durante el piloto', 'Nota']])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#000000');
  filas.forEach(function (f, i) {
    const r = i + 2;
    sh.getRange(r, 1).setValue(f.a);
    if (f.tipo === 'tit') {
      sh.getRange(r, 2).setValue(f.b || '');
      sh.getRange(r, 1, 1, 4).setFontWeight('bold').setBackground('#f2c200');
      return;
    }
    if (f.n) sh.getRange(r, 4).setValue(f.n);
    const c = sh.getRange(r, 3);
    if (f.fmt) c.setNumberFormat(f.fmt);
    if (f.tipo === 'f') {
      c.setFormula(f.f.replace(/\{(\w+)\}/g, function (_, k) { return 'C' + filaDe[k]; }));
    } else {
      c.setBackground('#fff2cc');
      // No borra lo que ya escribiste si vuelves a correr crearPiloto()
    }
  });
  sh.setColumnWidth(1, 430); sh.setColumnWidth(2, 260); sh.setColumnWidth(3, 170); sh.setColumnWidth(4, 260);
  sh.setFrozenRows(1);
  if (nueva) Logger.log('Hoja Piloto creada.');
}

/* ---------- Preparación (se corre desde el editor; se puede repetir sin perder datos) ---------- */

function instalarAlertas() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === 'revisarEstancados' || f === 'revisarCierres10pm') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('revisarEstancados').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('revisarCierres10pm').timeBased().atHour(22).everyDays(1).inTimezone(TZ).create();
}

function asegurarColumnas_(sh, cols) {
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, cols.length).setValues([cols]); return; }
  const actuales = encabezados_(sh);
  cols.forEach(function (c) {
    if (actuales.indexOf(c) < 0) {
      const celda = sh.getRange(1, actuales.length + 1);
      celda.setValue(c).setFontColor('#ffffff').setBackground('#000000').setFontWeight('bold');
      actuales.push(c);
    }
  });
}

function formatoColumnas_(sh) {
  const head = encabezados_(sh);
  const filas = Math.max(sh.getMaxRows() - 1, 1);
  head.forEach(function (h, j) {
    if (h) sh.getRange(2, j + 1, filas, 1).setNumberFormat(NUM_FMT[h] || '@');
  });
}

function prepararUsuarios_() {
  const sh = hoja_(USUARIOS, COLS_USUARIOS);
  asegurarColumnas_(sh, COLS_USUARIOS);
  let head = encabezados_(sh);
  const iN = head.indexOf('Nombre') + 1, iR = head.indexOf('Rol') + 1, iP = head.indexOf('PIN') + 1;
  sh.getRange(2, iP, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  if (sh.getLastRow() < 2 || !sh.getRange(2, iN).getValue()) {
    CONFIG.USUARIOS_INICIALES.forEach(function (u, i) {
      sh.getRange(i + 2, iN).setValue(u[0]);
      sh.getRange(i + 2, iR).setValue(u[1]);
    });
  }
  const ult = sh.getLastRow();
  const usados = {};
  for (let f = 2; f <= ult; f++) {
    const p = String(sh.getRange(f, iP).getValue() || '').trim();
    if (p) usados[p] = true;
  }
  for (let f = 2; f <= ult; f++) {
    if (!String(sh.getRange(f, iN).getValue() || '').trim()) continue;
    if (String(sh.getRange(f, iP).getValue() || '').trim()) continue;
    let pin;
    if (CONFIG.MOSTRAR_ACCESOS) pin = '1234'; // modo prueba: todos entran con 1234
    else { do { pin = String(Math.floor(1000 + Math.random() * 9000)); } while (usados[pin]); }
    usados[pin] = true;
    sh.getRange(f, iP).setNumberFormat('@').setValue(pin);
  }
}

function setup() {
  const shP = hoja_(PEDIDOS, COLS_PEDIDOS);
  asegurarColumnas_(shP, COLS_PEDIDOS);
  const shC = hoja_(CIERRES, COLS_CIERRES);
  asegurarColumnas_(shC, COLS_CIERRES);
  [shP, shC].forEach(formatoColumnas_);
  prepararUsuarios_();
  CacheService.getScriptCache().remove('usuarios');
  // Borra la fila de ejemplo
  const idCol = encabezados_(shP).indexOf('ID') + 1;
  for (let f = 2; f <= shP.getLastRow(); f++) {
    if (String(shP.getRange(f, idCol).getValue()).indexOf('ejemplo') === 0) shP.getRange(f, 1, 1, shP.getLastColumn()).clearContent();
  }
  carpeta_();
  instalarAlertas();
  crearPiloto();
  Logger.log('Listo: hojas preparadas, PIN creado para cada persona (pestaña Usuarios), carpeta de fotos, alertas y hoja Piloto.');
}
