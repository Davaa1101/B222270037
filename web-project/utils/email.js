const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email хаягаа баталгаажуулна уу',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <p>Barter Platform-д тавтай морилно уу!</p>
        <p>Email хаягаа баталгаажуулахын тулд доорх товч дээр дарна уу:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Email баталгаажуулах
          </a>
        </div>
        <p>Эсвэл доорх холбоосыг хуулж хөтчид буулгана уу:</p>
        <p style="word-break: break-all; color: #666;">
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Энэ холбоос 24 цагийн дотор дуусах болно.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Нууц үг сэргээх хүсэлт',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
        <p>Шинэ нууц үг тохируулахын тулд доорх товч дээр дарна уу:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Нууц үг сэргээх
          </a>
        </div>
        <p>Эсвэл доорх холбоосыг хуулж хөтчид буулгана уу:</p>
        <p style="word-break: break-all; color: #666;">
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          Энэ холбоос 1 цагийн дотор дуусах болно.
        </p>
        <p style="color: #666; font-size: 12px;">
          Хэрэв та нууц үг сэргээх хүсэлт илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send notification email
const sendNotificationEmail = async (email, name, subject, message) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Barter Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Сайн байна уу ${name}!</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${message}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Энэ имэйлийг Barter Platform-аас илгээсэн болно.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send offer notification
const sendOfferNotification = async (email, name, itemTitle, offerMessage) => {
  const message = `
    <p>Таны "${itemTitle}" зар дээр шинэ санал ирлээ!</p>
    <p><strong>Санал:</strong> ${offerMessage}</p>
    <p>Дэлгэрэнгүй мэдээллийг платформ дээрээс үзнэ үү.</p>
  `;
  
  await sendNotificationEmail(email, name, 'Шинэ бартер санал ирлээ', message);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  sendOfferNotification
};