import * as crypto from 'crypto-js';

class Block {
	public index: number;
	public data: string;
	public hash: string;
	public prev_hash: string;
	public timestamp: number;

	constructor(index: number, data: string, hash: string, prev_hash: string, timestamp: number) {
		this.index = index;
		this.data = data;
		this.hash = hash;
		this.prev_hash = prev_hash;
		this.timestamp = timestamp;
	}

	calculate_hash = (): string => {
		const curr_hash: string = crypto.SHA256(this.index + this.prev_hash + this.timestamp + this.data).toString();
		return curr_hash;
	}

	is_valid_block = (new_block: Block, prev_block: Block): boolean => {
		if (new_block.index !== prev_block.index + 1) {
			console.log("\u001b[31mWarning: The new block is invalid.\nindex in not contigous\u001b[0m");
			return false;
		}
		if (new_block.prev_hash !== prev_block.hash) {
			console.log("\u001b[31mWarning: The new block is invalid.\nprevious hash is invalid\u001b[0m");
			return false;
		}

		return true;
	}
}

export const genesis_block: Block = new Block(0, "Genesis block", "", "", new Date().getTime() / 1000);
genesis_block.hash = genesis_block.calculate_hash();
var blockchain: Block[] = [genesis_block];

const get_blockchain = (): Block[] => blockchain;
const get_latest_block = (): Block => blockchain[blockchain.length - 1];

function generate_new_block(block_data: string): Block {
	const prev_block: Block = get_latest_block();
	const index: number = prev_block.index + 1;
	const prev_hash: string = prev_block.hash;
	const timestamp: number = new Date().getTime() / 1000;
	const new_block: Block = new Block(index, block_data, "", prev_hash, timestamp);
	new_block.hash = new_block.calculate_hash();
	add_block(new_block);
	return new_block;
}

function validate_block(new_block: Block, prev_block: Block): boolean {
	const block_structute = (block: Block): Boolean => {
		return typeof block.index === 'number'
			&& typeof block.data === 'string'
			&& typeof block.hash === 'string'
			&& typeof block.prev_hash === 'string'
			&& typeof block.timestamp === 'number'
	}

	if (!block_structute(new_block)) {
		console.log(`\u001b[31mWarning: The block at index ${new_block.index} is invalid.\nBlock structure is inconsistent\u001b[0m`)
		return false;
	}
	if (new_block.index !== prev_block.index + 1) {
		console.log(`\u001b[31mWarning: The block at index ${new_block.index} is invalid.\nindex in not contigous\u001b[0m`);
		return false;
	}
	if (new_block.prev_hash !== prev_block.hash) {
		console.log(`\u001b[31mWarning: The block at index ${new_block.index} is invalid.\nprevious hash is invalid\u001b[0m`);
		return false;
	}

	return true;
}

function validate_chain(blockchain: Block[]): boolean {
	const validate_genesis = (curr_block: Block): boolean => {
		return curr_block.index === genesis_block.index &&
			curr_block.data === genesis_block.data &&
			curr_block.hash === genesis_block.hash &&
			curr_block.prev_hash === genesis_block.prev_hash &&
			curr_block.timestamp === genesis_block.timestamp;
	}

	if (!validate_genesis(blockchain[0])) {
		return false;
	}

	for (let i = 1; i < blockchain.length; i++) {
		if (!validate_block(blockchain[i], blockchain[i - 1]))
			return false;
	}
	return true;
}

function add_block(new_block: Block): boolean {
	if (validate_block(new_block, get_latest_block())) {
		blockchain.push(new_block);
		return true
	}
	return false;
}

function replace_chain(new_chain: Block[]): boolean {
	if (validate_chain(new_chain) && new_chain.length > blockchain.length) {
		blockchain = new_chain;
		console.log("Blockchain updated!!\n");
		return true;
	}

	console.log("Invalid Chain created: Blockchain not updated\n");
	return false;
}

export { Block, get_blockchain, generate_new_block, replace_chain }
