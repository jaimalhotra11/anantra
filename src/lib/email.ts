// import nodemailer from 'nodemailer'
// import dotenv from 'dotenv'

// dotenv.config()

// // Email configuration
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
// })


// export async function sendEmail(to: string, subject: string, name: string, html: string) {
//   try {
//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to,
//       subject,
//       html
//     }

//     console.log(await transporter.sendMail(mailOptions))
//     return { success: true }
//   } catch (error) {
//     console.error('Error sending email:', error)
//     return { success: false, error }
//   }
// }