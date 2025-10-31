const sgMail = require('@sendgrid/mail')

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { email, displayName } = payload
  if (!email) return { statusCode: 400, body: 'Missing email' }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const FROM = process.env.SENDGRID_FROM || 'no-reply@comptability.app'
  if (!SENDGRID_API_KEY) {
    console.error('Missing SENDGRID_API_KEY env var')
    return { statusCode: 500, body: 'Email provider not configured' }
  }

  sgMail.setApiKey(SENDGRID_API_KEY)

  const html = `
    <p>Bonjour ${displayName || ''},</p>
    <p>Merci de vous être inscrit·e sur <strong>Comptability Baby</strong> — votre compte a bien été créé.</p>
    <p>Vous pouvez maintenant vous connecter et commencer à gérer vos revenus et dépenses.</p>
    <p>À bientôt,<br/>L'équipe Comptability Baby</p>
  `

  const msg = {
    to: email,
    from: FROM,
    subject: 'Bienvenue sur Comptability Baby',
    html
  }

  try {
    await sgMail.send(msg)
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('SendGrid error', err)
    return { statusCode: 502, body: 'Failed to send email' }
  }
}
