import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // your gmail
    pass: process.env.EMAIL_PASS     // your app password
  }
});

export const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"EMS System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
