import express from "express"
import { Block, get_blockchain, generate_new_block } from "./block";

const app = express();
app.use(express.json());
const port = 3000;

app.get("/blocks", (req, res) => {
	res.send(get_blockchain());
})

app.post("/mintBlock", (req, res) => {
	const new_block: Block = generate_new_block(req.body.data);
	res.send(new_block);
})

app.listen(port, (err?: Error) => {
	if (err) {
		console.error('Error starting the server:', err);
	} else {
		console.log(`Example app listening on port ${port}`);
	}
});
