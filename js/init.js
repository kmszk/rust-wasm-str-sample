// https://www.npmjs.com/package/text-encoding
// const { TextEncoder } = require('text-encoding');

class rustUtils {
	constructor(instance) {
		this.instance = instance;
	}

	copyJsStringToMemory(jsString) {
		const { memory, stringPrepare, stringData, stringLen } = this.instance.exports;

		const encoder = new TextEncoder();
		const encodedString = encoder.encode(jsString);

		// Ask Rust code to allocate a string inside of the module's memory
		const rustString = stringPrepare(encodedString.length);

		// Get a JS view of the string data
		const rustStringData = stringData(rustString);
		const asBytes = new Uint8Array(memory.buffer, rustStringData, encodedString.length);

		// Copy the UTF-8 into the WASM memory.
		asBytes.set(encodedString);

		return rustString;
	}

	copyJsStringListToMemory(jsStringList) {
		const { memory, stringPrepare, stringData, stringLen } = this.instance.exports;

		const encoder = new TextEncoder();
		let encodedJsStringList = [];

		for (jsString in jsStringList) {
			encodedJsStringList.push(encoder.encode(jsString));
		}

		// Ask Rust code to allocate a string inside of the module's memory
		const rustStringList = stringListPrepare(encodedJsStringList.length);

		// Get a JS view of the string data
		const rustStringListData = stringData(rustStringList);
		const asBytes = new Uint8Array(memory.buffer, rustStringListData, encodedStringList.length);

		// Copy the UTF-8 into the WASM memory.
		asBytes.set(encodedStringList);

		return rustStringList;
	}


}

class wasmStrTest {
	constructor(instance) {
		this.rustUtils = new rustUtils(instance);
		this.instance = instance;
		console.log(instance);
	}

	testStr(msg) {
		console.log(this.instance);
		const { get_hello } = this.instance.exports;
		const op = this.rustUtils.copyJsStringToMemory(msg);
		const offset = get_hello(op);
		const len = 4; // 適当
		const stringBuffer = new Uint8Array(this.instance.exports.memory.buffer, offset, len);
		let str = '';
		for (let i = 0; i < stringBuffer.length; i++) {
			str += String.fromCharCode(stringBuffer[i]);
		}
		console.log(str);
	}

	testJson(msg) {
		console.log(this.instance);
		const { get_hello_from_json } = this.instance.exports;
		const op = this.rustUtils.copyJsStringToMemory(msg);
		const offset = get_hello_from_json(op);
		const len = 10; // 適当
		const stringBuffer = new Uint8Array(this.instance.exports.memory.buffer, offset, len);
		let str = '';
		for (let i = 0; i < stringBuffer.length; i++) {
			str += String.fromCharCode(stringBuffer[i]);
		}
		console.log(str);
	}
}

async function main() {
	fetch('/target/wasm32-unknown-unknown/debug/wasm_test.wasm')
		.then(response => response.arrayBuffer())
		.then(bytes => WebAssembly.instantiate(bytes, {}))
		.then(results => {
			let instance = results.instance;
			console.log(instance);
			let wasmStr = new wasmStrTest(instance);
			wasmStr.testStr("hogehgoe");
			wasmStr.testJson(JSON.stringify({list: ["wasmwasm", "wafflewaffle"]}));
		});

}

main();

