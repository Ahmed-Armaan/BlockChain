import WebSocket, { Server } from "ws";
import { get_latest_block, get_blockchain, Block, validate_block_structure, replace_chain, add_block } from "./block";

const Port: number = 8000
let peer_sockets: WebSocket[];
type Message = {
	type: number,
	data: any,
}

const JSON_to_obj = <T>(message_data: string): T => {
	try {
		return JSON.parse(message_data);
	}
	catch (e) {
		console.log(e);
		return {} as T;
	}
}

function init_server(): void {
	const wss = new WebSocket.Server({ port: Port });
	wss.on('connection', (ws: WebSocket) => {
		init_peer_connection(ws);
	})
	console.log(`P2P server running at ${Port}`);
}

function init_peer_connection(ws: WebSocket) {
	peer_sockets.push(ws);
	init_message_handler(ws);
	init_error_handler(ws);
	write(ws, chain_length());
}

function init_message_handler(ws: WebSocket) {
	ws.on('message', (data: string) => {
		const message: Message = JSON_to_obj(data);
		if (Object.keys(message).length === 0) {
			console.log("The message could not be parser or is empty\n", + data);
			return;
		}

		console.log("received message = ", + message.data);
		switch (message.type) {
			case 1: // get_latest_block
				write(ws, response_message(1));
				break;
			case 2: // get blockchain
				write(ws, response_message(2));
				break;
			case 3: // validate users blockchain data
				const blocks: Block[] = JSON_to_obj<Block[]>(message.data);
				if (Object.keys(message).length === 0) {
					console.log("NULL blockchain received");
					return;
				}
				handle_received_blockchain(blocks);
		}
	})
}

function init_error_handler(ws: WebSocket) {
	const close_connection = (Ws: WebSocket) => {
		console.log("conneection failes with " + Ws.url);
		peer_sockets.splice(peer_sockets.indexOf(Ws), 1);
	}

	ws.on('close', () => close_connection(ws));
	ws.on('error', () => close_connection(ws));
}

const write = (ws: WebSocket, data: Message) => {
	ws.send(JSON.stringify(data));
}

const brodcast = (data: Message) => {
	peer_sockets.forEach(peer => write(peer, data));
}

const chain_length = (): Message => ({ 'type': 1, 'data': null });
const get_sockets = () => peer_sockets;

const response_message = (n: number): Message => {
	let res: Message;
	if (n === 1)
		res = { 'type': 1, 'data': JSON.stringify(get_latest_block()) };
	else if (n === 2)
		res = { 'type': 2, 'data': JSON.stringify(get_blockchain()) };
	else
		res = { 'type': 3, 'data': null };

	return res;
}

const handle_received_blockchain = (blocks: Block[]) => {
	if (blocks.length === 0) {
		console.log("Empty chain received");
		return;
	}

	const latest_block: Block = blocks[blocks.length - 1];
	if (!validate_block_structure(latest_block)) {
		console.log("invalid structure of block");
		return;
	}

	const curr_latest_block: Block = get_latest_block();
	if (curr_latest_block.index < latest_block.index) {
		console.log('blockchain possibly behind. We got: ' + curr_latest_block.index + ' Peer got: ' + latest_block.index);
		if (curr_latest_block.hash === latest_block.prev_hash) {
			if (add_block(latest_block))
				brodcast(response_message(1));
		}
		else if (blocks.length === 1) {
			console.log("block mismathch, Query request sent");
			brodcast(response_message(3));
		}
		else {
			console.log("Received chain is longer");
			replace_chain(blocks);
		}
	}

	else
		console.log("Received blockchain not longer than current chain");
}

const broadcast_latest = (): void => {
	brodcast(response_message(1));
}

const make_new_connection = (peer: string) => {
	const ws: WebSocket = new WebSocket(peer);

	ws.on('open', () => {
		init_peer_connection(ws);
	});
	ws.on('error', () => {
		console.log("connection failed");
	});
}

export { make_new_connection, broadcast_latest, get_sockets, init_server };
