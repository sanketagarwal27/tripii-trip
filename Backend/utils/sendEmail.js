import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailContent = emailTemplate(
    options.subject,
    options.message,
    options.btn
  );

  await transporter.sendMail({
    from: `"TripiiTrip Support" <priyadarshihimanshu6@gmail.com>`,
    to: options.email,
    subject: options.subject,
    html: mailContent,
  });
};

export default sendEmail;

// This function returns a string of HTML with inline CSS
const emailTemplate = (title, message, btn = null) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      
      <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px;">${title}</h2>
      </div>

      <div style="padding: 30px; background-color: #ffffff; color: #333333; line-height: 1.6;">
        ${message} ${
    btn
      ? `<div style="text-align: center; margin-top: 30px;">
                 <a href="${btn.url}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   ${btn.text}
                 </a>
               </div>`
      : ""
  }
      </div>

      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} TripiiTrip. All rights reserved.</p>
        <p style="margin: 5px 0 0;">This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;
};
