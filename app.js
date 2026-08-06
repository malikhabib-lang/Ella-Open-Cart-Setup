const steps = [
  { title: "Reagent Setup", hint: "Stocks and PPE" },
  { title: "Conjugate Antibodies", hint: "DIG and biotin" },
  { title: "Remove Free Label", hint: "Spin columns" },
  { title: "Quantitate Conjugates", hint: "A280 and RD2" },
  { title: "Pipette Cartridge", hint: "C, D, sample wells" },
  { title: "Start Ella", hint: "Runner checklist" }
];

const state = { currentStep: 0 };
const disclaimerStorageKey = "ella48digDisclaimerAccepted";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function hasAcceptedDisclaimer() {
  try {
    return window.localStorage.getItem(disclaimerStorageKey) === "true";
  } catch (error) {
    return false;
  }
}

function rememberDisclaimerAccepted() {
  try {
    window.localStorage.setItem(disclaimerStorageKey, "true");
  } catch (error) {
    // Local storage may be unavailable from some file locations; the modal can still be dismissed.
  }
}

function initDisclaimer() {
  const modal = $("#disclaimerModal");
  const acceptButton = $("#acceptDisclaimer");
  if (!modal || !acceptButton || hasAcceptedDisclaimer()) return;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  acceptButton.focus();

  acceptButton.addEventListener("click", () => {
    rememberDisclaimerAccepted();
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }, { once: true });
}

function numberValue(id, fallback = 0) {
  const value = Number($(id).value);
  return Number.isFinite(value) ? value : fallback;
}

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return "Check inputs";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

function result(label, value, unit = "") {
  const suffix = unit ? ` ${unit}` : "";
  return `<div class="result"><span>${label}</span><strong>${value}${suffix}</strong></div>`;
}

function renderNav() {
  const nav = $("#stepNav");
  nav.innerHTML = steps.map((step, index) => `
    <button type="button" class="step-button" data-nav="${index}">
      <span class="step-dot">${index + 1}</span>
      <span class="step-label"><strong>${step.title}</strong><small>${step.hint}</small></span>
    </button>
  `).join("");

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nav]");
    if (!button) return;
    setStep(Number(button.dataset.nav));
  });
}

function setStep(index) {
  state.currentStep = Math.max(0, Math.min(steps.length - 1, index));
  $$(".wizard-step").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === state.currentStep);
  });
  $$(".step-button").forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === state.currentStep);
    const tasks = tasksForStep(buttonIndex);
    const complete = tasks.length > 0 && tasks.every((task) => task.checked);
    button.classList.toggle("complete", complete);
  });
  $("#stepTitle").textContent = steps[state.currentStep].title;
  $("#prevBtn").disabled = state.currentStep === 0;
  $("#nextBtn").textContent = state.currentStep === steps.length - 1 ? "Finish" : "Next";
  updateProgress();
  updateSummary();
}

function tasksForStep(index) {
  const step = $(`.wizard-step[data-step="${index}"]`);
  return step ? Array.from(step.querySelectorAll("[data-task]")) : [];
}

function updateProgress() {
  const tasks = $$("[data-task]");
  const checked = tasks.filter((task) => task.checked).length;
  const percent = tasks.length ? Math.round((checked / tasks.length) * 100) : 0;
  $("#progressBar").style.width = `${percent}%`;
  $("#progressText").textContent = `${percent}% complete`;
}

function updateBulkPrep() {
  const ab1Count = Math.max(1, Math.round(numberValue("#ab1ReactionCount", 1)));
  $("#ab1ReactionCount").value = ab1Count;
  const ab1Multiplier = ab1Count * (1 + numberValue("#ab1Overage", 0));

  const ab2Count = Math.max(1, Math.round(numberValue("#ab2ReactionCount", 1)));
  $("#ab2ReactionCount").value = ab2Count;
  const ab2Multiplier = ab2Count * (1 + numberValue("#ab2Overage", 0));

  $("#ab1BulkPrep").innerHTML = [
    result("Antibody working stock", fmt(150 * ab1Multiplier, 1), "µL"),
    result("Sodium bicarbonate", fmt(16.8 * ab1Multiplier, 1), "µL"),
    result("Intermediate DIG-NHS", fmt(5 * ab1Multiplier, 1), "µL")
  ].join("");

  $("#ab2BulkPrep").innerHTML = [
    result("Antibody working stock", fmt(150 * ab2Multiplier, 1), "µL"),
    result("Sodium bicarbonate", fmt(16.8 * ab2Multiplier, 1), "µL"),
    result("Biotin-XX, SE", fmt(5.6 * ab2Multiplier, 1), "µL")
  ].join("");

  updateRecipes(ab1Multiplier, ab2Multiplier);
}

function updateRecipes(ab1Multiplier = 1, ab2Multiplier = 1) {
  $("#digRecipe").innerHTML = [
    result("Antibody working stock", fmt(150 * ab1Multiplier, 1), "µL"),
    result("Sodium bicarbonate, 75 mg/mL", fmt(16.8 * ab1Multiplier, 1), "µL"),
    result("Intermediate DIG-NHS, 0.67 mg/mL", fmt(5 * ab1Multiplier, 1), "µL")
  ].join("");

  $("#bioRecipe").innerHTML = [
    result("Antibody working stock", fmt(150 * ab2Multiplier, 1), "µL"),
    result("Sodium bicarbonate, 75 mg/mL", fmt(16.8 * ab2Multiplier, 1), "µL"),
    result("Biotin-XX, SE, 1 mg/mL", fmt(5.6 * ab2Multiplier, 1), "µL")
  ].join("");
}

function updateLabelCalculator() {
  const mass = numberValue("#proteinMass", 0);
  const mw = numberValue("#proteinMw", 1);
  const conc = numberValue("#labelConc", 1);
  const excess = numberValue("#molarExcess", 1);
  const label = $("#labelType").value;
  const labelMw = label === "dig" ? 658.78 : 567.69;
  const volumeMl = excess * (mass / mw) * (labelMw / conc);
  $("#labelVolume").textContent = `${fmt(volumeMl * 1000, 2)} µL ${label === "dig" ? "DIG-NHS" : "Biotin-NHS"} solution needed`;
}

function syncLabelDefaults() {
  const label = $("#labelType").value;
  $("#labelConc").value = label === "dig" ? "0.67" : "1";
  $("#molarExcess").value = label === "dig" ? "5" : "10";
  updateLabelCalculator();
}

function updateColumnChoice() {
  const kd = numberValue("#proteinKd", 0);
  let message = "Enter a protein molecular weight to choose a column.";
  if (kd > 40) message = "Use a 40K MWCO spin desalting column.";
  if (kd >= 7 && kd <= 40) message = "Use a 7K MWCO spin desalting column.";
  if (kd > 0 && kd < 7) message = "Below 7 kD is outside the guide's column recommendation; confirm a suitable cleanup method.";
  $("#columnChoice").textContent = message;
}

function updateQuantitation() {
  const od = numberValue("#odValue", 0);
  const pool = numberValue("#poolVolume", 0);
  const initial = od / 1.4;
  const rd2 = $("#addRd2").checked ? pool / 10 : 0;
  const finalConc = pool + rd2 > 0 ? (initial * pool) / (pool + rd2) : 0;
  $("#quantResults").innerHTML = [
    result("Initial antibody concentration", fmt(initial, 3), "mg/mL"),
    result("5X Reagent Diluent 2 to add", fmt(rd2, 3), "mL"),
    result("Final antibody concentration", fmt(finalConc, 3), "mg/mL")
  ].join("");
}

function suggestedWorkingVolume(reagent) {
  const wellVolume = reagent === "capture" ? numberValue("#captureVolume", 50) : numberValue("#detectVolume", 50);
  return (wellVolume * 48 / 1000) * (1 + numberValue("#workingOverage", 0));
}

function updateDilutionCalculator(reagent) {
  const label = reagent === "capture" ? "capture" : "detect";
  const stockUgMl = numberValue(`#${reagent}StockConc`, 0) * 1000;
  const target = numberValue(`#${reagent}TargetUg`, 0);
  const volumeMl = numberValue(`#${reagent}WorkingVolume`, 0);
  const suggestedMl = suggestedWorkingVolume(reagent);
  const stockMl = stockUgMl > 0 ? (target * volumeMl) / stockUgMl : 0;
  const canDilute = stockUgMl > target && target > 0 && volumeMl > 0;
  const diluentMl = canDilute ? volumeMl - stockMl : 0;
  const warning = canDilute ? "" : "Stock must be higher than target";
  const volumeNote = volumeMl < suggestedMl ? "Increase final volume or reduce overage" : "Volume covers selected cartridge inputs";
  $(`#${reagent}DilutionResults`).innerHTML = [
    result(`Suggested minimum ${label} volume`, fmt(suggestedMl, 2), "mL"),
    result("Conjugate stock to add", canDilute ? fmt(stockMl * 1000, 1) : warning, canDilute ? "µL" : ""),
    result("1X Reagent Diluent 2 to add", canDilute ? fmt(diluentMl, 3) : "Check inputs", canDilute ? "mL" : ""),
    result("Dilution ratio", canDilute ? `1:${fmt(stockUgMl / target, 1)}` : "Check inputs"),
    result("Volume check", volumeNote)
  ].join("");
}

function updateDilutions() {
  updateDilutionCalculator("capture");
  updateDilutionCalculator("detect");
}

function updateCartridgeTotals() {
  const capture = numberValue("#captureVolume", 50);
  const detect = numberValue("#detectVolume", 50);
  const samples = Math.max(0, Math.min(48, Math.round(numberValue("#sampleWells", 48))));
  $("#sampleWells").value = samples;
  const unusedSamples = 48 - samples;
  $("#cartridgeTotals").innerHTML = [
    result("DIG capture total for C wells", fmt(capture * 48 / 1000, 2), "mL"),
    result("Biotin detect total for D wells", fmt(detect * 48 / 1000, 2), "mL"),
    result("Sample/control total", fmt(samples * 50 / 1000, 2), "mL"),
    result("1X RD2 for unused sample wells", fmt(unusedSamples * 50 / 1000, 2), "mL"),
    result("Wash buffer total", "6", "mL")
  ].join("");
}

function updateSummary() {
  const lines = [
    "Ella 48-DIG Open Cartridge Prep Summary",
    `Progress: ${$("#progressText").textContent}`,
    "",
    `DIG capture reactions planned: ${$("#ab1ReactionCount").value}`,
    `Biotin detect reactions planned: ${$("#ab2ReactionCount").value}`,
    `DIG label volume calculator: ${$("#labelVolume").textContent}`,
    `Column recommendation: ${$("#columnChoice").textContent}`,
    "",
    "Quantitation",
    `OD280: ${$("#odValue").value}`,
    `Pool volume: ${$("#poolVolume").value} mL`,
    $("#quantResults").textContent.trim().replace(/\s+/g, " "),
    "",
    "Cartridge",
    `Capture C wells: ${$("#captureVolume").value} µL each`,
    `Detect D wells: ${$("#detectVolume").value} µL each`,
    `Sample wells used: ${$("#sampleWells").value} of 48`,
    $("#cartridgeTotals").textContent.trim().replace(/\s+/g, " "),
    "",
    "Capture dilution",
    $("#captureDilutionResults").textContent.trim().replace(/\s+/g, " "),
    "",
    "Detect dilution",
    $("#detectDilutionResults").textContent.trim().replace(/\s+/g, " ")
  ];
  $("#summary").value = lines.join("\n");
}

function resetChecks() {
  $$("[data-task]").forEach((task) => {
    task.checked = false;
  });
  setStep(state.currentStep);
}

function bindEvents() {
  $$("input, select").forEach((input) => {
    input.addEventListener("input", runCalculations);
    input.addEventListener("change", runCalculations);
  });

  $$("[data-task]").forEach((task) => {
    task.addEventListener("change", () => setStep(state.currentStep));
  });

  $("#labelType").addEventListener("change", syncLabelDefaults);
  $("#defaultTargetUg").addEventListener("input", () => {
    $("#captureTargetUg").value = $("#defaultTargetUg").value;
    $("#detectTargetUg").value = $("#defaultTargetUg").value;
    runCalculations();
  });
  $("#defaultWorkingVolume").addEventListener("input", () => {
    $("#captureWorkingVolume").value = $("#defaultWorkingVolume").value;
    $("#detectWorkingVolume").value = $("#defaultWorkingVolume").value;
    runCalculations();
  });
  $("#prevBtn").addEventListener("click", () => setStep(state.currentStep - 1));
  $("#nextBtn").addEventListener("click", () => {
    if (state.currentStep < steps.length - 1) setStep(state.currentStep + 1);
    else updateSummary();
  });
  $("#resetBtn").addEventListener("click", resetChecks);
  $("#copySummary").addEventListener("click", async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText($("#summary").value);
    } else {
      $("#summary").focus();
      $("#summary").select();
      document.execCommand("copy");
    }
    $("#copySummary").textContent = "Copied";
    window.setTimeout(() => {
      $("#copySummary").textContent = "Copy Summary";
    }, 1200);
  });
}

function runCalculations() {
  updateBulkPrep();
  updateLabelCalculator();
  updateColumnChoice();
  updateQuantitation();
  updateCartridgeTotals();
  updateDilutions();
  updateSummary();
}

renderNav();
bindEvents();
runCalculations();
setStep(0);
initDisclaimer();
