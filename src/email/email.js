const nodemailer = require('nodemailer');

const email = async (target,subject,body)=>{
    let transporter = nodemailer.createTransport({
        host: "smtp.yandex.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.YANDEX_EMAIL, // generated ethereal user
            pass: process.env.YANDEX_PASSWORD // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Too Doo 👻" <${process.env.YANDEX_EMAIL}>`, // sender address
        to: target, // list of receivers
        subject: subject, // Subject line
        text: '', // plain text body
        html: body // html body
    });
// lemmeDo
    console.log("Message sent: %s", info.messageId);

};

module.exports = email;
