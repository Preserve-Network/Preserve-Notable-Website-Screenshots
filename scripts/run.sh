#!/bin/bash
cd /usr/local/var/www/Preserve-Notable-Website-Screenshots
time PATH=/usr/local/var/www/Preserve-Notable-Website-Screenshots/node_modules /usr/local/bin/node index.js --network mainnet --indexFiles true --deleteFiles true
