const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');
const { readSync } = require('fs');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');
const src = fs.readFileSync(campaignPath, 'utf8');
const output = solc.compile(src, 1).contracts;

fs.ensureDirSync(buildPath); //create build folder

for(let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(':', '') + '.json'), 
    output[contract] //contents we want to write to json file in build folder
  )
}