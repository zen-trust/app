// import { env } from 'node:process'
// import { Buffer } from 'node:buffer'
// import * as db from 'zapatos/db'
// import type { InsertableForTable, JSONSelectableForTable } from 'zapatos/schema'
// import { pool } from './pg-pool'
// import {
//   generateKeyPair,
//   issueIntermediateCertificateAuthority,
//   issueRootCertificateAuthority,
//   signCertificate,
// } from './crypto/certificates'
// import type { PrivateKey } from './crypto/certificate'
// import { decryptPrivateKey, encryptPrivateKey } from './crypto/encryption'
//
// //- 1. Create a root CA certificate and sign it with itself.
// //- 1.1 Encrypt the private key with a randomly generated key.
// // 1.2 Encrypt the key with either...
// // 1.2.a a user-provided password, or
// // 1.2.b shamir's secret sharing scheme (show the user the shares, and ask them to store them somewhere safe).
// //- 1.3 Concatenate the encrypted key, encrypted private key, and their IVs into a single buffer.
// //- 1.4 Save the CA and its encrypted private key to the DB.
// // 2. Create one or more intermediate CA certificate, sign it with the root CA, and save it to the DB.
// // 2.1 Encrypt the private key with the global encryption secret.
// // 5. Create a certificate, sign it with the intermediate CA, and print it to the user.
// // 6. ???
// // 7. Profit!
// async function main() {
//   const existing: JSONSelectableForTable<'root_ca'> | undefined = await db
//     .selectOne('root_ca', { is_revoked: false })
//     .run(pool)
//
//   if (existing) {
//     const privateKey: PrivateKey = decryptPrivateKey(
//       Buffer.from(existing.encrypted_private_key.slice(2), 'hex'),
//       Buffer.from(env.SECRET_KEY || '', 'base64'),
//     )
//
//     console.log(privateKey)
//
//     return
//   }
//
//   const rootCa = issueRootCertificateAuthority(await generateKeyPair(2048), {
//     commonName: 'Zen Trust Root CA',
//     serialNumber: '01',
//   })
//
//   // const rootCaEncryptionSecret = crypto.randomBytes(32);
//   const rootCaEncryptionSecret = Buffer.from(env.SECRET_KEY || '', 'base64')
//
//   const encryptedPrivateKey = encryptPrivateKey(rootCa.privateKey, rootCaEncryptionSecret)
//
//   const inserted = await db
//     .insert('root_ca', {
//       subject: rootCa.commonName || '',
//       certificate: rootCa.toBuffer(),
//       encrypted_private_key: encryptedPrivateKey,
//       serial_number: rootCa.serialNumber,
//       valid_until: rootCa.validUntil.toISOString(),
//     } as InsertableForTable<'root_ca'>)
//     .run(pool)
//
//   console.log(`Inserted CA as ${inserted.id}`)
//
//   if (inserted.id > 0) {
//     return
//   }
//   const intermediateCa = issueIntermediateCertificateAuthority(
//     await generateKeyPair(2048),
//     rootCa,
//     {
//       commonName: 'Zen Trust Intermediate CA',
//       serialNumber: '02',
//     },
//   )
//   signCertificate(rootCa, intermediateCa, 'sha512')
//
//   console.log(intermediateCa.toString())
// }
//
// main().catch(console.error)
