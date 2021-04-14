const admin = require('firebase-admin')

const {
  type,
  project_id,
  private_key_id,
  private_key,
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
} = process.env

const serviceAccount = {
  type,
  project_id,
  private_key_id,
  private_key: private_key.replace(/\\n/g, '\n'),
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
}

console.log({ serviceAccount })

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

module.exports = { admin, db }
