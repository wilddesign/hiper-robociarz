const mail = require("nodemailer");

const TOKEN = process.env.APP_TOKEN;
const USER_EMAIL = process.env.USER_EMAIL;

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD;

export class MailSender {
  static send(text: string, title: string) {
    const transporter = mail.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      service: "gmail",
      secure: true,
      auth: {
        user: SENDER_EMAIL,
        pass: SENDER_EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: SENDER_EMAIL,
      to: USER_EMAIL,
      subject: title,
      text: text + `\n use token ${TOKEN} to modify`,
    };

    transporter.sendMail(
      mailOptions,
      function (error: unknown, info: { response: unknown }) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );
  }
}
