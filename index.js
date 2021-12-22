const PRIVATE_KEY = process.argv.slice(2)[0];
// console.log(PRIVATE_KEY);

const Web3 = require('web3');

const RPC_URL = 'https://speedy-nodes-nyc.moralis.io/3059860b58c72da9ca7dc1ec/eth/mainnet';
//const RPC_URL = 'https://speedy-nodes-nyc.moralis.io/b5ff4012083d66a83fad1e18/eth/mainnet';
const ADDRESS = '0x7DD0C5645Ce647ed46D269bd62676308F4fd5dEE';
const OTHER_ADDRESS = '0xBbbbbBB86db8A5056C3E8d19BFC173Ec6659dC8D';

// load web3
const web3 = new Web3(RPC_URL);

function callAgain() {
	setTimeout(() => {
		doStuff();
	}, 1200);
}

let mult = 1.47;
const MULT = 1.47;
const LOWEST_MULT = 0.97;
const STEP = 0.05;

const trx = {
	from: ADDRESS,
	to: OTHER_ADDRESS
};
let currentGasPrice, gasLimit;
let balance;
async function tryTrx() {
	mult -= STEP;
	trx.gasPrice = Math.ceil(currentGasPrice * mult);

	if (mult < 0.95) {
		console.log('All in Fee Exit');
		mult = MULT;
		callAgain();
		return;
	}

	try {
		delete trx['value'];

		const trxFee = gasLimit * trx.gasPrice;

		trx.value = balance - trxFee;

		if (trx.value > 0) {
			console.log(`Sending with ${mult}x`);

			try {
				const signedTrx = await web3.eth.accounts.signTransaction(trx, PRIVATE_KEY);
				const sentTrx = await web3.eth.sendSignedTransaction(signedTrx.rawTransaction);
				console.log(sentTrx);
				
				callAgain();
			} catch (ex) {
				console.log(`Exception 1.1 with ${mult}x`);
				tryTrx();
			}
		} else {
			console.log(`Would fail with ${mult}x`);
			tryTrx();
		}
	} catch (ex) {
		// console.log(ex);
		console.log(`Exception 1 with ${mult}x`);
		tryTrx();
	}
}

function wouldLowestPass() {
	const gasPrice = Math.ceil(currentGasPrice * LOWEST_MULT);
	const trxFee = gasLimit * gasPrice;
	
	return balance > trxFee;
}

async function doStuff() {
	balance = await web3.eth.getBalance(ADDRESS);
	console.log(`Balance = ${web3.utils.fromWei(balance)} ETH`);

	if (balance <= 100000000000000) {
		console.log('Zero Balance Exit');
		callAgain();
		return;
	}

	currentGasPrice = await web3.eth.getGasPrice();
	gasLimit = await web3.eth.estimateGas(trx);
	trx.gas = gasLimit;

	if (wouldLowestPass()) tryTrx();
	else {
		console.log(`Lowest ${LOWEST_MULT} would fail`);
		callAgain();
	}
}


// call the function
doStuff();