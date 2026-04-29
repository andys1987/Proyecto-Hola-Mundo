## Command Center v2

- Layout rediseñado: estado izquierda, avatar holográfico central y chat derecha.
- Módulos secundarios en tabs (Proyectos, Agentes, Bots, Repositorio).
- Voz ejecutiva `speakCEO(text)` y sincronización de visemas con avatar.

# HoloTrader CEO AI (prototipo web)

Este repositorio incluye un prototipo web para orquestar el ciclo de vida de proyectos de trading algorítmico.

## Qué trae hoy

- Holograma visual estilo futurista con modo de voz amigable.
- Chat de asistencia para ideas de trading, MQL5 y organización técnica.
- Organigrama de proyectos (diseño, desarrollo, terminados).
- Fábrica de bots con historial de versiones.
- Centro de agentes especializados (research, coder, integrator, QA).
- Repositorio de conocimiento con carga de archivos para retroalimentación local.
- Descarga de plantillas `.mq5` y placeholder `.ex5`.

## HOLO Project (fase visual + voz mejorada)

Se agregó una base de avatar holográfico 3D en tiempo real usando **Three.js** con módulos separados:

- `hologram.js`: avatar full-body, idle breathing, blink, head tracking y glitches sutiles.
- `voice.js`: voz estilo asistente con cadencia controlada + timeline de visemas para lip-sync aproximado.
- `app.js`: integra conversación, TTS, reconocimiento de voz y sincronización de visemas.

> Nota: `hologram.js` importa Three.js desde CDN, por lo que necesitas conexión a internet al abrir la app.

## Descargar el proyecto en un solo archivo (.zip)

Si quieres descargar todo junto para probarlo en tu PC:

```bash
cd /workspace/Proyecto-Hola-Mundo
./scripts/export_zip.sh
```

Eso genera este archivo:

```text
/workspace/Proyecto-Hola-Mundo/holotrader-prototipo.zip
```

Luego solo descárgalo y descomprímelo en tu computadora.

## Desplegar en Netlify

Sí, se puede subir a Netlify sin backend. Ya se agregó `netlify.toml` para que Netlify publique la raíz del proyecto y sirva `index.html` en rutas SPA.

### Opción A (rápida, sin Git)
1. Entra a Netlify y crea un sitio nuevo.
2. Arrastra la carpeta del proyecto (o un `.zip` descomprimido).
3. Netlify lo publica automáticamente.

### Opción B (recomendada, con Git)
1. Sube este repo a GitHub/GitLab/Bitbucket.
2. En Netlify: **Add new site** → **Import an existing project**.
3. Selecciona el repo.
4. Configuración:
   - **Build command:** (vacío)
   - **Publish directory:** `.`
5. Deploy.

### Variables y límites actuales
- Este prototipo usa `localStorage`; cada navegador mantiene su propio estado.
- No hay backend aún, así que no comparte datos entre usuarios/dispositivos.

## Importante: este chat no ejecuta la web en tu PC automáticamente

Correcto: para verlo en tu computadora necesitas **tener los archivos del proyecto en una carpeta local**.

Este asistente te guía, pero no puede abrir una web en tu máquina sin que antes tengas los archivos (`index.html`, `app.js`, `styles.css`) guardados localmente.

Flujo mínimo:

1. Descarga/clona el proyecto a tu PC.
2. Abre terminal en esa carpeta.
3. Ejecuta `python3 -m http.server 8000`.
4. Abre `http://localhost:8000/index.html`.

## Prueba rápida (sin descargar nada extra)

Si ya estás en este entorno, **solo necesitas navegador + una terminal**.

1. Abre una terminal en esta carpeta:

```bash
cd /workspace/Proyecto-Hola-Mundo
```

2. Ejecuta este comando (deja la terminal abierta):

```bash
python3 -m http.server 8000
```

3. En tu navegador abre:

```text
http://localhost:8000
```

Listo: ahí vas a ver el proyecto en tiempo real.

> No necesitas instalar Node, React ni descargar nada adicional para esta versión.

### Probar voz (nuevo flujo)

1. Presiona **Activar voz** para respuesta hablada (TTS).
2. Presiona **Iniciar escucha** para activar micrófono.
3. Habla y revisa **Última instrucción** + mensaje `✅ Te escuché...` en el chat.
4. Si no escucha, habilita permisos de micrófono del navegador para `localhost`.

Si no abre, revisa:
- Que el comando de `python3 -m http.server 8000` siga corriendo.
- Que estés entrando exactamente a `http://localhost:8000`.
- Que no tengas otro proceso usando el puerto 8000.

## Si `cd /workspace/...` no existe en tu computadora

Eso es normal en algunos equipos. Esa ruta es de este entorno, no siempre de tu PC.

Usa este método universal:

```bash
# 1) mira en qué carpeta estás
pwd

# 2) lista archivos para ubicar el proyecto
ls

# 3) entra a la carpeta donde estén index.html, app.js y styles.css
cd RUTA_DE_TU_PROYECTO

# 4) levanta el servidor desde esa carpeta
python3 -m http.server 8000
```

Después abre:

```text
http://localhost:8000/index.html
```

Tip: si no sabes dónde está el proyecto, abre terminal dentro de la carpeta del proyecto y ejecuta `python3 -m http.server 8000` ahí mismo.

## Problema común: aparece "Directory listing for /"

Si ves una pantalla como la de tu captura (lista de carpetas como `Desktop`, `Downloads`, etc.), significa que levantaste el servidor en la carpeta equivocada (tu HOME) y no en el proyecto.

Haz esto exactamente:

```bash
# 1) detener servidor actual
# (en la terminal donde corre el servidor)
Ctrl + C

# 2) entrar a la carpeta del proyecto
cd /workspace/Proyecto-Hola-Mundo

# 3) volver a levantar servidor
python3 -m http.server 8000
```

Ahora abre en el navegador:

```text
http://localhost:8000/index.html
```

> Usa `/index.html` explícitamente para evitar volver al listado de carpetas.

## Cómo ejecutarlo y ver cómo se ve

### 1) Entrar al proyecto

```bash
cd /workspace/Proyecto-Hola-Mundo
```

### 2) Levantar servidor local

```bash
python3 -m http.server 8000
```

### 3) Abrir en navegador

Abre:

```text
http://localhost:8000
```

### 4) Probar rápidamente las funciones

1. **Holograma y voz**:
   - Haz clic en **"Activar voz"**.
   - Escribe un mensaje en el chat y verifica la respuesta.
2. **Organigrama**:
   - Crea un proyecto en “Diseño” y muévelo entre columnas.
3. **Versionado de bots**:
   - Registra un EA con versión (`v1.0.0`, `v1.0.1`, etc.).
4. **Agentes nuevos**:
   - Agrega un agente con rol (research/coder/integrator/qa).
5. **Repositorio de conocimiento**:
   - Carga uno o más archivos para indexar contexto.
6. **Descargas**:
   - Descarga la plantilla `.mq5` y el placeholder `.ex5`.

### 5) Detener el servidor

En la terminal donde corre el servidor presiona:

```bash
Ctrl + C
```

## Cómo seguir ampliándolo (recomendado)

### Fase 1 (base sólida)
- Migrar la SPA a una arquitectura con backend (`/api`) y base de datos.
- Guardar proyectos, agentes, versiones y documentos en una BD real.
- Implementar autenticación (admin/operador).

### Fase 2 (IA operativa)
- Conectar chat a un modelo real vía API.
- Añadir RAG (retrieval) sobre documentos cargados.
- Versionar prompts por tipo de agente (CEO, Research, Coder, Integrator).

### Fase 3 (pipeline MQL5)
- Generación asistida de módulos MQL5 por plantillas.
- Historial de cambios tipo “release notes” por EA.
- Exportación estructurada de `.mq5` por estrategia/proyecto.

### Fase 4 (calidad y despliegue)
- Pruebas automáticas de frontend y API.
- Auditoría de cambios por usuario.
- Entorno staging + producción.

## Nota importante

Este proyecto es una base de producto. No ejecuta operaciones reales ni reemplaza asesoría financiera profesional. Antes de operar en brokers, valida cumplimiento legal, riesgo y pruebas robustas.
