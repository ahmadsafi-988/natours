import '@babel/polyfill';
import { logIn, logOut } from './logIn';
import { displayMap } from './mapBox';
import { updateSetting } from './updateSettings';
import { bookTour } from './stripe';

// selectors
const form = document.getElementById('loginForm');
const map = document.getElementById('map');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (map) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations,
  );
  displayMap(locations);
}

if (form) {
  form.addEventListener('submit', function (e) {
    // preventing default
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    logIn(email, password);
  });
}

if (updateDataForm) {
  updateDataForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSetting(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'updating...';

    const password = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateSetting(
      { password, newPassword, newPasswordConfirm },
      'password',
    );

    document.querySelector('.btn--save--password').textContent =
      'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logOut);
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
