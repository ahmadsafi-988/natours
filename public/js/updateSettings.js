import axios from 'axios';
import { showAlert } from './alert';

export const updateSetting = async function (data, type) {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.status === 200) {
      showAlert('success', `${type.toUpperCase()} updated successfully !`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
