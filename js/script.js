// Creep laboratory interface, reference curves, and apparatus animation.
const curves = {
  pt: {
    name: "Platinum",
    color: "#d44d49",
    max: 0.018,
    points: [
      [0, 0],
      [0.02, 0.0025],
      [0.05, 0.0045],
      [0.1, 0.0061],
      [0.2, 0.008],
      [0.3, 0.0095],
      [0.4, 0.0107],
      [0.5, 0.0117],
      [0.6, 0.0127],
      [0.7, 0.0136],
      [0.8, 0.0145],
      [0.9, 0.0153],
      [1, 0.016],
    ],
  },
  al: {
    name: "Al-1% Mg",
    color: "#b6600a",
    max: 0.016,
    points: [
      [0, 0],
      [0.03, 0.0038],
      [0.06, 0.006],
      [0.1, 0.0087],
      [0.15, 0.0099],
      [0.2, 0.0106],
      [0.3, 0.012],
      [0.37, 0.0129],
      [0.55, 0.0136],
      [0.75, 0.014],
      [1, 0.0145],
    ],
  },
  ni: {
    name: "Nickel",
    color: "#d000ba",
    max: 0.025,
    points: [
      [0, 0],
      [0.01, 0.0028],
      [0.03, 0.0049],
      [0.06, 0.0068],
      [0.1, 0.0086],
      [0.15, 0.0102],
      [0.2, 0.0116],
      [0.3, 0.0137],
      [0.4, 0.0155],
      [0.6, 0.0183],
      [0.8, 0.0208],
      [1, 0.023],
    ],
  },
};
let state = { material: null, phase: "ready", t: 0, graph: false },
  past = [],
  future = [],
  last = 0,
  lang = "en",
  audioMode = "off";
const $ = (id) => document.getElementById(id),
  clone = (s) => ({ ...s }),
  tr = (en, hi) => (lang === "hi" ? hi : en);
const staticPairs = [
  [
    "header h1",
    "Creep Transient Based on Material Selection",
    "पदार्थ चयन के आधार पर क्रीप का अध्ययन",
  ],
  [".panel:nth-child(1) .bar", "PROCEDURE & CONTROLS", "प्रक्रिया और नियंत्रण"],
  [
    ".panel:nth-child(2) .bar",
    "CREEP TESTING APPARATUS",
    "क्रीप परीक्षण उपकरण",
  ],
  [".panel:nth-child(3) .bar", "OUTPUT & OBSERVATIONS", "परिणाम और प्रेक्षण"],
  [".step b", "Current Step:", "वर्तमान चरण:"],
  [".panel:nth-child(1) h3", "Specimen Selection:", "नमूना चयन:"],
  ["#apply", "APPLY LOAD", "भार लगाएँ"],
  ["#show", "SHOW RESULT", "परिणाम दिखाएँ"],
  ["#undo", "↶ UNDO", "↶ पूर्ववत करें"],
  ["#redo", "↷ REDO", "↷ फिर से करें"],
  ["#reset", "RESET EXPERIMENT", "प्रयोग रीसेट करें"],
  ["#langLabel", "Language", "भाषा"],
  ["#audioLabel", "Audio", "ऑडियो"],
  [
    ".panel:nth-child(3) h3:nth-of-type(1)",
    "Observation Table",
    "प्रेक्षण तालिका",
  ],
  [".panel:nth-child(3) h3:nth-of-type(2)", "Result Graph", "परिणाम का ग्राफ"],
  ["details summary", "Theory & formulas", "सिद्धांत और सूत्र"],
  [
    ".stage-foot",
    "Drag to rotate · Scroll to zoom · Right-drag to pan · Constant-load demonstration · Extension magnified 8×",
    "घुमाने के लिए खींचें · ज़ूम के लिए स्क्रॉल करें · स्थान बदलने के लिए दायाँ बटन दबाकर खींचें · स्थिर भार प्रदर्शन · विस्तार 8 गुना बढ़ाकर दिखाया गया है",
  ],

  [
    "details p:nth-of-type(1)",
    "Creep is permanent deformation that increases with time under sustained load. The strain–time curve shows how each material responds.",
    "क्रीप लगातार भार के अंतर्गत समय के साथ बढ़ने वाला स्थायी विरूपण है। विकृति–समय ग्राफ पदार्थ की प्रतिक्रिया दिखाता है।",
  ],
  [
    "details p:nth-of-type(2)",
    "Strain: ε = ΔL / L₀\nNominal stress: σ = F / A₀\nCreep rate: ε̇ = dε / dt\nNormalized time: τ = t / tᵣₑ𝒻",
    "विकृति: ε = ΔL / L₀\nनाममात्र प्रतिबल: σ = F / A₀\nक्रीप दर: ε̇ = dε / dt\nसामान्यीकृत समय: τ = t / tᵣₑ𝒻",
  ],
  [
    "details p:nth-of-type(3)",
    "ΔL: extension; L₀: original length; F: force; A₀: original area; tᵣₑ𝒻: reference duration. Curves use approximate graph readings.",
    "ΔL: लंबाई में वृद्धि; L₀: मूल लंबाई; F: बल; A₀: मूल क्षेत्रफल; tᵣₑ𝒻: संदर्भ अवधि। वक्र ग्राफ के अनुमानित मानों पर आधारित हैं।",
  ],
];
function name() {
  return state.material === "pt"
    ? tr("Platinum", "प्लैटिनम")
    : state.material === "ni"
      ? tr("Nickel", "निकल")
      : state.material === "al"
        ? "Al-1% Mg"
        : tr("None", "कोई नहीं");
}
function strainAt(key, t) {
  if (!key) return 0;
  const p = curves[key].points;
  for (let i = 1; i < p.length; i++) {
    if (t <= p[i][0]) {
      const [x, y] = p[i - 1],
        [xx, yy] = p[i];
      return y + ((yy - y) * (t - x)) / (xx - x);
    }
  }
  return p.at(-1)[1];
}
function instruction() {
  return !state.material
    ? tr(
        "Select a specimen or drag it onto the apparatus.",
        "नमूना चुनें या उसे उपकरण पर खींचकर छोड़ें।",
      )
    : state.phase === "installing"
      ? tr(
          "Loading specimen into the upper and lower grips…",
          "नमूना ऊपरी और निचली पकड़ में लगाया जा रहा है…",
        )
      : state.phase === "ready"
        ? tr(
            "Click APPLY LOAD to start the experiment.",
            "प्रयोग शुरू करने के लिए भार लगाएँ बटन दबाएँ।",
          )
        : state.phase === "running" || state.phase === "installing"
          ? tr(
              "Observe creep under constant load.",
              "स्थिर भार के अंतर्गत क्रीप का अवलोकन करें।",
            )
          : state.graph
            ? tr(
                "Result displayed. Select another specimen or reset the experiment.",
                "परिणाम दिखाया गया है। दूसरा नमूना चुनें या प्रयोग रीसेट करें।",
              )
            : tr(
                "Experiment completed. Click SHOW RESULT.",
                "प्रयोग पूरा हुआ। परिणाम दिखाएँ बटन दबाएँ।",
              );
}
function speak(text) {
  if (!("speechSynthesis" in window) || audioMode === "off") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(audioMode));
  if (voice) u.voice = voice;
  u.rate = 0.93;
  u.onerror = (e) => {
    if (!["interrupted", "canceled"].includes(e.error))
      $("audioStatus").textContent = tr(
        "Voice unavailable on this device.",
        "इस उपकरण पर आवाज़ उपलब्ध नहीं है।",
      );
  };
  speechSynthesis.speak(u);
}
function narrate(fracture = false) {
  const saved = lang;
  lang = "en";
  const text = fracture
    ? tr("Material fractured", "पदार्थ टूट गया")
    : instruction();
  lang = saved;
  speak(text);
}
function change(fn) {
  past.push(clone(state));
  future = [];
  fn();
  render();
  narrate();
}
function history(from, to) {
  if (!from.length) return;
  to.push(clone(state));
  state = from.pop();
  last = performance.now();
  $("fractureDialog").close();
  render();
  narrate();
}
function selectMaterial(key) {
  if (
    !["al", "ni", "pt"].includes(key) ||
    state.phase === "running" ||
    state.phase === "installing" ||
    state.material === key
  )
    return;
  change(
    () => (state = { material: key, phase: "installing", t: 0, graph: false }),
  );
}
for (const key of ["al", "ni", "pt"]) {
  $(key).onclick = () => selectMaterial(key);
  $(key).draggable = true;
  $(key).addEventListener("dragstart", (e) => {
    if (state.phase === "running" || state.phase === "installing") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "copy";
  });
  $(key).addEventListener("dragend", () =>
    $("dropTarget").classList.remove("over"),
  );
}
const drop = $("dropTarget"),
  dropSurface = document.querySelector(".stage");
dropSurface.addEventListener("dragover", (e) => {
  if (state.phase !== "running") {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    drop.classList.add("over");
  }
});
dropSurface.addEventListener("dragleave", () => drop.classList.remove("over"));
dropSurface.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("over");
  selectMaterial(e.dataTransfer.getData("text/plain"));
});
$("apply").onclick = () => {
  if (!state.material || state.phase !== "ready") return;
  change(() => {
    state.phase = "running";
    state.t = 0;
    last = performance.now();
  });
};
$("show").onclick = () => {
  if (state.phase === "complete" && !state.graph)
    change(() => (state.graph = true));
};
$("undo").onclick = () => history(past, future);
$("redo").onclick = () => history(future, past);
$("reset").onclick = () => {
  $("fractureDialog").close();
  change(
    () => (state = { material: null, phase: "ready", t: 0, graph: false }),
  );
};
$("closeFracture").onclick = () => {
  $("fractureDialog").close();
  narrate();
  $("show").focus();
};
$("language").onchange = (e) => {
  lang = e.target.value;
  render();
  narrate();
};
$("audio").onchange = (e) => {
  audioMode = e.target.value;
  $("audioStatus").textContent = "";
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  else if (audioMode !== "off")
    $("audioStatus").textContent = tr(
      "Audio is not supported by this browser.",
      "इस ब्राउज़र में ऑडियो समर्थित नहीं है।",
    );
  narrate();
};
function syncMachine() {
  window.dispatchEvent(
    new CustomEvent("creep-state", {
      detail: {
        strain: strainAt(
          state.material,
          state.phase === "installing" ? 0 : state.t,
        ),
        loaded: state.phase === "running" || state.phase === "complete",
        installation: state.phase === "installing" ? state.t : 1,
        material: state.material,
        fractured: state.phase === "complete",
      },
    }),
  );
}
window.addEventListener("machine-ready", syncMachine);
function live() {
  const eps = strainAt(
      state.material,
      state.phase === "installing" ? 0 : state.t,
    ),
    done = state.phase === "complete";
  $("progress").value = state.t;
  $("statusText").textContent = done
    ? tr(
        "Experiment completed · fracture demonstration",
        "प्रयोग पूरा हुआ · टूटने का प्रदर्शन",
      )
    : state.phase === "running" || state.phase === "installing"
      ? (state.phase === "installing"
          ? tr("Loading specimen", "नमूना लगाया जा रहा है")
          : tr("Experiment running", "प्रयोग चल रहा है")) +
        ` — ${Math.round(state.t * 100)}%`
      : tr("Ready for specimen / load", "नमूना / भार के लिए तैयार");
  $("console").textContent =
    `${tr("STATUS", "स्थिति")}: ${state.phase === "installing" ? tr("LOADING SPECIMEN", "नमूना लगाया जा रहा है") : state.phase === "ready" ? tr("READY", "तैयार") : done ? tr("COMPLETE", "पूर्ण") : tr("RUNNING", "चल रहा है")}\n${tr("MATERIAL", "पदार्थ")}: ${name()}\n${tr("LOAD", "भार")}: ${state.phase === "ready" || state.phase === "installing" ? tr("NOT APPLIED", "नहीं लगाया गया") : state.phase === "complete" ? tr("SUPPORTED BY CATCHER", "कैचर द्वारा समर्थित") : tr("CONSTANT", "स्थिर")}\n\n${tr("NORMALIZED TIME", "सामान्यीकृत समय")}: ${(state.phase === "installing" ? 0 : state.t).toFixed(3)}\n${tr("CURRENT STRAIN ε", "वर्तमान विकृति ε")}: ${eps.toFixed(5)}\n${tr("FINAL STRAIN ε", "अंतिम विकृति ε")}: ${done ? eps.toFixed(5) : "—"}`;
  $("specimen").textContent = tr("SPECIMEN: ", "नमूना: ") + name();
  $("strainBadge").textContent = tr("STRAIN: ", "विकृति: ") + eps.toFixed(5);
  syncMachine();
}
function render() {
  document.documentElement.lang = lang;
  document.querySelectorAll(".hint").forEach((e) => e.remove());
  for (const [sel, en, hi] of staticPairs)
    document.querySelector(sel).textContent = tr(en, hi);
  $("ni").lastChild.textContent = tr("Nickel", "निकल");
  $("pt").lastChild.textContent = tr("Platinum", "प्लैटिनम");
  $("audio").options[0].textContent = tr("Audio off", "ऑडियो बंद");
  $("step").textContent = instruction();
  $("progress").setAttribute(
    "aria-label",
    tr("Experiment progress", "प्रयोग की प्रगति"),
  );
  drop.setAttribute(
    "aria-label",
    tr("Specimen drop zone", "नमूना छोड़ने का क्षेत्र"),
  );
  drop.hidden = !!state.material;
  drop.textContent = tr("Drop specimen here", "नमूना यहाँ छोड़ें");
  for (const key of ["al", "ni", "pt"]) {
    $(key).setAttribute("aria-pressed", state.material === key);
    $(key).disabled = state.phase === "running" || state.phase === "installing";
    $(key).draggable = state.phase !== "running";
  }
  $("apply").disabled = !state.material || state.phase !== "ready";
  $("show").disabled = state.phase !== "complete" || state.graph;
  $("undo").disabled = !past.length;
  $("redo").disabled = !future.length;
  const target = !state.material
    ? document.querySelector(".materials")
    : state.phase === "ready"
      ? $("apply")
      : state.phase === "complete" && !state.graph
        ? $("show")
        : null;
  if (target) {
    const h = document.createElement("span");
    h.className = "hint";
    h.setAttribute("aria-hidden", "true");
    h.textContent = !state.material
      ? tr("Click a specimen or drag it", "नमूना चुनें या खींचें")
      : state.phase === "ready"
        ? tr("Click on Apply Load", "भार लगाएँ पर क्लिक करें")
        : tr("Click on Show Result", "परिणाम दिखाएँ पर क्लिक करें");
    target.append(h);
  }
  document.querySelector("th:nth-child(1)").textContent = tr(
    "Time (normalized)",
    "समय (सामान्यीकृत)",
  );
  document.querySelector("th:nth-child(2)").textContent = tr(
    "Strain ε (dimensionless)",
    "विकृति ε (विमाहीन)",
  );
  $("rows").innerHTML =
    state.phase === "complete"
      ? Array.from(
          { length: 11 },
          (_, i) =>
            `<tr><td>${(i / 10).toFixed(1)}</td><td>${strainAt(state.material, i / 10).toFixed(5)}</td></tr>`,
        ).join("")
      : `<tr><td colspan="2">${tr("Complete the experiment to populate the table.", "तालिका भरने के लिए प्रयोग पूरा करें।")}</td></tr>`;
  $("graph").innerHTML = state.graph
    ? graph(curves[state.material])
    : `<p>${tr("The strain–time graph will appear after completion when you click SHOW RESULT.", "प्रयोग पूरा होने के बाद परिणाम दिखाएँ बटन दबाने पर विकृति–समय ग्राफ दिखाई देगा।")}</p>`;

  $("fractureTitle").textContent = tr("Material fractured", "पदार्थ टूट गया");
  $("closeFracture").textContent = tr("OK", "ठीक है");
  live();
}
function graph(c) {
  // Original supplied graph assets for English; translated vector labels for Hindi.
  if (lang === "en")
    return `<img class="result-image" src="img/${state.material === "al" ? "Al-graph.png" : state.material === "pt" ? "Platinum-graph.png" : "Nickel-graph.png"}" alt="${name()} strain versus normalized time" />`;
  const x = (t) => 65 + t * 310,
    y = (e) => 260 - (e / c.max) * 210;
  let grid = "";
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    grid += `<line x1="65" x2="375" y1="${50 + i * 42}" y2="${50 + i * 42}" stroke="#999"/><text x="55" y="${55 + i * 42}" text-anchor="end">${(c.max * (1 - i / 5)).toFixed(3)}</text><text x="${x(t)}" y="280" text-anchor="middle">${t.toFixed(1)}</text>`;
  }
  return `<svg viewBox="0 0 460 325" role="img" aria-label="${name()} ${tr("strain versus normalized time", "विकृति बनाम सामान्यीकृत समय")}"><rect width="460" height="325" fill="black"/><text x="230" y="28" text-anchor="middle" fill="${c.color}" font-size="20" font-weight="bold">${name()}</text><rect x="65" y="50" width="310" height="210" fill="#808080"/><g fill="white" font-family="Arial" font-size="11">${grid}<text x="220" y="309" text-anchor="middle">${tr("Time (Normalized)", "समय (सामान्यीकृत)")}</text><text transform="translate(18 160) rotate(-90)" text-anchor="middle">${tr("Strain (ε)", "विकृति (ε)")}</text></g><polyline fill="none" stroke="${c.color}" stroke-width="3" points="${c.points.map(([t, e]) => x(t) + "," + y(e)).join(" ")}"/><line x1="385" x2="407" y1="157" y2="157" stroke="${c.color}" stroke-width="2"/><text x="385" y="178" fill="white" font-size="10">${name()}</text></svg>`;
}
function tick(now) {
  if (state.phase === "installing") {
    state.t = Math.min(1, state.t + Math.max(0, now - last) / 1800);
    if (state.t >= 1) {
      state.phase = "ready";
      state.t = 0;
      render();
      narrate();
    } else live();
  } else if (state.phase === "running") {
    state.t = Math.min(1, state.t + Math.max(0, now - last) / 12000);
    if (state.t >= 1) {
      past.push({ ...state, t: 0, phase: "running" });
      future = [];
      state.phase = "complete";
      render();
      $("fractureDialog").showModal();
      narrate(true);
    } else live();
  }
  last = now;
  requestAnimationFrame(tick);
}
render();
requestAnimationFrame(tick);
setTimeout(() => {
  const loader = $("loading-screen");
  if (loader)
    loader.textContent = tr(
      "3D view unavailable. Enable WebGL and reopen this file.",
      "3D दृश्य उपलब्ध नहीं है। WebGL सक्षम करें और फ़ाइल फिर खोलें।",
    );
}, 10000);

// 3D apparatus: isolated from interface state.
(() => {
  const { THREE, OrbitControls } = Creep3D;

  let scene, camera, renderer, controls;

  // Physics & State Constants
  let currentWeights = 0;
  const MAX_WEIGHTS = 8;
  const BASE_WIRE_LENGTH = 0.35;
  const STRETCH_PER_KG = 0.025; // Visual stretch multiplier (Hooke's Law simulation)

  let targetStretch = 0;
  let currentStretch = 0;

  // Key Object References
  let wireMesh;
  let brokenWire;
  let fractured = false;
  let specimenPresent = false,
    installation = 1,
    loadApplied = false;
  let fallOffset = 0,
    fallVelocity = 0,
    frameTime = performance.now();
  let supportPost,
    supportHead,
    lowerJaws = [];
  const catchTop = 0.16,
    panBottomOffset = 0.4675;

  let bottomAssembly; // Holds chuck, pointer, hanger, and weights
  let weightsArray = []; // Array to hold weight objects for toggling
  const wireTopY = 1.9; // Y-coordinate where the wire anchors to the top frame

  // Material Dictionary
  const mat = {};

  const stage = document.getElementById("canvas-container");
  init();
  new ResizeObserver(onWindowResize).observe(stage);
  window.dispatchEvent(new Event("machine-ready"));
  animate();

  function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a303c);
    scene.fog = new THREE.FogExp2(0x2a303c, 0.05);

    // Camera Setup
    camera = new THREE.PerspectiveCamera(
      40,
      stage.clientWidth / stage.clientHeight,
      0.1,
      100,
    );
    camera.position.set(2.8, 2.0, 4.8);

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    document
      .getElementById("canvas-container")
      .appendChild(renderer.domElement);

    // Controls Setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.0, 0);
    controls.minDistance = 1;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping below the floor

    // Initialization Steps
    setupLighting();
    setupMaterials();
    buildLabEnvironment();
    buildApparatus();

    // Remove loading screen
    setTimeout(() => {
      document.getElementById("loading-screen").style.opacity = "0";
      setTimeout(() => document.getElementById("loading-screen").remove(), 500);
    }, 500);

    window.addEventListener("resize", onWindowResize);
    updateUI();
  }

  function setupLighting() {
    // Ambient base
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    // Main Key Light (Casts crisp shadows)
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.5);
    keyLight.position.set(3, 5, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -2;
    keyLight.shadow.camera.right = 2;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -1;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill Light (Softens shadows)
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.6);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    // Highlight from below/front for metallic reflections
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 1, 1.5);
    scene.add(pointLight);
  }

  function setupMaterials() {
    mat.floor = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Wood for table
    mat.wood = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.0,
    });

    // Powder-coated metal for frame
    mat.frameMetal = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.4,
      metalness: 0.5,
    });

    mat.darkMetal = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.5,
      metalness: 0.8,
    });

    mat.aluminium = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.2,
      metalness: 0.9,
    });

    mat.brass = new THREE.MeshStandardMaterial({
      color: 0xc5a059,
      roughness: 0.3,
      metalness: 0.9,
    });

    mat.wire = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.3,
      metalness: 1.0,
    });

    mat.black = new THREE.MeshBasicMaterial({ color: 0x000000 });
    mat.red = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.2,
    });
  }

  function buildLabEnvironment() {
    // Lab Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.9;
    floor.receiveShadow = true;
    scene.add(floor);

    // Sturdy Laboratory Table
    const tableGroup = new THREE.Group();
    scene.add(tableGroup);

    // Table Top (y=0 to y=-0.1)
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), mat.wood);
    tableTop.position.set(0, -0.05, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Table Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const legPositions = [
      [-0.9, -0.5, -0.4],
      [0.9, -0.5, -0.4],
      [-0.9, -0.5, 0.4],
      [0.9, -0.5, 0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, mat.wood);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
    });
  }

  function buildApparatus() {
    const apparatus = new THREE.Group();
    scene.add(apparatus);

    // 1. Frame Base Plate (Resting exactly on table)
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.4),
      mat.darkMetal,
    );
    basePlate.position.set(0, 0.025, 0);
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    apparatus.add(basePlate);

    // 2. Vertical Support Columns
    const columnGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.0, 32);

    const leftCol = new THREE.Mesh(columnGeo, mat.frameMetal);
    leftCol.position.set(-0.2, 1.05, 0); // Centers at y=1.05, reaches from 0.05 to 2.05
    leftCol.castShadow = true;
    leftCol.receiveShadow = true;
    apparatus.add(leftCol);

    const rightCol = new THREE.Mesh(columnGeo, mat.frameMetal);
    rightCol.position.set(0.2, 1.05, 0);
    rightCol.castShadow = true;
    rightCol.receiveShadow = true;
    apparatus.add(rightCol);

    // 3. Top Horizontal Beam
    const topBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.06, 0.1),
      mat.darkMetal,
    );
    topBeam.position.set(0, 2.08, 0);
    topBeam.castShadow = true;
    topBeam.receiveShadow = true;
    apparatus.add(topBeam);

    // 4. Top Wire Mount/Chuck
    const topChuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.15, 24),
      mat.aluminium,
    );
    topChuck.position.set(0, 1.975, 0);
    topChuck.castShadow = true;
    apparatus.add(topChuck);

    // 5. Test Wire
    // We create a wire of length 1, and translate its geometry down by 0.5
    // so its local origin (0,0,0) is at its top tip.
    const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 8);
    wireGeo.translate(0, -0.5, 0);

    wireMesh = new THREE.Mesh(wireGeo, mat.wire);
    wireMesh.position.set(0, wireTopY, 0);
    wireMesh.scale.y = BASE_WIRE_LENGTH; // Compact specimen gauge length in scene units
    wireMesh.castShadow = true;
    apparatus.add(wireMesh);
    brokenWire = new THREE.Mesh(wireGeo.clone(), mat.wire);
    brokenWire.visible = false;
    apparatus.add(brokenWire);

    // 6. Ruler Attachment
    createRuler(apparatus);

    // 7. Bottom Moving Assembly (Chuck, Pointer, Hanger, Weights)
    createBottomAssembly();
    // Ruler brackets physically join the scale to the left frame column.
    for (const y of [0.25, 1.8]) {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.025, 0.025),
        mat.darkMetal,
      );
      bracket.position.set(-0.14, y, 0);
      apparatus.add(bracket);
    }
    // Bolted feet secure the columns to the base.
    for (const x of [-0.2, 0.2]) {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.035, 24),
        mat.aluminium,
      );
      foot.position.set(x, 0.0675, 0);
      apparatus.add(foot);
      for (const z of [-0.035, 0.035]) {
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.018, 6),
          mat.brass,
        );
        bolt.position.set(x, 0.079, z);
        apparatus.add(bolt);
      }
    }
    // Catcher supports the falling pan after fracture; jack supports it during installation.
    const catcher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.1, 0.11, 32),
      mat.darkMetal,
    );
    catcher.position.set(0, 0.105, 0);
    apparatus.add(catcher);
    supportPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 1, 24),
      mat.aluminium,
    );
    apparatus.add(supportPost);
    supportHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.018, 32),
      mat.darkMetal,
    );
    apparatus.add(supportHead);
    for (const x of [-0.012, 0.012]) {
      const jaw = new THREE.Mesh(
        new THREE.BoxGeometry(0.017, 0.042, 0.038),
        mat.aluminium,
      );
      jaw.position.set(x, -0.021, 0);
      bottomAssembly.add(jaw);
      lowerJaws.push(jaw);
    }
  }

  function createRuler(parentGroup) {
    const rulerGroup = new THREE.Group();
    // Position near the left column
    rulerGroup.position.set(-0.08, 1.05, 0);
    parentGroup.add(rulerGroup);

    // Main ruler body
    const rulerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 1.8, 0.01),
      mat.aluminium,
    );
    rulerBody.castShadow = true;
    rulerBody.receiveShadow = true;
    rulerGroup.add(rulerBody);

    // Engraved Tick Marks
    const tickGeoMajor = new THREE.BoxGeometry(0.02, 0.003, 0.012);
    const tickGeoMinor = new THREE.BoxGeometry(0.01, 0.001, 0.012);

    // Loop from top to bottom of ruler
    for (let i = -80; i <= 80; i += 2) {
      const isMajor = i % 10 === 0;
      const tick = new THREE.Mesh(
        isMajor ? tickGeoMajor : tickGeoMinor,
        mat.black,
      );
      tick.position.y = i * 0.01;
      tick.position.x = isMajor ? 0.01 : 0.015;
      tick.position.z = 0.001;
      rulerGroup.add(tick);
    }
  }

  function createBottomAssembly() {
    bottomAssembly = new THREE.Group();
    // Set initial position exactly at the bottom of the unstretched wire
    bottomAssembly.position.set(0, wireTopY - BASE_WIRE_LENGTH, 0);
    scene.add(bottomAssembly);

    // Bottom Chuck
    const bottomChuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16),
      mat.aluminium,
    );
    bottomChuck.position.y = -0.03; // Hanging down from origin
    bottomChuck.castShadow = true;
    bottomAssembly.add(bottomChuck);

    // Measurement Pointer (Red)
    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.005, 0.08, 16),
      mat.red,
    );
    pointer.rotation.z = Math.PI / 2; // Point left towards ruler
    pointer.position.set(-0.05, -0.03, 0);
    pointer.castShadow = true;
    bottomAssembly.add(pointer);

    // Hanger Stem
    const hangerStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.4, 16),
      mat.darkMetal,
    );
    hangerStem.position.y = -0.26;
    hangerStem.castShadow = true;
    bottomAssembly.add(hangerStem);

    // Hanger Base Pan
    const panThickness = 0.015;
    const hangerPan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, panThickness, 32),
      mat.darkMetal,
    );
    const panY = -0.46; // Stem bottom
    hangerPan.position.y = panY;
    hangerPan.castShadow = true;
    bottomAssembly.add(hangerPan);

    // Generate Slotted Weights (Brass)
    const weightRadius = 0.07;
    const weightHeight = 0.04;
    const slotWidth = 0.012;

    // Build a slotted weight geometry using CSG logic or compound shapes.
    // For simplicity and performance, we'll use a cylinder with a dark center to simulate the hole.
    const weightGeo = new THREE.CylinderGeometry(
      weightRadius,
      weightRadius,
      weightHeight,
      32,
    );
    const holeGeo = new THREE.CylinderGeometry(
      0.006,
      0.006,
      weightHeight * 1.05,
      16,
    );

    const startY = panY + panThickness / 2 + weightHeight / 2;

    for (let i = 0; i < MAX_WEIGHTS; i++) {
      const wGroup = new THREE.Group();

      const wBody = new THREE.Mesh(weightGeo, mat.brass);
      wBody.castShadow = true;
      wBody.receiveShadow = true;
      wGroup.add(wBody);

      const wHole = new THREE.Mesh(holeGeo, mat.black);
      wGroup.add(wHole);

      // Stack perfectly on top of each other
      wGroup.position.y = startY + i * weightHeight;
      wGroup.visible = false; // Hidden initially

      bottomAssembly.add(wGroup);
      weightsArray.push(wGroup);
    }
  }

  window.addEventListener("creep-state", (e) => {
    const s = e.detail;
    if (s.fractured && !fractured) {
      fallOffset = 0;
      fallVelocity = 0;
    }
    fractured = s.fractured;
    specimenPresent = !!s.material;
    installation = s.installation;
    loadApplied = s.loaded;
    if (!fractured) {
      fallOffset = 0;
      fallVelocity = 0;
    }

    targetStretch = BASE_WIRE_LENGTH * s.strain * 8;
    weightsArray.forEach((w, i) => (w.visible = s.loaded && i < 4));
    mat.wire.color.set(
      s.material === "al"
        ? 0xd8dce3
        : s.material === "pt"
          ? 0xe5e0ed
          : 0xb8adb9,
    );
  });
  function updateUI() {}
  function onWindowResize() {
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stage.clientWidth, stage.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - frameTime) / 1000, 0.05);
    frameTime = now;
    // Prescribed reference strain sets extension directly (8x display magnification).
    currentStretch = targetStretch;
    const fullLength = BASE_WIRE_LENGTH + currentStretch;
    const heldY = wireTopY - fullLength;
    const maxFall = Math.max(0, heldY - panBottomOffset - catchTop);
    if (fractured && fallOffset < maxFall) {
      fallVelocity += 9.81 * dt;
      fallOffset = Math.min(maxFall, fallOffset + fallVelocity * dt);
      if (fallOffset >= maxFall) fallVelocity = 0;
    }
    wireMesh.visible = specimenPresent;
    // The specimen feeds continuously from the fixed upper chuck to the supported lower grip.
    const feed = Math.max(0.015, installation);
    wireMesh.scale.y = fractured ? fullLength * 0.5 : fullLength * feed;
    brokenWire.visible = fractured && specimenPresent;
    brokenWire.position.set(0, wireTopY - fullLength * 0.5 - fallOffset, 0);
    brokenWire.scale.y = fullLength * 0.5;
    bottomAssembly.position.y = heldY - fallOffset;
    // The lower half remains attached to its chuck as the pan falls onto the catcher.
    const supported = !loadApplied;
    const jackTop = supported ? heldY - panBottomOffset : catchTop;
    const jackHeight = Math.max(0.001, jackTop - catchTop - 0.009);
    supportPost.visible = supported;
    supportHead.visible = supported;
    supportPost.scale.y = jackHeight;
    supportPost.position.set(0, catchTop + jackHeight / 2, 0);
    supportHead.position.set(0, jackTop - 0.009, 0);
    lowerJaws.forEach((jaw, i) => {
      jaw.position.x = (i === 0 ? -1 : 1) * (installation < 1 ? 0.029 : 0.012);
    });

    controls.update();
    renderer.render(scene, camera);
  }
})();
