import axios from 'axios';
import { showAlert } from './alert';

export const logIn = async function (email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.status === 200) {
      showAlert('success', 'logged in went successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    console.log('error');
    showAlert('error', err.response.data.message);
  }
};

export const logOut = async function () {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.status === 200) {
      // location.reload(true);
      location.replace('/');
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'error logging out , please try again !');
  }
};
