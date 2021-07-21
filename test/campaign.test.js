const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

//abi of contracts
const compileFactory = require('../ethereum/build/CampaignFactory.json');
const compileCampaign = require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts(); //accounts array are created by ganache and 10 acconts are automatically generated
  factory = await new web3.eth.Contract(JSON.parse(compileFactory.interface))
  .deploy({ data : compileFactory.bytecode })
  .send({ from: accounts[0], gas: '1000000' });

  await factory.methods.createCampaign('100').send({ from: accounts[0], gas: '1000000' });
  [campaignAddress] = await factory.methods.getDeployedCampaigns().call(); //return first element of array of campaigns 

  campaign = await new web3.eth.Contract(
    JSON.parse(compileCampaign.interface),
    campaignAddress
  )
})

describe('campaigns', () => {
  it('deploys a factory and a campaign instance', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it('the caller is the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(manager, accounts[0]);
  });

  it('contributors are marked as approvers', async () => {
    await campaign.methods.contribute().send({value: '200', from: accounts[1]});
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  it('campaign has minimumn contribution', async () => {
    try {
      await campaign.methods.contribute().send({value: '5', from: accounts[1]});
      assert(false)
    } catch (err){
      assert(err);
    }
  })

  it('allows manager to make a request', async () => {

      await campaign.methods.createRequest('request desc', '10', accounts[3])
      .send({
        from: accounts[0],
        gas: '1000000'
      })
    const request = await campaign.methods.requests(0).call();
    assert.equal('request desc', request.description)
  });

  it('processes request', async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether')
    });

    await campaign.methods.createRequest('need to buy turtles', web3.utils.toWei('5', 'ether'), accounts[1])
    .send({from: accounts[0], gas: '1000000'});

    await campaign.methods.approveRequest(0).send({from: accounts[0], gas: '1000000'})

    await campaign.methods.finalizeRequest(0).send({from: accounts[0], gas: '1000000'})

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);
    let request = await campaign.methods.requests(0).call()

    assert(request.complete)
    assert(balance > 102)
  })
});

