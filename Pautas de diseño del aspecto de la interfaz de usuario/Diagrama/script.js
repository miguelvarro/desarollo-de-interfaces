document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('stage');
  const tools = document.querySelectorAll('.tool');
  const saveBtn = document.getElementById('saveBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadInput = document.getElementById('uploadInput');
  const toggleRouteBtn = document.getElementById('toggleRouteBtn');

  const stageInner = document.createElement('div');
  stageInner.classList.add('stage-inner');
  stage.appendChild(stageInner);

  let modoFlechaActivo = false;
  let tipoFlecha = 'simple';   
  let rutaFlecha = 'recta';    

  let formaInicioSeleccionada = null;
  let formaFinSeleccionada = null;

  let flechas = [];
  let contadorFormas = 0;

  // Pan/zoom
  let stageScale = 1;
  let stageOffsetX = 0;
  let stageOffsetY = 0;
  const stageMinScale = 0.2;
  const stageMaxScale = 3;

  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartOffsetX = 0;
  let panStartOffsetY = 0;

  // selección
  let elementoSeleccionado = null;

  function updateStageTransform() {
    stageInner.style.transform = `translate(${stageOffsetX}px, ${stageOffsetY}px) scale(${stageScale})`;
  }

  function generarIdForma() {
    return `forma-${++contadorFormas}`;
  }

  function limpiarSeleccion() {
    stageInner.querySelectorAll('.shape.selected, .arrow.selected')
      .forEach(el => el.classList.remove('selected'));
  }

  function setModoFlecha(on, tipo = 'simple') {
    modoFlechaActivo = on;
    tipoFlecha = tipo;
    stage.style.cursor = on ? 'crosshair' : 'grab';

    formaInicioSeleccionada = null;
    formaFinSeleccionada = null;
    stageInner.querySelectorAll('.shape').forEach(s => s.classList.remove('selected'));
  }

  /* ===== Tools ===== */
  tools.forEach(tool => {
    tool.addEventListener('dragstart', (e) => {
      const shape = tool.dataset.shape;
      const isShape =
        ['rectangle','pill','circle','diamond','parallelogram','note','cloud','hex','star'].includes(shape);
      if (isShape) {
        e.dataTransfer.setData('text/plain', shape);
        e.dataTransfer.effectAllowed = 'copy';
      }
    });

    tool.addEventListener('click', () => {
      tools.forEach(t => t.classList.remove('active'));
      const shapeType = tool.dataset.shape;

      if (shapeType === 'arrow' || shapeType === 'bidirectional') {
        tool.classList.add('active');
        setModoFlecha(true, shapeType === 'bidirectional' ? 'doble' : 'simple');
      } else {
        setModoFlecha(false);
      }
    });
  });

  toggleRouteBtn.addEventListener('click', () => {
    rutaFlecha = (rutaFlecha === 'recta') ? 'elbow' : 'recta';
    toggleRouteBtn.textContent = `Ruta: ${rutaFlecha === 'recta' ? 'recta' : 'ortogonal'}`;    
    flechas.forEach(f => actualizarFlecha(f));
  });

  /* ===== Click stage: seleccionar / conectar ===== */
  stage.addEventListener('click', (e) => {
    const formaClicada = e.target.closest('.shape');
    const flechaClicada = e.target.closest('.arrow');

    if (modoFlechaActivo) {
      if (!formaClicada) return;

      if (!formaInicioSeleccionada) {
        formaInicioSeleccionada = formaClicada;
        formaClicada.classList.add('selected');
        return;
      }

      if (formaClicada === formaInicioSeleccionada) return;

      formaFinSeleccionada = formaClicada;
      formaClicada.classList.add('selected');

      crearFlecha(formaInicioSeleccionada, formaFinSeleccionada, tipoFlecha, rutaFlecha);

      formaInicioSeleccionada.classList.remove('selected');
      formaFinSeleccionada.classList.remove('selected');
      formaInicioSeleccionada = null;
      formaFinSeleccionada = null;

      
      return;
    }

    limpiarSeleccion();
    if (formaClicada) {
      elementoSeleccionado = formaClicada;
      formaClicada.classList.add('selected');
    } else if (flechaClicada) {
      elementoSeleccionado = flechaClicada;
      flechaClicada.classList.add('selected');
    } else {
      elementoSeleccionado = null;
    }
  });

  /* ===== ESC para salir modo flecha ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      tools.forEach(t => t.classList.remove('active'));
      setModoFlecha(false);
      return;
    }

    if (e.key !== 'Delete') return;
    if (!elementoSeleccionado) return;

    if (elementoSeleccionado.classList.contains('arrow')) {
      const obj = flechas.find(f => f.el === elementoSeleccionado);
      if (obj) eliminarFlecha(obj);
      elementoSeleccionado = null;
      return;
    }

    if (elementoSeleccionado.classList.contains('shape')) {
      const relacionadas = flechas.filter(f =>
        f.inicio === elementoSeleccionado || f.fin === elementoSeleccionado
      );
      relacionadas.forEach(eliminarFlecha);
      elementoSeleccionado.remove();
      elementoSeleccionado = null;
    }
  });

  /* ===== Arrow geometry helpers ===== */
  function puntoEnBorde(cx, cy, rectWidth, rectHeight, tx, ty) {
    const dx = tx - cx;
    const dy = ty - cy;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx === 0 && absDy === 0) return { x: cx, y: cy };

    const halfW = rectWidth / 2;
    const halfH = rectHeight / 2;

    const scale = 1 / Math.max(absDx / halfW, absDy / halfH);
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  function getCentroEnMundo(el) {
    const rect = el.getBoundingClientRect();
    const rectStage = stage.getBoundingClientRect();

    const centroScreenX = rect.left + rect.width / 2 - rectStage.left;
    const centroScreenY = rect.top + rect.height / 2 - rectStage.top;

    return {
      x: (centroScreenX - stageOffsetX) / stageScale,
      y: (centroScreenY - stageOffsetY) / stageScale,
      w: rect.width / stageScale,
      h: rect.height / stageScale
    };
  }

  /* ===== Create arrows ===== */
  function crearFlecha(formaInicio, formaFin, tipo = 'simple', ruta = 'recta') {
    const el = document.createElement('div');
    el.classList.add('arrow');
    if (tipo === 'doble') el.classList.add('arrow-double');

    
    if (ruta === 'recta') {
      const line = document.createElement('div');
      line.classList.add('arrow-line');
      el.appendChild(line);
    } else {
      el.classList.add('elbow');
      const seg1 = document.createElement('div');
      seg1.classList.add('seg', 'seg1');
      const seg2 = document.createElement('div');
      seg2.classList.add('seg', 'seg2');
      el.appendChild(seg1);
      el.appendChild(seg2);
    }

    stageInner.appendChild(el);

    const obj = {
      el,
      inicio: formaInicio,
      fin: formaFin,
      tipo,
      ruta,
      mover: null
    };

    const mover = () => actualizarFlecha(obj);
    obj.mover = mover;

    flechas.push(obj);

    formaInicio.manejadoresMovimiento = formaInicio.manejadoresMovimiento || [];
    formaFin.manejadoresMovimiento = formaFin.manejadoresMovimiento || [];
    formaInicio.manejadoresMovimiento.push(mover);
    formaFin.manejadoresMovimiento.push(mover);

    actualizarFlecha(obj);
  }

  function actualizarFlecha(obj) {
    obj.ruta = rutaFlecha; // ruta actual global
    obj.el.classList.toggle('elbow', obj.ruta === 'elbow');

    // si cambia ruta, reconstruimos DOM interno (simple y robusto)
    obj.el.innerHTML = '';
    if (obj.tipo === 'doble') obj.el.classList.add('arrow-double');
    else obj.el.classList.remove('arrow-double');

    if (obj.ruta === 'recta') {
      const line = document.createElement('div');
      line.classList.add('arrow-line');
      obj.el.appendChild(line);
      actualizarFlechaRecta(obj);
    } else {
      const seg1 = document.createElement('div');
      seg1.classList.add('seg', 'seg1');
      const seg2 = document.createElement('div');
      seg2.classList.add('seg', 'seg2');
      obj.el.appendChild(seg1);
      obj.el.appendChild(seg2);
      actualizarFlechaElbow(obj, seg1, seg2);
    }
  }

  function actualizarFlechaRecta(obj) {
    const a = getCentroEnMundo(obj.inicio);
    const b = getCentroEnMundo(obj.fin);

    const bordeA = puntoEnBorde(a.x, a.y, a.w, a.h, b.x, b.y);
    const bordeB = puntoEnBorde(b.x, b.y, b.w, b.h, a.x, a.y);

    const dx = bordeB.x - bordeA.x;
    const dy = bordeB.y - bordeA.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ang = Math.atan2(dy, dx);

    obj.el.style.left = `${bordeA.x}px`;
    obj.el.style.top = `${bordeA.y}px`;
    obj.el.style.width = `${len}px`;
    obj.el.style.height = `0px`;
    obj.el.style.transform = `rotate(${ang}rad)`;

    const line = obj.el.querySelector('.arrow-line');
    line.style.width = `${len}px`;
  }

  function actualizarFlechaElbow(obj, seg1, seg2) {
    const a = getCentroEnMundo(obj.inicio);
    const b = getCentroEnMundo(obj.fin);

    const bordeA = puntoEnBorde(a.x, a.y, a.w, a.h, b.x, b.y);
    const bordeB = puntoEnBorde(b.x, b.y, b.w, b.h, a.x, a.y);

   
    const dx = bordeB.x - bordeA.x;
    const dy = bordeB.y - bordeA.y;

    const goHorizontalFirst = Math.abs(dx) > Math.abs(dy);
    const mid = goHorizontalFirst
      ? { x: bordeB.x, y: bordeA.y }
      : { x: bordeA.x, y: bordeB.y };

    
    obj.el.style.left = `0px`;
    obj.el.style.top = `0px`;
    obj.el.style.width = `0px`;
    obj.el.style.height = `0px`;
    obj.el.style.transform = `none`;

    
    const s1x = bordeA.x;
    const s1y = bordeA.y;
    const s1w = Math.max(0, Math.hypot(mid.x - bordeA.x, mid.y - bordeA.y));
    const s1ang = Math.atan2(mid.y - bordeA.y, mid.x - bordeA.x);

    seg1.style.left = `${s1x}px`;
    seg1.style.top = `${s1y}px`;
    seg1.style.width = `${s1w}px`;
    seg1.style.transformOrigin = `0 50%`;
    seg1.style.transform = `rotate(${s1ang}rad)`;

    
    const s2x = mid.x;
    const s2y = mid.y;
    const s2w = Math.max(0, Math.hypot(bordeB.x - mid.x, bordeB.y - mid.y));
    const s2ang = Math.atan2(bordeB.y - mid.y, bordeB.x - mid.x);

    seg2.style.left = `${s2x}px`;
    seg2.style.top = `${s2y}px`;
    seg2.style.width = `${s2w}px`;
    seg2.style.transformOrigin = `0 50%`;
    seg2.style.transform = `rotate(${s2ang}rad)`;
  }

  function eliminarFlecha(obj) {
    const { el, inicio, fin, mover } = obj;
    el.remove();

    if (inicio.manejadoresMovimiento) {
      inicio.manejadoresMovimiento = inicio.manejadoresMovimiento.filter(fn => fn !== mover);
    }
    if (fin.manejadoresMovimiento) {
      fin.manejadoresMovimiento = fin.manejadoresMovimiento.filter(fn => fn !== mover);
    }

    flechas = flechas.filter(f => f !== obj);
  }

  /* ===== Drop shapes ===== */
  stage.addEventListener('dragover', (e) => e.preventDefault());

  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    if (modoFlechaActivo) return;

    const tipoForma = e.dataTransfer.getData('text/plain');
    if (!tipoForma) return;

    const rectStage = stage.getBoundingClientRect();
    const sx = e.clientX - rectStage.left;
    const sy = e.clientY - rectStage.top;

    const worldX = (sx - stageOffsetX) / stageScale;
    const worldY = (sy - stageOffsetY) / stageScale;

    const forma = document.createElement('div');
    forma.id = generarIdForma();
    forma.classList.add('shape', tipoForma);

    
    forma.style.left = `${worldX - 95}px`;
    forma.style.top = `${worldY - 40}px`;
    forma.contentEditable = 'false';

    
    if (tipoForma === 'parallelogram') {
      const span = document.createElement('span');
      span.textContent = '';
      forma.appendChild(span);
    }

    stageInner.appendChild(forma);
    hacerArrastrable(forma);
    prepararEdicionTexto(forma);
  });

  function prepararEdicionTexto(forma) {
    forma.addEventListener('dblclick', () => {
      forma.contentEditable = 'true';
      forma.focus();
    });
    forma.addEventListener('blur', () => {
      forma.contentEditable = 'false';
    });
  }

  /* ===== Drag shapes (inside world) ===== */
  function hacerArrastrable(elemento) {
    let offsetX, offsetY, arrastrando = false;

    elemento.addEventListener('mousedown', (e) => {
      if (e.target.closest('.arrow')) return;
      if (!modoFlechaActivo) {
        arrastrando = true;
        const rect = elemento.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        elemento.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!arrastrando) return;

      const rectStage = stage.getBoundingClientRect();
      const sx = e.clientX - rectStage.left;
      const sy = e.clientY - rectStage.top;

      const worldX = ((sx - stageOffsetX) / stageScale) - (offsetX / stageScale);
      const worldY = ((sy - stageOffsetY) / stageScale) - (offsetY / stageScale);

      elemento.style.left = `${worldX}px`;
      elemento.style.top = `${worldY}px`;

      if (elemento.manejadoresMovimiento) {
        elemento.manejadoresMovimiento.forEach(fn => fn());
      }
    });

    document.addEventListener('mouseup', () => {
      if (arrastrando) {
        arrastrando = false;
        elemento.style.cursor = 'move';
      }
    });
  }

  /* ===== Pan ===== */
  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('.shape') || e.target.closest('.arrow')) return;
    if (modoFlechaActivo) return;

    isPanning = true;
    stage.classList.add('panning');
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartOffsetX = stageOffsetX;
    panStartOffsetY = stageOffsetY;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    stageOffsetX = panStartOffsetX + dx;
    stageOffsetY = panStartOffsetY + dy;
    updateStageTransform();
  });

  document.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      stage.classList.remove('panning');
    }
  });

  /* ===== Zoom ===== */
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rectStage = stage.getBoundingClientRect();
    const sx = e.clientX - rectStage.left;
    const sy = e.clientY - rectStage.top;

    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    let newScale = stageScale + delta;
    newScale = Math.max(stageMinScale, Math.min(stageMaxScale, newScale));
    if (newScale === stageScale) return;

    const worldX = (sx - stageOffsetX) / stageScale;
    const worldY = (sy - stageOffsetY) / stageScale;

    stageScale = newScale;
    stageOffsetX = sx - worldX * stageScale;
    stageOffsetY = sy - worldY * stageScale;

    updateStageTransform();
    flechas.forEach(actualizarFlecha);
  }, { passive: false });

  /* ===== Save / Load ===== */
  saveBtn.addEventListener('click', () => {
    const formas = [];
    stageInner.querySelectorAll('.shape').forEach(el => {
      const tipo = Array.from(el.classList).find(cls =>
        ['rectangle','pill','circle','diamond','parallelogram','note','cloud','hex','star'].includes(cls)
      );

      
      const texto = (tipo === 'parallelogram')
        ? (el.querySelector('span')?.textContent ?? '')
        : el.textContent;

      formas.push({
        id: el.id,
        tipo,
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
        texto
      });
    });

    const datosFlechas = flechas.map(f => ({
      idInicio: f.inicio.id,
      idFin: f.fin.id,
      tipo: f.tipo,
      ruta: rutaFlecha
    }));

    const datos = JSON.stringify({ formas, flechas: datosFlechas }, null, 2);
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagrama.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  uploadBtn.addEventListener('click', () => uploadInput.click());

  uploadInput.addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { formas, flechas: datosFlechas } = JSON.parse(ev.target.result);

      stageInner.innerHTML = '';
      flechas = [];
      contadorFormas = 0;
      elementoSeleccionado = null;
      formaInicioSeleccionada = null;
      formaFinSeleccionada = null;

      const mapa = {};

      formas.forEach(f => {
        const el = document.createElement('div');
        el.id = f.id || generarIdForma();
        el.classList.add('shape', f.tipo);
        el.style.left = f.left;
        el.style.top = f.top;
        if (f.width) el.style.width = f.width;
        if (f.height) el.style.height = f.height;

        if (f.tipo === 'parallelogram') {
          const span = document.createElement('span');
          span.textContent = f.texto || '';
          el.appendChild(span);
        } else {
          el.textContent = f.texto || '';
        }

        stageInner.appendChild(el);
        hacerArrastrable(el);
        prepararEdicionTexto(el);
        mapa[el.id] = el;
      });

      if (Array.isArray(datosFlechas)) {
        datosFlechas.forEach(df => {
          const ini = mapa[df.idInicio];
          const fin = mapa[df.idFin];
          if (ini && fin) {
            crearFlecha(ini, fin, df.tipo || 'simple', df.ruta || rutaFlecha);
          }
        });
      }

      stageScale = 1;
      stageOffsetX = 0;
      stageOffsetY = 0;
      updateStageTransform();
    };
    reader.readAsText(archivo);
  });

  updateStageTransform();
});

