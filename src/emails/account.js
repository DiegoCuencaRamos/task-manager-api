const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    try {
        sgMail.send({
            to: email,
            from: 'diego.cuenca.dev@gmail.com',
            subject: 'Welcome message',
            text: `Welcome to the app, ${name}. Let me know how you get along with it.`,
        })
        console.log('Email sent')
    } catch(e) {
        console.error(error)
    }
}

const sendCancelationEmail = (email, name) => {
    try {
        sgMail.send({
            to: email,
            from: 'diego.cuenca.dev@gmail.com',
            subject: 'Cancelation message',
            text: `${name} ,we are sorry that you leave. What could we do better for you to continue with us?`,  
        })
        console.log('Email sent')
    } catch(e) {
        console.error(error)
    }
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}

