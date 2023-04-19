import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";

async function main() {
	let items = await fs.readdir(
		path.join(process.cwd(), "src")
	)

	let sink = [...items, "types.d.js"].map(async item => {
		let filePath = path.join(process.cwd(), item);
		console.log('Delete: ', filePath)
		
		if (existsSync(filePath) === false) {
			return
		}

		return fs.rm(filePath, { recursive: true });
	})

	await Promise.all(sink);
}

main().catch(err => {
	console.log('Something went wrong');
	console.log(err);
	process.exit(1);
});