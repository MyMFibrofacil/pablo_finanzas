const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwClvt1DoOa9-emPUu_onPx0sh2GN3mOayttZSOT4Q7NyOUTQt8EjKjQXu173G66mRypg/exec";

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
}

const remoteEntryForm = document.querySelector("#remoteEntryForm");
document.querySelector('input[name="fecha"]').value = today();
document.querySelector("#tipoRegistro").addEventListener("change", event => renderMode(event.target.value));
renderMode(document.querySelector("#tipoRegistro").value);

window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) {
    return;
  }
  if (!event.data || typeof event.data !== "object") {
    return;
  }
  if (event.data.ok) {
    resetAfterSuccess(remoteEntryForm);
    setStatus("Entrada guardada. Se importara en la proxima sincronizacion.", "ok");
    return;
  }
  setStatus(event.data.error || "No se pudo guardar", "error");
});

remoteEntryForm.addEventListener("submit", event => {
  prepareForm(event.currentTarget);
  setStatus("Enviando...", "ok");
});
