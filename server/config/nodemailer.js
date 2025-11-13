import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.smtp2go.com',
  port: 2525,               
  secure: false,            
  auth: {
    user:"gyannidhi.in",  
    pass:"4RCC2zbYPQxPsdpn"
  },
  connectionTimeout: 60000,
  socketTimeout: 60000,
  greetingTimeout: 30000
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP2GO verification failed:', error);
  } else {
    console.log('SMTP2GO is ready to send messages');
  }
});

export default transporter;