// O adaptador só produz um resultado local e nunca abre conexões.
function simulateMail({ fail = false } = {}) {
  return fail ? 'simulated_failure' : 'simulated_success';
}
module.exports = { simulateMail };
