const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyA7YfwU0pbupDR8dC1dfsPJ7MVnJvi1NFnFllNVTAPn9fW-C6UJY5m2pEe9k5iR6t3AQ/exec";
const SUCCESS_STATUS_TIMEOUT_MS = 2500;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function renderMode(tipo) {
  document.querySelector("#gastoFields").classList.toggle("hidden", tipo !== "gasto");
  document.querySelector("#cuotaFields").classList.toggle("hidden", tipo !== "cuota");
}

function setStatus(message, kind) {
  const box = document.querySelector("#statusBox");
  box.textContent = message;
  box.className = `status ${kind}`;
}

function clearStatus() {
  const box = document.querySelector("#statusBox");
  box.textContent = "";
  box.className = "status hidden";
}

function setSubmitting(isSubmitting) {
  const submitButton = remoteEntryForm.querySelector('button[type="submit"]');
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Enviando..." : "Guardar";
}

function applyRemoteResult(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  if (payload.ok) {
    setSubmitting(false);
    resetAfterSuccess(remoteEntryForm);
    setStatus("Entrada guardada. Se importara en la proxima sincronizacion.", "ok");
    window.clearTimeout(successStatusTimer);
    successStatusTimer = window.setTimeout(() => {
      clearStatus();
    }, SUCCESS_STATUS_TIMEOUT_MS);
    return true;
  }
  if (payload.error) {
    setSubmitting(false);
    setStatus(payload.error || "No se pudo guardar", "error");
    return true;
  }
  return false;
}

function prepareForm(form) {
  form.action = WEB_APP_URL;
  form.method = "POST";
  form.target = "remoteSubmitFrame";
  form.querySelector("#redirectUrlInput").value = new URL("./callback.html", window.location.href).href;

  const tipo = form.querySelector('[name="tipo_registro"]').value;
  const startMonthInput = form.querySelector('[name="start_month"]');
  const installmentsInput = form.querySelector('[name="installments"]');
  const txTypeInput = form.querySelector('[name="tx_type"]');
  const fecha = form.querySelector('[name="fecha"]').value;

  if (tipo === "gasto") {
    startMonthInput.value = "";
    installmentsInput.value = "";
  }

  if (tipo === "cuota") {
    if (!startMonthInput.value && fecha) {
      startMonthInput.value = fecha.slice(0, 7);
    }
    if (!installmentsInput.value) {
      installmentsInput.value = "1";
    }
  }

  if (tipo !== "gasto") {
    txTypeInput.value = "";
  }
}

function resetAfterSuccess(form) {
  form.reset();
  form.querySelector('input[name="fecha"]').value = today();
  form.querySelector('[name="tipo_registro"]').value = "gasto";
  renderMode("gasto");
  remoteSubmitFrame.src = "about:blank";
  form.querySelector('input[name="pin"]').focus();
}

const remoteEntryForm = document.querySelector("#remoteEntryForm");
const remoteSubmitFrame = document.querySelector("#remoteSubmitFrame");
let successStatusTimer = 0;
document.querySelector('input[name="fecha"]').value = today();
document.querySelector("#tipoRegistro").addEventListener("change", event => renderMode(event.target.value));
renderMode(document.querySelector("#tipoRegistro").value);

window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) {
    return;
  }
  applyRemoteResult(event.data);
});

remoteSubmitFrame.addEventListener("load", () => {
  try {
    const currentUrl = remoteSubmitFrame.contentWindow.location.href;
    if (!currentUrl || !currentUrl.startsWith(window.location.origin)) {
      return;
    }
    const frameUrl = new URL(currentUrl);
    const rawPayload = frameUrl.hash.startsWith("#payload=")
      ? frameUrl.hash.slice("#payload=".length)
      : "";
    if (!rawPayload) {
      return;
    }
    const payload = JSON.parse(decodeURIComponent(rawPayload));
    applyRemoteResult(payload);
  } catch (error) {
    // The iframe is cross-origin until it reaches callback.html.
  }
});

remoteEntryForm.addEventListener("submit", event => {
  window.clearTimeout(successStatusTimer);
  prepareForm(event.currentTarget);
  setSubmitting(true);
  setStatus("Enviando...", "ok");
});
