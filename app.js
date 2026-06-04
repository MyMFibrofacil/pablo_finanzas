const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwClvt1DoOa9-emPUu_onPx0sh2GN3mOayttZSOT4Q7NyOUTQt8EjKjQXu173G66mRypg/exec";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formPayload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.action = "create_entry";
  if (data.tipo_registro === "gasto") {
    data.installments = "";
    data.start_month = "";
  }
  if (data.tipo_registro === "cuota" && !data.start_month) {
    data.start_month = data.fecha.slice(0, 7);
  }
  return data;
}

async function sendEntry(payload) {
  const response = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "No se pudo guardar");
  }
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

document.querySelector('input[name="fecha"]').value = today();
document.querySelector("#tipoRegistro").addEventListener("change", event => renderMode(event.target.value));
renderMode(document.querySelector("#tipoRegistro").value);

document.querySelector("#remoteEntryForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await sendEntry(formPayload(event.currentTarget));
    event.currentTarget.reset();
    document.querySelector('input[name="fecha"]').value = today();
    renderMode("gasto");
    setStatus("Entrada guardada. Se importara en la proxima sincronizacion.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
});
