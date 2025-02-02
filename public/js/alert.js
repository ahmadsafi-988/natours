export const hideAlert = function () {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

export const showAlert = function (type, msg) {
  hideAlert();
  const html = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', html);

  window.setTimeout(hideAlert, 5000);
};
