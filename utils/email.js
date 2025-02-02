/* eslint-disable prefer-template */
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `ahmadsafi <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // use sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) render html based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2) define the options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) create the transport and send the email
    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'welcome to the natours family !');
  }

  async sendPasswordReset() {
    await this.send(
      'resetPassword',
      'your password reset token is valid just for 10 minutes',
    );
  }
};

// module.exports = sendEmail;

//// REF
// const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     // if we want to use the gmail we need to activate less-secure option in the gmail setting
//     // we dont use gmail , because we have a limit of 500 messages per day so we will use
//     // sendgrid or mailgun

//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   console.log(process.env.EMAIL_HOST);
//   console.log(process.env.EMAIL_USERNAME);
//   console.log(process.env.EMAIL_PASSWORD);

//   const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//       user: 'easter.armstrong10@ethereal.email',
//       pass: 'Sd5WRExBCF6fqsdhrP',
//     },
//   });

// const sendEmail = async function (options) {
//   // 1) first we need tp create a transporter which's the service that's gonna send the email
//   // of course not the node js will send it
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const emailOptions = {
//     from: 'ahmadsafi <ahmadmadisafi9@gmail.com>',
//     to: `someone <${options.to}>`,
//     subject: options.subject,
//     text: options.text,
//   };

//   // Verify connection configuration
//   await transporter.verify();
//   console.log('is ready !!');

//   //   3) send the email
//   await transporter.sendMail(emailOptions);
// };
