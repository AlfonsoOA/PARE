<script>
  import { app, hoyISO } from '../lib/estado.svelte.js';
  import { ZONAS } from '../lib/catalogo.js';
  import { generarRutina, generarDieta, faseDeObjetivo, repartosPara, REPARTO_POR_DEFECTO } from '../lib/plan.js';
  import { nivelActual } from '../lib/entreno.js';
  import { proponerMenu } from '../lib/menu.js';
  import Icono from '../componentes/Icono.svelte';

  const BLOQUES = ['Sobre ti', 'Salud', 'Objetivo', 'Entreno', 'Tu día', 'Comida', 'Constancia'];
  const PARQ = [
    '¿Te ha dicho un médico que tienes un problema de corazón o la tensión alta?',
    '¿Sientes dolor en el pecho en reposo, en tu día a día o al hacer ejercicio?',
    '¿Has perdido el equilibrio por mareos o el conocimiento en el último año?',
    '¿Tienes diagnosticada otra enfermedad crónica?',
    '¿Tomas medicación para alguna enfermedad crónica?',
    '¿Tienes ahora (o en el último año) un problema de huesos, articulaciones o músculos que podría empeorar con más actividad?',
    '¿Te ha dicho un médico que solo hagas ejercicio con supervisión médica?',
  ];
  const ALERGENOS = [['gluten', 'Gluten'], ['leche', 'Leche / lactosa'], ['huevo', 'Huevo'], ['pescado', 'Pescado'], ['crustaceos', 'Crustáceos'], ['moluscos', 'Moluscos'], ['frutos_cascara', 'Frutos de cáscara'], ['cacahuete', 'Cacahuete'], ['soja', 'Soja'], ['sesamo', 'Sésamo'], ['apio', 'Apio'], ['mostaza', 'Mostaza'], ['sulfitos', 'Sulfitos'], ['altramuces', 'Altramuces']];

  const p = app.datos.perfil;
  if (!p.borradorTest) {
    p.borradorTest = {
      paso: 0, nombre: p.nombre || '', sexo: p.sexo || '', edad: p.edad, altura: p.altura, peso: app.datos.medidas.at(-1)?.peso ?? null,
      cintura: null, cuello: null, cadera: null, parq: PARQ.map(() => null), molestias: [...(p.molestias || [])],
      alergenos: [...(p.alergenos || [])], objetivo: '', plazo: '', experiencia: '', diasSemana: 4, diasWod: p.diasWod || 0, minutos: 60, horaEntreno: p.horaEntreno || '',
      lugar: 'gimnasio', material: [], cargas: { sentadilla: null, banca: null, muerto: null, dominadas: null },
      trabajo: '', pasos: '', otrosDeportes: 0, comidasDia: 4, hambre: '', registro: 'raciones', aversiones: '', cocinaTiempo: p.cocina?.tiempo || 'normal', tipoDieta: p.cocina?.dieta || 'omnivora', presupuesto: p.cocina?.presupuesto || 'normal',
      cuesta: [],
    };
  }
  const t = p.borradorTest;

  const toggle = (arr, v) => { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); };
  const valido = $derived.by(() => {
    switch (t.paso) {
      case 0: return t.sexo && t.edad > 13 && t.altura > 100 && t.peso > 30;
      case 1: return t.parq.every((x) => x !== null);
      case 2: return !!t.objetivo;
      case 3: return t.experiencia && t.diasSemana && t.minutos && t.lugar;
      case 4: return t.trabajo && t.pasos;
      case 5: return t.comidasDia && t.hambre;
      default: return true;
    }
  });
  const parqSi = $derived(t.parq.some((x) => x === true));

  function siguiente() {
    if (t.paso < BLOQUES.length - 1) { t.paso++; window.scrollTo(0, 0); return; }
    terminar();
  }
  function atras() {
    if (t.paso > 0) { t.paso--; window.scrollTo(0, 0); } else app.vista = null;
  }
  function terminar() {
    const perfil = app.datos.perfil;
    Object.assign(perfil, {
      nombre: t.nombre.trim(), sexo: t.sexo, edad: +t.edad, altura: +t.altura, objetivo: t.objetivo,
      diasSemana: +t.diasSemana, diasWod: +t.diasWod || 0, minutos: +t.minutos, lugar: t.lugar, material: [...t.material], reparto: t.reparto || null,
      molestias: [...t.molestias], alergenos: [...t.alergenos], parqSi: t.parq.some((x) => x),
      parqCronica: t.parq[3] === true || t.parq[4] === true,
      horaEntreno: t.horaEntreno || 'varia',
      cocina: { tiempo: t.cocinaTiempo || 'normal', presupuesto: t.presupuesto || 'normal', dieta: t.tipoDieta || 'omnivora' },
    });
    perfil.test = JSON.parse(JSON.stringify(t));
    perfil.testFecha = hoyISO();
    perfil.nivel = nivelActual(perfil, app.datos.sesiones);
    const hoy = hoyISO();
    const m = app.datos.medidas.find((x) => x.fecha === hoy);
    const med = { fecha: hoy, peso: +t.peso, cintura: t.cintura ? +t.cintura : null, cuello: t.cuello ? +t.cuello : null, cadera: t.cadera ? +t.cadera : null };
    if (m) Object.assign(m, med); else app.datos.medidas.push(med);
    const rutina = generarRutina(perfil, app.datos.ajustes);
    const dieta = generarDieta({ ...t, peso: +t.peso, altura: +t.altura, edad: +t.edad, cintura: +t.cintura || null, cuello: +t.cuello || null, cadera: +t.cadera || null });
    dieta.menu = proponerMenu(dieta, perfil);
    app.datos.planPropuesto = { rutina, dieta, fase: faseDeObjetivo(t.objetivo, dieta) };
    delete perfil.borradorTest;
    app.vista = { nombre: 'plan' };
  }
</script>

<div class="pantalla">
  <div class="fila entre">
    <button class="icono-b" data-atras onclick={atras} aria-label="Atrás"><Icono n="atras" /></button>
    <span class="sec peq">Bloque {t.paso + 1} de {BLOQUES.length}</span>
  </div>
  <div class="avance" aria-hidden="true"><i style="width: {((t.paso + 1) / BLOQUES.length) * 100}%"></i></div>
  <h1>{BLOQUES[t.paso]}</h1>

  {#if t.paso === 0}
    <label class="campo">Nombre o alias (opcional)<input type="text" bind:value={t.nombre} autocomplete="nickname" /></label>
    <div class="col"><span class="sec peq">Sexo (para calcular tu gasto)</span>
      <div class="fila">{#each [['hombre', 'Hombre'], ['mujer', 'Mujer']] as [v, l]}<button class="chip" class:on={t.sexo === v} onclick={() => (t.sexo = v)}>{l}</button>{/each}</div>
    </div>
    <div class="dos">
      <label class="campo">Edad<input type="number" inputmode="numeric" bind:value={t.edad} /></label>
      <label class="campo">Altura (cm)<input type="number" inputmode="numeric" bind:value={t.altura} /></label>
      <label class="campo">Peso (kg)<input type="number" inputmode="decimal" step="0.1" bind:value={t.peso} /></label>
      <label class="campo">Cintura (cm)<input type="number" inputmode="decimal" bind:value={t.cintura} /></label>
      <label class="campo">Cuello (cm, opcional)<input type="number" inputmode="decimal" bind:value={t.cuello} /></label>
      {#if t.sexo === 'mujer'}<label class="campo">Cadera (cm, opcional)<input type="number" inputmode="decimal" bind:value={t.cadera} /></label>{/if}
    </div>
    <p class="sec peq">Cintura a la altura del ombligo, de pie y sin apretar. Con el cuello, la app estima tu % de grasa.</p>

  {:else if t.paso === 1}
    <p class="sec">Siete preguntas del cuestionario PAR-Q+ y tus molestias.</p>
    {#each PARQ as q, i}
      <div class="tarjeta">
        <p>{q}</p>
        <div class="fila"><button class="chip" class:on={t.parq[i] === false} onclick={() => (t.parq[i] = false)}>No</button><button class="chip" class:on={t.parq[i] === true} onclick={() => (t.parq[i] = true)}>Sí</button></div>
      </div>
    {/each}
    {#if parqSi}
      <div class="aviso-l"><Icono n="aviso" /><p>Con alguna respuesta afirmativa, consulta con tu médico antes de empezar o de subir la intensidad. Puedes seguir con el test.</p></div>
    {/if}
    <div class="col"><span class="etiqueta">Molestias o dolores (marca las zonas)</span>
      <div class="fila envolver">{#each ZONAS as [z, l]}<button class="chip" class:on={t.molestias.includes(z)} onclick={() => toggle(t.molestias, z)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Alergias o intolerancias alimentarias</span>
      <div class="fila envolver">{#each ALERGENOS as [z, l]}<button class="chip" class:on={t.alergenos.includes(z)} onclick={() => toggle(t.alergenos, z)}>{l}</button>{/each}</div>
    </div>

  {:else if t.paso === 2}
    <div class="col">
      {#each [['perder_grasa', 'Perder grasa'], ['recomposicion', 'Recomposición (perder grasa y ganar músculo)'], ['ganar_musculo', 'Ganar músculo'], ['fuerza', 'Ganar fuerza'], ['salud', 'Salud y sentirme mejor']] as [v, l]}
        <button class="chip grande" class:on={t.objetivo === v} onclick={() => (t.objetivo = v)}>{l}</button>
      {/each}
    </div>
    <div class="col"><span class="etiqueta">¿En cuánto tiempo te gustaría notarlo?</span>
      <div class="fila envolver">{#each [['1m', '1 mes'], ['3m', '3 meses'], ['6m', '6 meses'], ['sin', 'Sin prisa']] as [v, l]}<button class="chip" class:on={t.plazo === v} onclick={() => (t.plazo = v)}>{l}</button>{/each}</div>
    </div>

  {:else if t.paso === 3}
    <div class="col"><span class="etiqueta">Experiencia entrenando fuerza</span>
      <div class="fila envolver">{#each [['nunca', 'Nunca'], ['menos6m', 'Menos de 6 meses'], ['6a24m', '6 meses a 2 años'], ['2a5a', '2 a 5 años'], ['mas5a', 'Más de 5 años']] as [v, l]}<button class="chip" class:on={t.experiencia === v} onclick={() => (t.experiencia = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Días por semana de pesas que de verdad puedes entrenar</span>
      <div class="fila envolver">{#each [2, 3, 4, 5, 6] as d}<button class="chip" class:on={+t.diasSemana === d} onclick={() => (t.diasSemana = d)}>{d}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">¿Haces CrossFit? Días de WOD a la semana, además</span>
      <div class="fila envolver">{#each [0, 1, 2, 3] as d}<button class="chip" class:on={+t.diasWod === d} onclick={() => (t.diasWod = d)}>{d === 0 ? 'No' : d}</button>{/each}</div>
      {#if +t.diasWod > 0}<p class="sec peq">Se meten en tu rutina como días de WOD: apuntas el de la pizarra (o uno de la biblioteca) y PARE lo cronometra y guarda tus marcas.{+t.diasSemana + +t.diasWod > 6 ? ' Ojo: son muchos días; deja al menos uno de descanso.' : ''}</p>{/if}
    </div>
    <div class="col"><span class="etiqueta">¿Cómo quieres repartir los grupos?</span>
      <div class="col" style="gap:6px">
        <button class="chip grande" class:on={!t.reparto} onclick={() => (t.reparto = '')}>Que decida PARE</button>
        {#each repartosPara(+t.diasSemana) as r}
          <button class="chip grande" class:on={t.reparto === r.id} onclick={() => (t.reparto = r.id)}>{r.nombre}{r.id === REPARTO_POR_DEFECTO[+t.diasSemana] ? ' (recomendado)' : ''}</button>
        {/each}
      </div>
    </div>
    <div class="col"><span class="etiqueta">Minutos por sesión</span>
      <div class="fila envolver">{#each [30, 45, 60, 75, 90] as d}<button class="chip" class:on={+t.minutos === d} onclick={() => (t.minutos = d)}>{d}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">¿A qué hora sueles entrenar?</span>
      <div class="fila envolver">{#each [['temprano', 'Temprano (antes de las 9)'], ['manana', 'Por la mañana'], ['mediodia', 'A mediodía'], ['tarde', 'Por la tarde'], ['noche', 'Por la noche'], ['varia', 'Varía']] as [v, l]}<button class="chip" class:on={t.horaEntreno === v} onclick={() => (t.horaEntreno = v)}>{l}</button>{/each}</div>
      <p class="sec peq">Sirve para poner los hidratos extra en la comida de después de entrenar.</p>
    </div>
    <div class="col"><span class="etiqueta">¿Dónde entrenas?</span>
      <div class="fila">{#each [['gimnasio', 'Gimnasio'], ['casa', 'Casa']] as [v, l]}<button class="chip" class:on={t.lugar === v} onclick={() => (t.lugar = v)}>{l}</button>{/each}</div>
    </div>
    {#if t.lugar === 'casa'}
      <div class="col"><span class="etiqueta">Material que tienes</span>
        <div class="fila envolver">{#each [['mancuernas', 'Mancuernas'], ['barra', 'Barra y discos'], ['kettlebell', 'Kettlebell'], ['bandas', 'Bandas'], ['dominadas', 'Barra de dominadas'], ['fitball', 'Fitball']] as [v, l]}<button class="chip" class:on={t.material.includes(v)} onclick={() => toggle(t.material, v)}>{l}</button>{/each}</div>
      </div>
    {/if}
    <details class="tarjeta"><summary>Cargas que mueves hoy (opcional)</summary>
      <div class="dos">
        <label class="campo">Sentadilla (kg)<input type="number" inputmode="decimal" bind:value={t.cargas.sentadilla} /></label>
        <label class="campo">Press de banca (kg)<input type="number" inputmode="decimal" bind:value={t.cargas.banca} /></label>
        <label class="campo">Peso muerto (kg)<input type="number" inputmode="decimal" bind:value={t.cargas.muerto} /></label>
        <label class="campo">Dominadas (reps)<input type="number" inputmode="numeric" bind:value={t.cargas.dominadas} /></label>
      </div>
    </details>

  {:else if t.paso === 4}
    <div class="col"><span class="etiqueta">Tu trabajo es…</span>
      <div class="fila envolver">{#each [['sentado', 'Sentado casi todo el día'], ['de_pie', 'De pie o moviéndome'], ['fisico', 'Físico']] as [v, l]}<button class="chip" class:on={t.trabajo === v} onclick={() => (t.trabajo = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Pasos al día (aprox.)</span>
      <div class="fila envolver">{#each [['menos5k', 'Menos de 5.000'], ['5a8k', '5.000-8.000'], ['8a12k', '8.000-12.000'], ['mas12k', 'Más de 12.000']] as [v, l]}<button class="chip" class:on={t.pasos === v} onclick={() => (t.pasos = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Otros deportes (veces por semana)</span>
      <div class="fila envolver">{#each [0, 1, 2, 3, 4] as d}<button class="chip" class:on={+t.otrosDeportes === d} onclick={() => (t.otrosDeportes = d)}>{d === 4 ? '4 o más' : d}</button>{/each}</div>
    </div>

  {:else if t.paso === 5}
    <div class="col"><span class="etiqueta">Comidas al día</span>
      <div class="fila">{#each [3, 4, 5] as d}<button class="chip" class:on={+t.comidasDia === d} onclick={() => (t.comidasDia = d)}>{d}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">¿Cuándo tienes más hambre?</span>
      <div class="fila envolver">{#each [['manana', 'Por la mañana'], ['tarde', 'Por la tarde'], ['noche', 'Por la noche'], ['igual', 'Igual todo el día']] as [v, l]}<button class="chip" class:on={t.hambre === v} onclick={() => (t.hambre = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">¿Cómo prefieres llevar la dieta?</span>
      <div class="fila envolver">{#each [['raciones', 'Por raciones, sin pesar'], ['pesada', 'Pesando']] as [v, l]}<button class="chip" class:on={t.registro === v} onclick={() => (t.registro = v)}>{l}</button>{/each}</div>
      <p class="sec peq">Podrás cambiarlo y mezclar las dos formas cuando quieras.</p>
    </div>
    <label class="campo">Alimentos que no te gustan (opcional)<input type="text" bind:value={t.aversiones} /></label>
    <div class="col"><span class="etiqueta">Tipo de alimentación</span>
      <div class="fila envolver">{#each [['omnivora', 'Como de todo'], ['vegetariana', 'Vegetariana'], ['vegana', 'Vegana']] as [v, l]}<button class="chip" class:on={t.tipoDieta === v} onclick={() => (t.tipoDieta = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Tiempo para cocinar un día normal</span>
      <div class="fila envolver">{#each [['poco', 'Poco (15 min)'], ['normal', 'Normal (media hora)'], ['mucho', 'Me gusta cocinar']] as [v, l]}<button class="chip" class:on={t.cocinaTiempo === v} onclick={() => (t.cocinaTiempo = v)}>{l}</button>{/each}</div>
    </div>
    <div class="col"><span class="etiqueta">Presupuesto para la compra</span>
      <div class="fila envolver">{#each [['ajustado', 'Ajustado'], ['normal', 'Normal']] as [v, l]}<button class="chip" class:on={t.presupuesto === v} onclick={() => (t.presupuesto = v)}>{l}</button>{/each}</div>
      <p class="sec peq">Sirve para ordenar las recetas que te propone PARE; puedes ver todas igualmente.</p>
    </div>

  {:else}
    <div class="col"><span class="etiqueta">¿Qué es lo que más te cuesta?</span>
      <div class="fila envolver">{#each [['cenas', 'Las cenas'], ['finde', 'Los fines de semana'], ['picoteo', 'El picoteo'], ['dulce', 'El dulce'], ['alcohol', 'El alcohol'], ['constancia', 'Ser constante entrenando']] as [v, l]}<button class="chip" class:on={t.cuesta.includes(v)} onclick={() => toggle(t.cuesta, v)}>{l}</button>{/each}</div>
    </div>
    <p class="sec">Con esto, PARE te monta la rutina y la dieta. Lo verás antes de empezar y podrás ajustarlo.</p>
  {/if}

  <button class="boton ancho" disabled={!valido} onclick={siguiente}>{t.paso < BLOQUES.length - 1 ? 'Siguiente' : 'Ver mi plan'}</button>
</div>

<style>
  .avance { height: 6px; background: var(--borde); border-radius: 3px; overflow: hidden; }
  .avance i { display: block; height: 100%; background: var(--hoy); }
  .dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .grande { text-align: left; border-radius: 12px; min-height: 52px; font-size: 16px; }
  details summary { cursor: pointer; font-weight: 600; min-height: 32px; }
  .pantalla { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); }
</style>
