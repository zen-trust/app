<p align="center">
  <img alt="Zen Trust Logo" src="./packages/client/public/logo.png" />
</p>

Zen Trust
=========

Zen Trust is a self-hosted SSH certificate authority, providing short-lived certificates for users and hosts.

## Features

* Short-lived certificates
* Revocation, renewal and rekeying
* SSH CA signing key rotation
* Fine-grained access control
* Certificate bundling
* SSH agent forwarding

## Todo list

- [ ] SSH certificate bundling
- [ ] Implement OAuth
- [ ] Use [RFC9470](https://datatracker.ietf.org/doc/html/rfc9470) to swap the encryption session stuff for re-auth
  using stronger mechanisms

## Installation

TODO

## Usage

1. Issue a CA root certificate
2. Store the CA root certificate
3. Issue an intermediate CA certificate
4. Store the intermediate CA certificate
5. Issue a certificate using the intermediate CA

------------------------------------------------------------------------

<!-- CLI docs below -->

#### The `zen` CLI

Command line interface for zen

#### Options

| Argument   | Alias | Type    | Description                     |
|------------|-------|---------|---------------------------------|
| **name**   | **n** | string  | Optional.                       |
| **config** | **c** | string  | Optional. Path to a config file |
| **help**   | **h** | boolean | Show this help message          |

#### Amendments

Made with <3 by Moritz Friedrich

<!-- CLI docs above -->
