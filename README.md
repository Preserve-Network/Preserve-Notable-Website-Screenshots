# Preserve Notable Website Screenshots

A project to screenshot and preserve interesting or news worthy website homepages

## How

This script uses the https://github.com/Preserve-Network/Preserve-Framework and https://github.com/puppeteer/puppeteer libraries and the alchemy.com api to upload daily screenshots of news worthy websites to the Polygon Blockchain. The screenshots are stored on filecoin through http://web3.storage along with metadata to identify the content. The files are then index on the Polygon blockchain for immutability.

## Getting started

To run successfully, the accounts that you have set for the network must have enough "gas" to write the transaction.

To deploy on the mainset you'll need the following env variables set and the preserve smart contract deployed to the mainnet. See https://github.com/Preserve-Network/Preserve-Framework for instructions on how to do that.

node .\index.js --network mainnet --indexFiles --deleteFiles
