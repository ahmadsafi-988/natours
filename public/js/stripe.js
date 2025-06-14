import axios from 'axios';

const stripe = Stripe(
  'pk_test_51QnhNqRtFHUdKAxbEJkCugC8KxxP7MdJQdDZTvGFRd07ymrFpFuyvbEwtVw266PISPtRRvX2Z2aTPUTXyrF7fWGs00Coo3wiff',
);

export const bookTour = async function (tourId) {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
  }
};
