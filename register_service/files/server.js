/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Hyperledger Fabric CA Related imports
const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');

const fs = require('fs');
const path = require('path');

const ccpPath = path.resolve(__dirname, '.', 'connection_profile.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const ORGANISATION_MSP = "{{org.name}}MSP";
const CA_ORGANISATION_NAME = "{{admin.orgca}}";

function enrollAdmin() {
    try {


        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities[CA_ORGANISATION_NAME];
        console.log(caInfo);
        const caTLSCACerts = ["{{admin.path/ca.crt}}"];
        //const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');

        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists("{{admin.name}}");
        if (adminExists) {
            console.log('An identity for the admin user "{{admin.name}}" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: "{{admin.name}}", enrollmentSecret: "{{admin.password}}" });
        const identity = X509WalletMixin.createIdentity(ORGANISATION_MSP, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import("{{admin.name}}", identity);
        console.log('Successfully enrolled admin user "{{admin.name}}" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "{{admin.name}}": ${error}`);
        process.exit(1);
    }
}

// Node Express Related imports
const util = require('util');
const os = require('os');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');


// Setting up https
var options = {
    key: fs.readFileSync('{{admin.path}}/tls/server.key'),
    cert: fs.readFileSync('{{admin.path}}/tls/server.crt'),
    ca: fs.readFileSync('{{admin.path}}/tls/ca.crt')
}

// Create a service (the app object is just a callback).
var app = express();
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/', async function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end('here i am \n');

})

app.post('/register', async function (req, res) {
    var status = false;
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(req.body.username);
        if (userExists) {
            console.log('An identity for the user "' + req.body.username + '" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists("{{admin.name}}");
        if (!adminExists) {
            console.log('An identity for the admin user "{{admin.name}}" does not exist in the wallet');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: "{{admin.name}}", discovery: { enabled: true, asLocalhost: true } });


        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();


        // Register the user, enroll the user, and import the new identity into the wallet.
        await ca.register({ enrollmentID: req.body.username, role: "client", enrollmentSecret: req.body.password }, adminIdentity);
        console.log('Successfully registered user "' + req.body.username + '" with role client"');

    } catch (error) {
        console.error(`Failed to register user": ${error}`);
        process.exit(1);
    }
})

var server = https.createServer(options, app);

server.listen(server_config.port, function () {
    console.info('****************** SERVER STARTED ************************');
    console.info('***************  https://%s:%s  ******************', server_config.host, server_config.port);
    enrollAdmin();
});
