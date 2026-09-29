import { o as __toESM, r as __exportAll } from "../_runtime.mjs";
import { C as lib_exports$1, S as Uint8ArrayType, _ as UINT32_BE, a as INT16_BE, b as UINT64_LE, c as INT32_LE, d as INT8, f as StringType, g as UINT24_LE, h as UINT24_BE, i as Float64_BE, l as INT64_BE, m as UINT16_LE, o as INT24_BE, p as UINT16_BE, r as Float32_BE, s as INT32_BE, u as INT64_LE, v as UINT32_LE, w as require_src, x as UINT8, y as UINT64_BE } from "./@tokenizer/inflate+[...].mjs";
import { n as textEncode, t as textDecode } from "./borewit__text-codec.mjs";
import { a as fromStream$1, i as fromBuffer, n as getUintBE, o as AbstractTokenizer, r as uint8ArrayToHex, s as EndOfStreamError, t as fileTypeFromBuffer } from "./file-type+[...].mjs";
import { t as require_dist } from "./content-type.mjs";
import { t as parse } from "./media-typer.mjs";
import { open, stat } from "node:fs/promises";
//#region node_modules/strtok3/lib/FileTokenizer.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
var FileTokenizer = class FileTokenizer extends AbstractTokenizer {
	/**
	* Create tokenizer from provided file path
	* @param sourceFilePath File path
	*/
	static async fromFile(sourceFilePath) {
		const fileHandle = await open(sourceFilePath, "r");
		const stat = await fileHandle.stat();
		return new FileTokenizer(fileHandle, { fileInfo: {
			path: sourceFilePath,
			size: stat.size
		} });
	}
	constructor(fileHandle, options) {
		super(options);
		this.fileHandle = fileHandle;
		this.fileInfo = options.fileInfo;
	}
	/**
	* Read buffer from file
	* @param uint8Array - Uint8Array to write result to
	* @param options - Read behaviour options
	* @returns Promise number of bytes read
	*/
	async readBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		this.position = normOptions.position;
		if (normOptions.length === 0) return 0;
		const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
		this.position += res.bytesRead;
		if (res.bytesRead < normOptions.length && (!options || !options.mayBeLess)) throw new EndOfStreamError();
		return res.bytesRead;
	}
	/**
	* Peek buffer from file
	* @param uint8Array - Uint8Array (or Buffer) to write data to
	* @param options - Read behaviour options
	* @returns Promise number of bytes read
	*/
	async peekBuffer(uint8Array, options) {
		const normOptions = this.normalizeOptions(uint8Array, options);
		const res = await this.fileHandle.read(uint8Array, 0, normOptions.length, normOptions.position);
		if (!normOptions.mayBeLess && res.bytesRead < normOptions.length) throw new EndOfStreamError();
		return res.bytesRead;
	}
	async close() {
		await this.fileHandle.close();
		return super.close();
	}
	setPosition(position) {
		this.position = position;
	}
	supportsRandomAccess() {
		return true;
	}
};
//#endregion
//#region node_modules/strtok3/lib/index.js
/**
* Construct ReadStreamTokenizer from given Stream.
* Will set fileSize, if provided given Stream has set the .path property.
* @param stream - Node.js Stream.Readable
* @param options - Pass additional file information to the tokenizer
* @returns Tokenizer
*/
async function fromStream(stream, options) {
	const rst = fromStream$1(stream, options);
	if (stream.path) {
		const stat$1 = await stat(stream.path);
		rst.fileInfo.path = stream.path;
		rst.fileInfo.size = stat$1.size;
	}
	return rst;
}
var fromFile = FileTokenizer.fromFile;
//#endregion
//#region node_modules/music-metadata/lib/ParseError.js
var makeParseError = (name) => {
	return class ParseError extends Error {
		constructor(message) {
			super(message);
			this.name = name;
		}
	};
};
var CouldNotDetermineFileTypeError = class extends makeParseError("CouldNotDetermineFileTypeError") {};
var UnsupportedFileTypeError = class extends makeParseError("UnsupportedFileTypeError") {};
var UnexpectedFileContentError = class extends makeParseError("UnexpectedFileContentError") {
	constructor(fileType, message) {
		super(message);
		this.fileType = fileType;
	}
	toString() {
		return `${this.name} (FileType: ${this.fileType}): ${this.message}`;
	}
};
var FieldDecodingError = class extends makeParseError("FieldDecodingError") {};
var InternalParserError = class extends makeParseError("InternalParserError") {};
var makeUnexpectedFileContentError = (fileType) => {
	return class extends UnexpectedFileContentError {
		constructor(message) {
			super(fileType, message);
		}
	};
};
//#endregion
//#region node_modules/music-metadata/lib/common/Util.js
function getBit(buf, off, bit) {
	return (buf[off] & 1 << bit) !== 0;
}
/**
* Find delimiting zero in uint8Array
* @param uint8Array Uint8Array to find the zero delimiter in
* @param encoding The string encoding used
* @return position in uint8Array where zero found, or uint8Array.length if not found
*/
function findZero(uint8Array, encoding) {
	const len = uint8Array.length;
	if (encoding === "utf-16le" || encoding === "utf-16be") {
		for (let i = 0; i + 1 < len; i += 2) if (uint8Array[i] === 0 && uint8Array[i + 1] === 0) return i;
		return len;
	}
	for (let i = 0; i < len; i++) if (uint8Array[i] === 0) return i;
	return len;
}
function trimRightNull(x) {
	const pos0 = x.indexOf("\0");
	return pos0 === -1 ? x : x.substring(0, pos0);
}
function swapBytes(uint8Array) {
	const l = uint8Array.length;
	if ((l & 1) !== 0) throw new FieldDecodingError("Buffer length must be even");
	for (let i = 0; i < l; i += 2) {
		const a = uint8Array[i];
		uint8Array[i] = uint8Array[i + 1];
		uint8Array[i + 1] = a;
	}
	return uint8Array;
}
/**
* Decode string
*/
function decodeString(uint8Array, encoding) {
	if (uint8Array[0] === 255 && uint8Array[1] === 254) return decodeString(uint8Array.subarray(2), encoding);
	if (encoding === "utf-16le" && uint8Array[0] === 254 && uint8Array[1] === 255) {
		if ((uint8Array.length & 1) !== 0) throw new FieldDecodingError("Expected even number of octets for 16-bit unicode string");
		return decodeString(swapBytes(uint8Array), encoding);
	}
	if (encoding === "utf-16be") {
		if ((uint8Array.length & 1) !== 0) throw new FieldDecodingError("Expected even number of octets for 16-bit unicode string");
		return new StringType(uint8Array.length, "utf-16le").get(swapBytes(Uint8Array.from(uint8Array)), 0);
	}
	return new StringType(uint8Array.length, encoding).get(uint8Array, 0);
}
function stripNulls(str) {
	str = str.replace(/^\x00+/g, "");
	str = str.replace(/\x00+$/g, "");
	return str;
}
/**
* Read bit-aligned number start from buffer
* Total offset in bits = byteOffset * 8 + bitOffset
* @param source Byte buffer
* @param byteOffset Starting offset in bytes
* @param bitOffset Starting offset in bits: 0 = lsb
* @param len Length of number in bits
* @return Decoded bit aligned number
*/
function getBitAllignedNumber$1(source, byteOffset, bitOffset, len) {
	const byteOff = byteOffset + ~~(bitOffset / 8);
	const bitOff = bitOffset % 8;
	let value = source[byteOff];
	value &= 255 >> bitOff;
	const bitsRead = 8 - bitOff;
	const bitsLeft = len - bitsRead;
	if (bitsLeft < 0) value >>= 8 - bitOff - len;
	else if (bitsLeft > 0) {
		value <<= bitsLeft;
		value |= getBitAllignedNumber$1(source, byteOffset, bitOffset + bitsRead, bitsLeft);
	}
	return value;
}
/**
* Read bit-aligned number start from buffer
* Total offset in bits = byteOffset * 8 + bitOffset
* @param source Byte Uint8Array
* @param byteOffset Starting offset in bytes
* @param bitOffset Starting offset in bits: 0 = most significant bit, 7 is the least significant bit
* @return True if bit is set
*/
function isBitSet$2(source, byteOffset, bitOffset) {
	return getBitAllignedNumber$1(source, byteOffset, bitOffset, 1) === 1;
}
function a2hex(str) {
	const arr = [];
	for (let i = 0, l = str.length; i < l; i++) {
		const hex = Number(str.charCodeAt(i)).toString(16);
		arr.push(hex.length === 1 ? `0${hex}` : hex);
	}
	return arr.join(" ");
}
/**
* Convert power ratio to DB
* ratio: [0..1]
*/
function ratioToDb(ratio) {
	return 10 * Math.log10(ratio);
}
/**
* Convert dB to ratio
* db Decibels
*/
function dbToRatio(dB) {
	return 10 ** (dB / 10);
}
/**
* Convert replay gain to ratio and Decibel
* @param value string holding a ratio like '0.034' or '-7.54 dB'
*/
function toRatio(value) {
	const ps = value.split(" ").map((p) => p.trim().toLowerCase());
	if (ps.length >= 1) {
		const v = Number.parseFloat(ps[0]);
		return ps.length === 2 && ps[1] === "db" ? {
			dB: v,
			ratio: dbToRatio(v)
		} : {
			dB: ratioToDb(v),
			ratio: v
		};
	}
}
/**
* Decode a big-endian unsigned integer from a Uint8Array.
* Supports dynamic length (1–8 bytes).
*/
function decodeUintBE(uint8Array) {
	if (uint8Array.length === 0) throw new Error("decodeUintBE: empty Uint8Array");
	const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
	return getUintBE(view);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2Token.js
/**
* The picture type according to the ID3v2 APIC frame
* Ref: http://id3.org/id3v2.3.0#Attached_picture
*/
var AttachedPictureType = {
	0: "Other",
	1: "32x32 pixels 'file icon' (PNG only)",
	2: "Other file icon",
	3: "Cover (front)",
	4: "Cover (back)",
	5: "Leaflet page",
	6: "Media (e.g. label side of CD)",
	7: "Lead artist/lead performer/soloist",
	8: "Artist/performer",
	9: "Conductor",
	10: "Band/Orchestra",
	11: "Composer",
	12: "Lyricist/text writer",
	13: "Recording Location",
	14: "During recording",
	15: "During performance",
	16: "Movie/video screen capture",
	17: "A bright coloured fish",
	18: "Illustration",
	19: "Band/artist logotype",
	20: "Publisher/Studio logotype"
};
/**
* https://id3.org/id3v2.3.0#Synchronised_lyrics.2Ftext
*/
var LyricsContentType = {
	other: 0,
	lyrics: 1,
	text: 2,
	movement_part: 3,
	events: 4,
	chord: 5,
	trivia_pop: 6
};
var TimestampFormat = {
	notSynchronized: 0,
	mpegFrameNumber: 1,
	milliseconds: 2
};
/**
* 28 bits (representing up to 256MB) integer, the msb is 0 to avoid 'false syncsignals'.
* 4 * %0xxxxxxx
*/
var UINT32SYNCSAFE = {
	get: (buf, off) => {
		return buf[off + 3] & 127 | buf[off + 2] << 7 | buf[off + 1] << 14 | buf[off] << 21;
	},
	len: 4
};
/**
* ID3v2 header
* Ref: http://id3.org/id3v2.3.0#ID3v2_header
* ToDo
*/
var ID3v2Header = {
	len: 10,
	get: (buf, off) => {
		return {
			fileIdentifier: new StringType(3, "ascii").get(buf, off),
			version: {
				major: INT8.get(buf, off + 3),
				revision: INT8.get(buf, off + 4)
			},
			flags: {
				unsynchronisation: getBit(buf, off + 5, 7),
				isExtendedHeader: getBit(buf, off + 5, 6),
				expIndicator: getBit(buf, off + 5, 5),
				footer: getBit(buf, off + 5, 4)
			},
			size: UINT32SYNCSAFE.get(buf, off + 6)
		};
	}
};
var ExtendedHeader = {
	len: 10,
	get: (buf, off) => {
		return {
			size: UINT32_BE.get(buf, off),
			extendedFlags: UINT16_BE.get(buf, off + 4),
			sizeOfPadding: UINT32_BE.get(buf, off + 6),
			crcDataPresent: getBit(buf, off + 4, 31)
		};
	}
};
var TextEncodingToken = {
	len: 1,
	get: (uint8Array, off) => {
		switch (uint8Array[off]) {
			case 0: return { encoding: "latin1" };
			case 1: return {
				encoding: "utf-16le",
				bom: true
			};
			case 2: return {
				encoding: "utf-16be",
				bom: false
			};
			case 3: return {
				encoding: "utf8",
				bom: false
			};
			default: return {
				encoding: "utf8",
				bom: false
			};
		}
	}
};
/**
* Used to read first portion of `SYLT` frame
*/
var TextHeader = {
	len: 4,
	get: (uint8Array, off) => {
		return {
			encoding: TextEncodingToken.get(uint8Array, off),
			language: new StringType(3, "latin1").get(uint8Array, off + 1)
		};
	}
};
/**
* Used to read first portion of `SYLT` frame
*/
var SyncTextHeader = {
	len: 6,
	get: (uint8Array, off) => {
		const text = TextHeader.get(uint8Array, off);
		return {
			encoding: text.encoding,
			language: text.language,
			timeStampFormat: UINT8.get(uint8Array, off + 4),
			contentType: UINT8.get(uint8Array, off + 5)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/BasicParser.js
var BasicParser = class {
	/**
	* Initialize parser with output (metadata), input (tokenizer) & parsing options (options).
	* @param {INativeMetadataCollector} metadata Output
	* @param {ITokenizer} tokenizer Input
	* @param {IOptions} options Parsing options
	*/
	constructor(metadata, tokenizer, options) {
		this.metadata = metadata;
		this.tokenizer = tokenizer;
		this.options = options;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/FourCC.js
var validFourCC = /^[\x21-\x7e©][\x20-\x7e\x00()]{3}/;
/**
* Token for read FourCC
* Ref: https://en.wikipedia.org/wiki/FourCC
*/
var FourCcToken = {
	len: 4,
	get: (buf, off) => {
		const id = textDecode(buf.subarray(off, off + FourCcToken.len), "latin1");
		if (!id.match(validFourCC)) throw new FieldDecodingError(`FourCC contains invalid characters: ${a2hex(id)} "${id}"`);
		return id;
	},
	put: (buffer, offset, id) => {
		const str = textEncode(id, "latin1");
		if (str.length !== 4) throw new InternalParserError("Invalid length");
		buffer.set(str, offset);
		return offset + 4;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2Token.js
var DataType$1 = {
	text_utf8: 0,
	binary: 1,
	external_info: 2,
	reserved: 3
};
/**
* APE_DESCRIPTOR: defines the sizes (and offsets) of all the pieces, as well as the MD5 checksum
*/
var DescriptorParser = {
	len: 52,
	get: (buf, off) => {
		return {
			ID: FourCcToken.get(buf, off),
			version: UINT32_LE.get(buf, off + 4) / 1e3,
			descriptorBytes: UINT32_LE.get(buf, off + 8),
			headerBytes: UINT32_LE.get(buf, off + 12),
			seekTableBytes: UINT32_LE.get(buf, off + 16),
			headerDataBytes: UINT32_LE.get(buf, off + 20),
			apeFrameDataBytes: UINT32_LE.get(buf, off + 24),
			apeFrameDataBytesHigh: UINT32_LE.get(buf, off + 28),
			terminatingDataBytes: UINT32_LE.get(buf, off + 32),
			fileMD5: new Uint8ArrayType(16).get(buf, off + 36)
		};
	}
};
/**
* APE_HEADER: describes all of the necessary information about the APE file
*/
var Header$5 = {
	len: 24,
	get: (buf, off) => {
		return {
			compressionLevel: UINT16_LE.get(buf, off),
			formatFlags: UINT16_LE.get(buf, off + 2),
			blocksPerFrame: UINT32_LE.get(buf, off + 4),
			finalFrameBlocks: UINT32_LE.get(buf, off + 8),
			totalFrames: UINT32_LE.get(buf, off + 12),
			bitsPerSample: UINT16_LE.get(buf, off + 16),
			channel: UINT16_LE.get(buf, off + 18),
			sampleRate: UINT32_LE.get(buf, off + 20)
		};
	}
};
/**
* APE Tag Header/Footer Version 2.0
* TAG: describes all the properties of the file [optional]
*/
var TagFooter = {
	len: 32,
	get: (buf, off) => {
		return {
			ID: new StringType(8, "ascii").get(buf, off),
			version: UINT32_LE.get(buf, off + 8),
			size: UINT32_LE.get(buf, off + 12),
			fields: UINT32_LE.get(buf, off + 16),
			flags: parseTagFlags(UINT32_LE.get(buf, off + 20))
		};
	}
};
/**
* APE Tag v2.0 Item Header
*/
var TagItemHeader = {
	len: 8,
	get: (buf, off) => {
		return {
			size: UINT32_LE.get(buf, off),
			flags: parseTagFlags(UINT32_LE.get(buf, off + 4))
		};
	}
};
function parseTagFlags(flags) {
	return {
		containsHeader: isBitSet$1(flags, 31),
		containsFooter: isBitSet$1(flags, 30),
		isHeader: isBitSet$1(flags, 29),
		readOnly: isBitSet$1(flags, 0),
		dataType: (flags & 6) >> 1
	};
}
/**
* @param num {number}
* @param bit 0 is least significant bit (LSB)
* @return {boolean} true if bit is 1; otherwise false
*/
function isBitSet$1(num, bit) {
	return (num & 1 << bit) !== 0;
}
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2Parser.js
var APEv2Parser_exports = /* @__PURE__ */ __exportAll({
	APEv2Parser: () => APEv2Parser,
	ApeContentError: () => ApeContentError,
	tryParseApeHeader: () => tryParseApeHeader
});
var debug$28 = (0, import_src.default)("music-metadata:parser:APEv2");
var tagFormat$1 = "APEv2";
var preamble = "APETAGEX";
var ApeContentError = class extends makeUnexpectedFileContentError("APEv2") {};
function tryParseApeHeader(metadata, tokenizer, options) {
	return new APEv2Parser(metadata, tokenizer, options).tryParseApeHeader();
}
var APEv2Parser = class APEv2Parser extends BasicParser {
	constructor() {
		super(...arguments);
		this.ape = {};
	}
	/**
	* Calculate the media file duration
	* @param ah ApeHeader
	* @return {number} duration in seconds
	*/
	static calculateDuration(ah) {
		let duration = ah.totalFrames > 1 ? ah.blocksPerFrame * (ah.totalFrames - 1) : 0;
		duration += ah.finalFrameBlocks;
		return duration / ah.sampleRate;
	}
	/**
	* Calculates the APEv1 / APEv2 first field offset
	* @param tokenizer
	* @param offset
	*/
	static async findApeFooterOffset(tokenizer, offset) {
		const apeBuf = new Uint8Array(TagFooter.len);
		const position = tokenizer.position;
		if (offset <= TagFooter.len) {
			debug$28(`Offset is too small to read APE footer: offset=${offset}`);
			return;
		}
		if (offset > TagFooter.len) {
			await tokenizer.readBuffer(apeBuf, { position: offset - TagFooter.len });
			tokenizer.setPosition(position);
			const tagFooter = TagFooter.get(apeBuf, 0);
			if (tagFooter.ID === "APETAGEX") {
				if (tagFooter.flags.isHeader) debug$28(`APE Header found at offset=${offset - TagFooter.len}`);
				else {
					debug$28(`APE Footer found at offset=${offset - TagFooter.len}`);
					offset -= tagFooter.size;
				}
				return {
					footer: tagFooter,
					offset
				};
			}
		}
	}
	static parseTagFooter(metadata, buffer, options) {
		const footer = TagFooter.get(buffer, buffer.length - TagFooter.len);
		if (footer.ID !== preamble) throw new ApeContentError("Unexpected APEv2 Footer ID preamble value");
		fromBuffer(buffer);
		return new APEv2Parser(metadata, fromBuffer(buffer), options).parseTags(footer);
	}
	/**
	* Parse APEv1 / APEv2 header if header signature found
	*/
	async tryParseApeHeader() {
		if (this.tokenizer.fileInfo.size && this.tokenizer.fileInfo.size - this.tokenizer.position < TagFooter.len) {
			debug$28("No APEv2 header found, end-of-file reached");
			return;
		}
		const footer = await this.tokenizer.peekToken(TagFooter);
		if (footer.ID === preamble) {
			await this.tokenizer.ignore(TagFooter.len);
			return this.parseTags(footer);
		}
		debug$28(`APEv2 header not found at offset=${this.tokenizer.position}`);
		if (this.tokenizer.fileInfo.size) {
			const remaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
			const buffer = new Uint8Array(remaining);
			await this.tokenizer.readBuffer(buffer);
			return APEv2Parser.parseTagFooter(this.metadata, buffer, this.options);
		}
	}
	async parse() {
		const descriptor = await this.tokenizer.readToken(DescriptorParser);
		if (descriptor.ID !== "MAC ") throw new ApeContentError("Unexpected descriptor ID");
		this.ape.descriptor = descriptor;
		const lenExp = descriptor.descriptorBytes - DescriptorParser.len;
		const header = await (lenExp > 0 ? this.parseDescriptorExpansion(lenExp) : this.parseHeader());
		this.metadata.setAudioOnly();
		await this.tokenizer.ignore(header.forwardBytes);
		return this.tryParseApeHeader();
	}
	async parseTags(footer) {
		const keyBuffer = /* @__PURE__ */ new Uint8Array(256);
		let bytesRemaining = footer.size - TagFooter.len;
		debug$28(`Parse APE tags at offset=${this.tokenizer.position}, size=${bytesRemaining}`);
		for (let i = 0; i < footer.fields; i++) {
			if (bytesRemaining < TagItemHeader.len) {
				this.metadata.addWarning(`APEv2 Tag-header: ${footer.fields - i} items remaining, but no more tag data to read.`);
				break;
			}
			const tagItemHeader = await this.tokenizer.readToken(TagItemHeader);
			bytesRemaining -= TagItemHeader.len + tagItemHeader.size;
			await this.tokenizer.peekBuffer(keyBuffer, { length: Math.min(keyBuffer.length, bytesRemaining) });
			let zero = findZero(keyBuffer);
			const key = await this.tokenizer.readToken(new StringType(zero, "ascii"));
			await this.tokenizer.ignore(1);
			bytesRemaining -= key.length + 1;
			switch (tagItemHeader.flags.dataType) {
				case DataType$1.text_utf8: {
					const values = (await this.tokenizer.readToken(new StringType(tagItemHeader.size, "utf8"))).split(/\x00/g);
					await Promise.all(values.map((val) => this.metadata.addTag(tagFormat$1, key, val)));
					break;
				}
				case DataType$1.binary:
					if (this.options.skipCovers) await this.tokenizer.ignore(tagItemHeader.size);
					else {
						const picData = new Uint8Array(tagItemHeader.size);
						await this.tokenizer.readBuffer(picData);
						zero = findZero(picData);
						const description = textDecode(picData.subarray(0, zero), "utf-8");
						const data = picData.subarray(zero + 1);
						await this.metadata.addTag(tagFormat$1, key, {
							description,
							data
						});
					}
					break;
				case DataType$1.external_info:
					debug$28(`Ignore external info ${key}`);
					await this.tokenizer.ignore(tagItemHeader.size);
					break;
				case DataType$1.reserved:
					debug$28(`Ignore external info ${key}`);
					this.metadata.addWarning(`APEv2 header declares a reserved datatype for "${key}"`);
					await this.tokenizer.ignore(tagItemHeader.size);
			}
		}
	}
	async parseDescriptorExpansion(lenExp) {
		await this.tokenizer.ignore(lenExp);
		return this.parseHeader();
	}
	async parseHeader() {
		const header = await this.tokenizer.readToken(Header$5);
		this.metadata.setFormat("lossless", true);
		this.metadata.setFormat("container", "Monkey's Audio");
		this.metadata.setFormat("bitsPerSample", header.bitsPerSample);
		this.metadata.setFormat("sampleRate", header.sampleRate);
		this.metadata.setFormat("numberOfChannels", header.channel);
		this.metadata.setFormat("duration", APEv2Parser.calculateDuration(header));
		if (!this.ape.descriptor) throw new ApeContentError("Missing APE descriptor");
		return { forwardBytes: this.ape.descriptor.seekTableBytes + this.ape.descriptor.headerDataBytes + this.ape.descriptor.apeFrameDataBytes + this.ape.descriptor.terminatingDataBytes };
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v1/ID3v1Parser.js
var debug$27 = (0, import_src.default)("music-metadata:parser:ID3v1");
/**
* ID3v1 Genre mappings
* Ref: https://de.wikipedia.org/wiki/Liste_der_ID3v1-Genres
*/
var Genres = [
	"Blues",
	"Classic Rock",
	"Country",
	"Dance",
	"Disco",
	"Funk",
	"Grunge",
	"Hip-Hop",
	"Jazz",
	"Metal",
	"New Age",
	"Oldies",
	"Other",
	"Pop",
	"R&B",
	"Rap",
	"Reggae",
	"Rock",
	"Techno",
	"Industrial",
	"Alternative",
	"Ska",
	"Death Metal",
	"Pranks",
	"Soundtrack",
	"Euro-Techno",
	"Ambient",
	"Trip-Hop",
	"Vocal",
	"Jazz+Funk",
	"Fusion",
	"Trance",
	"Classical",
	"Instrumental",
	"Acid",
	"House",
	"Game",
	"Sound Clip",
	"Gospel",
	"Noise",
	"Alt. Rock",
	"Bass",
	"Soul",
	"Punk",
	"Space",
	"Meditative",
	"Instrumental Pop",
	"Instrumental Rock",
	"Ethnic",
	"Gothic",
	"Darkwave",
	"Techno-Industrial",
	"Electronic",
	"Pop-Folk",
	"Eurodance",
	"Dream",
	"Southern Rock",
	"Comedy",
	"Cult",
	"Gangsta Rap",
	"Top 40",
	"Christian Rap",
	"Pop/Funk",
	"Jungle",
	"Native American",
	"Cabaret",
	"New Wave",
	"Psychedelic",
	"Rave",
	"Showtunes",
	"Trailer",
	"Lo-Fi",
	"Tribal",
	"Acid Punk",
	"Acid Jazz",
	"Polka",
	"Retro",
	"Musical",
	"Rock & Roll",
	"Hard Rock",
	"Folk",
	"Folk/Rock",
	"National Folk",
	"Swing",
	"Fast-Fusion",
	"Bebob",
	"Latin",
	"Revival",
	"Celtic",
	"Bluegrass",
	"Avantgarde",
	"Gothic Rock",
	"Progressive Rock",
	"Psychedelic Rock",
	"Symphonic Rock",
	"Slow Rock",
	"Big Band",
	"Chorus",
	"Easy Listening",
	"Acoustic",
	"Humour",
	"Speech",
	"Chanson",
	"Opera",
	"Chamber Music",
	"Sonata",
	"Symphony",
	"Booty Bass",
	"Primus",
	"Porn Groove",
	"Satire",
	"Slow Jam",
	"Club",
	"Tango",
	"Samba",
	"Folklore",
	"Ballad",
	"Power Ballad",
	"Rhythmic Soul",
	"Freestyle",
	"Duet",
	"Punk Rock",
	"Drum Solo",
	"A Cappella",
	"Euro-House",
	"Dance Hall",
	"Goa",
	"Drum & Bass",
	"Club-House",
	"Hardcore",
	"Terror",
	"Indie",
	"BritPop",
	"Negerpunk",
	"Polsk Punk",
	"Beat",
	"Christian Gangsta Rap",
	"Heavy Metal",
	"Black Metal",
	"Crossover",
	"Contemporary Christian",
	"Christian Rock",
	"Merengue",
	"Salsa",
	"Thrash Metal",
	"Anime",
	"JPop",
	"Synthpop",
	"Abstract",
	"Art Rock",
	"Baroque",
	"Bhangra",
	"Big Beat",
	"Breakbeat",
	"Chillout",
	"Downtempo",
	"Dub",
	"EBM",
	"Eclectic",
	"Electro",
	"Electroclash",
	"Emo",
	"Experimental",
	"Garage",
	"Global",
	"IDM",
	"Illbient",
	"Industro-Goth",
	"Jam Band",
	"Krautrock",
	"Leftfield",
	"Lounge",
	"Math Rock",
	"New Romantic",
	"Nu-Breakz",
	"Post-Punk",
	"Post-Rock",
	"Psytrance",
	"Shoegaze",
	"Space Rock",
	"Trop Rock",
	"World Music",
	"Neoclassical",
	"Audiobook",
	"Audio Theatre",
	"Neue Deutsche Welle",
	"Podcast",
	"Indie Rock",
	"G-Funk",
	"Dubstep",
	"Garage Rock",
	"Psybient"
];
/**
* Spec: http://id3.org/ID3v1
* Wiki: https://en.wikipedia.org/wiki/ID3
*/
var Iid3v1Token = {
	len: 128,
	/**
	* @param buf Buffer possibly holding the 128 bytes ID3v1.1 metadata header
	* @param off Offset in buffer in bytes
	* @returns ID3v1.1 header if first 3 bytes equals 'TAG', otherwise null is returned
	*/
	get: (buf, off) => {
		const header = new Id3v1StringType(3).get(buf, off);
		return header === "TAG" ? {
			header,
			title: new Id3v1StringType(30).get(buf, off + 3),
			artist: new Id3v1StringType(30).get(buf, off + 33),
			album: new Id3v1StringType(30).get(buf, off + 63),
			year: new Id3v1StringType(4).get(buf, off + 93),
			comment: new Id3v1StringType(28).get(buf, off + 97),
			zeroByte: UINT8.get(buf, off + 127),
			track: UINT8.get(buf, off + 126),
			genre: UINT8.get(buf, off + 127)
		} : null;
	}
};
var Id3v1StringType = class {
	constructor(len) {
		this.len = len;
		this.stringType = new StringType(len, "latin1");
	}
	get(buf, off) {
		let value = this.stringType.get(buf, off);
		value = trimRightNull(value);
		value = value.trim();
		return value.length > 0 ? value : void 0;
	}
};
var ID3v1Parser = class ID3v1Parser extends BasicParser {
	constructor(metadata, tokenizer, options) {
		super(metadata, tokenizer, options);
		this.apeHeader = options.apeHeader;
	}
	static getGenre(genreIndex) {
		if (genreIndex < Genres.length) return Genres[genreIndex];
	}
	async parse() {
		if (!this.tokenizer.fileInfo.size) {
			debug$27("Skip checking for ID3v1 because the file-size is unknown");
			return;
		}
		if (this.apeHeader && this.tokenizer.supportsRandomAccess()) {
			this.tokenizer.setPosition(this.apeHeader.offset);
			await new APEv2Parser(this.metadata, this.tokenizer, this.options).parseTags(this.apeHeader.footer);
		}
		const offset = this.tokenizer.fileInfo.size - Iid3v1Token.len;
		if (this.tokenizer.position > offset) {
			debug$27("Already consumed the last 128 bytes");
			return;
		}
		const header = await this.tokenizer.readToken(Iid3v1Token, offset);
		if (header) {
			debug$27("ID3v1 header found at: pos=%s", this.tokenizer.fileInfo.size - Iid3v1Token.len);
			for (const id of [
				"title",
				"artist",
				"album",
				"comment",
				"track",
				"year"
			]) if (header[id] && header[id] !== "") await this.addTag(id, header[id]);
			const genre = ID3v1Parser.getGenre(header.genre);
			if (genre) await this.addTag("genre", genre);
		} else debug$27("ID3v1 header not found at: pos=%s", this.tokenizer.fileInfo.size - Iid3v1Token.len);
	}
	async addTag(id, value) {
		await this.metadata.addTag("ID3v1", id, value);
	}
};
async function hasID3v1Header(tokenizer) {
	if (tokenizer.fileInfo.size >= 128) {
		const tag = /* @__PURE__ */ new Uint8Array(3);
		const position = tokenizer.position;
		await tokenizer.readBuffer(tag, { position: tokenizer.fileInfo.size - 128 });
		tokenizer.setPosition(position);
		return textDecode(tag, "latin1") === "TAG";
	}
	return false;
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2ChapterToken.js
/**
* Data portion of `CHAP` sub frame
*/
var ChapterInfo = {
	len: 16,
	get: (buf, off) => {
		const startOffset = UINT32_BE.get(buf, off + 8);
		const endOffset = UINT32_BE.get(buf, off + 12);
		return {
			startTime: UINT32_BE.get(buf, off),
			endTime: UINT32_BE.get(buf, off + 4),
			startOffset: startOffset === 4294967295 ? void 0 : startOffset,
			endOffset: endOffset === 4294967295 ? void 0 : endOffset
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/FrameHeader.js
/**
* Frame header length (bytes) depending on ID3v2 major version.
*/
function getFrameHeaderLength(majorVer) {
	switch (majorVer) {
		case 2: return 6;
		case 3:
		case 4: return 10;
		default: throw makeUnexpectedMajorVersionError$2(majorVer);
	}
}
function readFrameFlags(b, majorVer) {
	if (majorVer === 3) return {
		status: {
			tag_alter_preservation: getBit(b, 0, 7),
			file_alter_preservation: getBit(b, 0, 6),
			read_only: getBit(b, 0, 5)
		},
		format: {
			compression: getBit(b, 1, 7),
			encryption: getBit(b, 1, 6),
			grouping_identity: getBit(b, 1, 5),
			unsynchronisation: false,
			data_length_indicator: false
		}
	};
	return {
		status: {
			tag_alter_preservation: getBit(b, 0, 6),
			file_alter_preservation: getBit(b, 0, 5),
			read_only: getBit(b, 0, 4)
		},
		format: {
			grouping_identity: getBit(b, 1, 6),
			compression: getBit(b, 1, 3),
			encryption: getBit(b, 1, 2),
			unsynchronisation: getBit(b, 1, 1),
			data_length_indicator: getBit(b, 1, 0)
		}
	};
}
/**
* Factory: parse a frame header from its header bytes (6 for v2.2, 10 for v2.3/v2.4).
*
* Note: It only *parses* and does light validation. It does not read payload bytes.
*/
function readFrameHeader(uint8Array, majorVer, warningCollector) {
	switch (majorVer) {
		case 2: return parseFrameHeaderV22(uint8Array, majorVer, warningCollector);
		case 3:
		case 4: return parseFrameHeaderV23V24(uint8Array, majorVer, warningCollector);
		default: throw makeUnexpectedMajorVersionError$2(majorVer);
	}
}
function parseFrameHeaderV22(uint8Array, majorVer, warningCollector) {
	const header = {
		id: textDecode(uint8Array.subarray(0, 3), "ascii"),
		length: UINT24_BE.get(uint8Array, 3)
	};
	if (!header.id.match(/^[A-Z0-9]{3}$/)) warningCollector.addWarning(`Invalid ID3v2.${majorVer} frame-header-ID: ${header.id}`);
	return header;
}
function parseFrameHeaderV23V24(uint8Array, majorVer, warningCollector) {
	const header = {
		id: textDecode(uint8Array.subarray(0, 4), "ascii"),
		length: (majorVer === 4 ? UINT32SYNCSAFE : UINT32_BE).get(uint8Array, 4),
		flags: readFrameFlags(uint8Array.subarray(8, 10), majorVer)
	};
	if (!header.id.match(/^[A-Z0-9]{4}$/)) warningCollector.addWarning(`Invalid ID3v2.${majorVer} frame-header-ID: ${header.id}`);
	return header;
}
function makeUnexpectedMajorVersionError$2(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/FrameParser.js
var debug$26 = (0, import_src.default)("music-metadata:id3v2:frame-parser");
var defaultEnc = "latin1";
var urlEnc = {
	encoding: defaultEnc,
	bom: false
};
function parseGenre(origVal) {
	const genres = [];
	let code;
	let word = "";
	for (const c of origVal) if (typeof code === "string") {
		if (c === "(" && code === "") {
			word += "(";
			code = void 0;
		} else if (c === ")") {
			if (word !== "") {
				genres.push(word);
				word = "";
			}
			const genre = parseGenreCode(code);
			if (genre) genres.push(genre);
			code = void 0;
		} else code += c;
	} else if (c === "(") code = "";
	else word += c;
	if (word) {
		if (genres.length === 0 && word.match(/^\d*$/)) word = parseGenreCode(word);
		if (word) genres.push(word);
	}
	return genres;
}
function parseGenreCode(code) {
	if (code === "RX") return "Remix";
	if (code === "CR") return "Cover";
	if (code.match(/^\d*$/)) return Genres[Number.parseInt(code, 10)];
}
var FrameParser = class FrameParser {
	/**
	* Create id3v2 frame parser
	* @param major - Major version, e.g. (4) for  id3v2.4
	* @param warningCollector - Used to collect decode issue
	*/
	constructor(major, warningCollector) {
		this.major = major;
		this.warningCollector = warningCollector;
	}
	readData(uint8Array, type, includeCovers) {
		if (uint8Array.length === 0) {
			this.warningCollector.addWarning(`id3v2.${this.major} header has empty tag type=${type}`);
			return;
		}
		const { encoding, bom } = TextEncodingToken.get(uint8Array, 0);
		const length = uint8Array.length;
		let offset = 0;
		let output = [];
		const nullTerminatorLength = FrameParser.getNullTerminatorLength(encoding);
		let fzero;
		debug$26(`Parsing tag type=${type}, encoding=${encoding}, bom=${bom}`);
		switch (type !== "TXXX" && type[0] === "T" ? "T*" : type) {
			case "T*":
			case "GRP1":
			case "GP1":
			case "IPLS":
			case "MVIN":
			case "MVNM":
			case "PCS":
			case "PCST": {
				let text;
				try {
					text = FrameParser.trimNullPadding(decodeString(uint8Array.subarray(1), encoding));
				} catch (error) {
					if (error instanceof Error) {
						this.warningCollector.addWarning(`id3v2.${this.major} type=${type} header has invalid string value: ${error.message}`);
						break;
					}
					throw error;
				}
				switch (type) {
					case "TMCL":
					case "TIPL":
					case "IPLS":
						output = FrameParser.functionList(this.splitValue(type, text));
						break;
					case "TRK":
					case "TRCK":
					case "TPOS":
					case "TIT1":
					case "TIT2":
					case "TIT3":
						output = text;
						break;
					case "TCOM":
					case "TEXT":
					case "TOLY":
					case "TOPE":
					case "TPE1":
					case "TSRC":
						output = this.splitValue(type, text);
						break;
					case "TCO":
					case "TCON":
						output = this.splitValue(type, text).map((v) => parseGenre(v)).reduce((acc, val) => acc.concat(val), []);
						break;
					case "PCS":
					case "PCST":
						output = this.major >= 4 ? this.splitValue(type, text) : [text];
						output = Array.isArray(output) && output[0] === "" ? 1 : 0;
						break;
					default: output = this.major >= 4 ? this.splitValue(type, text) : [text];
				}
				break;
			}
			case "TXXX": {
				const idAndData = FrameParser.readIdentifierAndData(uint8Array.subarray(1), encoding);
				output = {
					description: idAndData.id,
					text: this.splitValue(type, decodeString(idAndData.data, encoding).replace(/\x00+$/, ""))
				};
				break;
			}
			case "PIC":
			case "APIC":
				if (includeCovers) {
					const pic = {};
					uint8Array = uint8Array.subarray(1);
					switch (this.major) {
						case 2:
							pic.format = decodeString(uint8Array.subarray(0, 3), "latin1");
							uint8Array = uint8Array.subarray(3);
							break;
						case 3:
						case 4:
							fzero = findZero(uint8Array, defaultEnc);
							pic.format = decodeString(uint8Array.subarray(0, fzero), defaultEnc);
							uint8Array = uint8Array.subarray(fzero + 1);
							break;
						default: throw makeUnexpectedMajorVersionError$1(this.major);
					}
					pic.format = FrameParser.fixPictureMimeType(pic.format);
					pic.type = AttachedPictureType[uint8Array[0]];
					uint8Array = uint8Array.subarray(1);
					fzero = findZero(uint8Array, encoding);
					pic.description = decodeString(uint8Array.subarray(0, fzero), encoding);
					uint8Array = uint8Array.subarray(fzero + nullTerminatorLength);
					pic.data = uint8Array;
					output = pic;
				}
				break;
			case "CNT":
			case "PCNT":
				output = decodeUintBE(uint8Array);
				break;
			case "SYLT": {
				const syltHeader = SyncTextHeader.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(SyncTextHeader.len);
				const result = {
					descriptor: "",
					language: syltHeader.language,
					contentType: syltHeader.contentType,
					timeStampFormat: syltHeader.timeStampFormat,
					syncText: []
				};
				let readSyllables = false;
				while (uint8Array.length > 0) {
					const nullStr = FrameParser.readNullTerminatedString(uint8Array, syltHeader.encoding);
					uint8Array = uint8Array.subarray(nullStr.len);
					if (readSyllables) {
						const timestamp = UINT32_BE.get(uint8Array, 0);
						uint8Array = uint8Array.subarray(UINT32_BE.len);
						result.syncText.push({
							text: nullStr.text,
							timestamp
						});
					} else {
						result.descriptor = nullStr.text;
						readSyllables = true;
					}
				}
				output = result;
				break;
			}
			case "ULT":
			case "USLT":
			case "COM":
			case "COMM": {
				const textHeader = TextHeader.get(uint8Array, offset);
				offset += TextHeader.len;
				const descriptorStr = FrameParser.readNullTerminatedString(uint8Array.subarray(offset), textHeader.encoding);
				offset += descriptorStr.len;
				const textStr = FrameParser.readNullTerminatedString(uint8Array.subarray(offset), textHeader.encoding);
				output = {
					language: textHeader.language,
					descriptor: descriptorStr.text,
					text: textStr.text
				};
				break;
			}
			case "UFID": {
				const ufid = FrameParser.readIdentifierAndData(uint8Array, defaultEnc);
				output = {
					owner_identifier: ufid.id,
					identifier: ufid.data
				};
				break;
			}
			case "PRIV": {
				const priv = FrameParser.readIdentifierAndData(uint8Array, defaultEnc);
				output = {
					owner_identifier: priv.id,
					data: priv.data
				};
				break;
			}
			case "POPM": {
				uint8Array = uint8Array.subarray(offset);
				const emailStr = FrameParser.readNullTerminatedString(uint8Array, urlEnc);
				const email = emailStr.text;
				uint8Array = uint8Array.subarray(emailStr.len);
				if (uint8Array.length === 0) {
					this.warningCollector.addWarning(`id3v2.${this.major} type=${type} POPM frame missing rating byte`);
					output = {
						email,
						rating: 0,
						counter: void 0
					};
					break;
				}
				const rating = UINT8.get(uint8Array, 0);
				const counterBytes = uint8Array.subarray(UINT8.len);
				output = {
					email,
					rating,
					counter: counterBytes.length > 0 ? decodeUintBE(counterBytes) : void 0
				};
				break;
			}
			case "GEOB": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				const mimeTypeStr = FrameParser.readNullTerminatedString(uint8Array, urlEnc);
				const mimeType = mimeTypeStr.text;
				uint8Array = uint8Array.subarray(mimeTypeStr.len);
				const filenameStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const filename = filenameStr.text;
				uint8Array = uint8Array.subarray(filenameStr.len);
				const descriptionStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const description = descriptionStr.text;
				uint8Array = uint8Array.subarray(descriptionStr.len);
				output = {
					type: mimeType,
					filename,
					description,
					data: uint8Array
				};
				break;
			}
			case "WCOM":
			case "WCOP":
			case "WOAF":
			case "WOAR":
			case "WOAS":
			case "WORS":
			case "WPAY":
			case "WPUB":
				output = FrameParser.readNullTerminatedString(uint8Array, urlEnc).text;
				break;
			case "WXXX": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				const descriptionStr = FrameParser.readNullTerminatedString(uint8Array, encoding);
				const description = descriptionStr.text;
				uint8Array = uint8Array.subarray(descriptionStr.len);
				output = {
					description,
					url: FrameParser.trimNullPadding(decodeString(uint8Array, defaultEnc))
				};
				break;
			}
			case "WFD":
			case "WFED": {
				const encoding = TextEncodingToken.get(uint8Array, 0);
				uint8Array = uint8Array.subarray(1);
				output = FrameParser.readNullTerminatedString(uint8Array, encoding).text;
				break;
			}
			case "MCDI":
				output = uint8Array.subarray(0, length);
				break;
			case "CHAP": {
				debug$26("Reading CHAP");
				fzero = findZero(uint8Array, defaultEnc);
				const chapter = {
					label: decodeString(uint8Array.subarray(0, fzero), defaultEnc),
					info: ChapterInfo.get(uint8Array, fzero + 1),
					frames: /* @__PURE__ */ new Map()
				};
				offset += fzero + 1 + ChapterInfo.len;
				while (offset < length) {
					const subFrame = readFrameHeader(uint8Array.subarray(offset), this.major, this.warningCollector);
					const headerSize = getFrameHeaderLength(this.major);
					offset += headerSize;
					const subOutput = this.readData(uint8Array.subarray(offset, offset + subFrame.length), subFrame.id, includeCovers);
					offset += subFrame.length;
					chapter.frames.set(subFrame.id, subOutput);
				}
				output = chapter;
				break;
			}
			case "CTOC": {
				debug$26("Reading CTOC");
				const idEnd = findZero(uint8Array, defaultEnc);
				const label = decodeString(uint8Array.subarray(0, idEnd), defaultEnc);
				offset = idEnd + 1;
				const flags = uint8Array[offset++];
				const topLevel = (flags & 2) !== 0;
				const ordered = (flags & 1) !== 0;
				const entryCount = uint8Array[offset++];
				const childElementIds = [];
				for (let i = 0; i < entryCount && offset < length; i++) {
					const end = findZero(uint8Array.subarray(offset), defaultEnc);
					const childId = decodeString(uint8Array.subarray(offset, offset + end), defaultEnc);
					childElementIds.push(childId);
					offset += end + 1;
				}
				const toc = {
					label,
					flags: {
						topLevel,
						ordered
					},
					childElementIds,
					frames: /* @__PURE__ */ new Map()
				};
				while (offset < length) {
					const subFrame = readFrameHeader(uint8Array.subarray(offset), this.major, this.warningCollector);
					const headerSize = getFrameHeaderLength(this.major);
					offset += headerSize;
					const subOutput = this.readData(uint8Array.subarray(offset, offset + subFrame.length), subFrame.id, includeCovers);
					offset += subFrame.length;
					toc.frames.set(subFrame.id, subOutput);
				}
				output = toc;
				break;
			}
			default: debug$26(`Warning: unsupported id3v2-tag-type: ${type}`);
		}
		return output;
	}
	static readNullTerminatedString(uint8Array, encoding) {
		const bomSize = encoding.bom ? 2 : 0;
		const originalLen = uint8Array.length;
		const valueArray = uint8Array.subarray(bomSize);
		const zeroIndex = findZero(valueArray, encoding.encoding);
		if (zeroIndex >= valueArray.length) return {
			text: decodeString(uint8Array, encoding.encoding),
			len: originalLen
		};
		return {
			text: decodeString(uint8Array.subarray(0, bomSize + zeroIndex), encoding.encoding),
			len: bomSize + zeroIndex + FrameParser.getNullTerminatorLength(encoding.encoding)
		};
	}
	static fixPictureMimeType(pictureType) {
		pictureType = pictureType.toLocaleLowerCase();
		switch (pictureType) {
			case "jpg": return "image/jpeg";
			case "png": return "image/png";
		}
		return pictureType;
	}
	/**
	* Converts TMCL (Musician credits list) or TIPL (Involved people list)
	* @param entries
	*/
	static functionList(entries) {
		const res = {};
		for (let i = 0; i + 1 < entries.length; i += 2) {
			const names = entries[i + 1].split(",");
			res[entries[i]] = res[entries[i]] ? res[entries[i]].concat(names) : names;
		}
		return res;
	}
	/**
	* id3v2.4 defines that multiple T* values are separated by 0x00
	* id3v2.3 defines that TCOM, TEXT, TOLY, TOPE & TPE1 values are separated by /
	* @param tag - Tag name
	* @param text - Concatenated tag value
	* @returns Split tag value
	*/
	splitValue(tag, text) {
		let values;
		if (this.major < 4) {
			values = text.split(/\x00/g);
			if (values.length > 1) this.warningCollector.addWarning(`ID3v2.${this.major} ${tag} uses non standard null-separator.`);
			else values = text.split(/\//g);
		} else values = text.split(/\x00/g);
		return FrameParser.trimArray(values);
	}
	static trimArray(values) {
		return values.map((value) => FrameParser.trimNullPadding(value).trim());
	}
	static trimNullPadding(value) {
		let end = value.length;
		while (end > 0 && value.charCodeAt(end - 1) === 0) end--;
		return end === value.length ? value : value.slice(0, end);
	}
	static readIdentifierAndData(uint8Array, encoding) {
		const idStr = FrameParser.readNullTerminatedString(uint8Array, {
			encoding,
			bom: false
		});
		return {
			id: idStr.text,
			data: uint8Array.subarray(idStr.len)
		};
	}
	static getNullTerminatorLength(enc) {
		return enc.startsWith("utf-16") ? 2 : 1;
	}
};
var Id3v2ContentError = class extends makeUnexpectedFileContentError("id3v2") {};
function makeUnexpectedMajorVersionError$1(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v2Parser.js
var ID3v2Parser = class ID3v2Parser {
	constructor() {
		this.tokenizer = void 0;
		this.id3Header = void 0;
		this.metadata = void 0;
		this.headerType = void 0;
		this.options = void 0;
	}
	static removeUnsyncBytes(buffer) {
		let readI = 0;
		let writeI = 0;
		while (readI < buffer.length - 1) {
			if (readI !== writeI) buffer[writeI] = buffer[readI];
			readI += buffer[readI] === 255 && buffer[readI + 1] === 0 ? 2 : 1;
			writeI++;
		}
		if (readI < buffer.length) buffer[writeI++] = buffer[readI];
		return buffer.subarray(0, writeI);
	}
	static readFrameData(uint8Array, frameHeader, majorVer, includeCovers, warningCollector) {
		const frameParser = new FrameParser(majorVer, warningCollector);
		switch (majorVer) {
			case 2: return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
			case 3:
			case 4:
				if (frameHeader.flags?.format.unsynchronisation) uint8Array = ID3v2Parser.removeUnsyncBytes(uint8Array);
				if (frameHeader.flags?.format.data_length_indicator) uint8Array = uint8Array.subarray(4, uint8Array.length);
				return frameParser.readData(uint8Array, frameHeader.id, includeCovers);
			default: throw makeUnexpectedMajorVersionError(majorVer);
		}
	}
	/**
	* Create a combined tag key, of tag & description
	* @param tag e.g.: COM
	* @param description e.g. iTunPGAP
	* @returns string e.g. COM:iTunPGAP
	*/
	static makeDescriptionTagName(tag, description) {
		return tag + (description ? `:${description}` : "");
	}
	async parse(metadata, tokenizer, options) {
		this.tokenizer = tokenizer;
		this.metadata = metadata;
		this.options = options;
		const id3Header = await this.tokenizer.readToken(ID3v2Header);
		if (id3Header.fileIdentifier !== "ID3") throw new Id3v2ContentError("expected ID3-header file-identifier 'ID3' was not found");
		this.id3Header = id3Header;
		this.headerType = `ID3v2.${id3Header.version.major}`;
		await (id3Header.flags.isExtendedHeader ? this.parseExtendedHeader() : this.parseId3Data(id3Header.size));
		const chapters = ID3v2Parser.mapId3v2Chapters(this.metadata.native[this.headerType]);
		this.metadata.setFormat("chapters", chapters);
	}
	async parseExtendedHeader() {
		const extendedHeader = await this.tokenizer.readToken(ExtendedHeader);
		const dataRemaining = extendedHeader.size - ExtendedHeader.len;
		return dataRemaining > 0 ? this.parseExtendedHeaderData(dataRemaining, extendedHeader.size) : this.parseId3Data(this.id3Header.size - extendedHeader.size);
	}
	async parseExtendedHeaderData(dataRemaining, extendedHeaderSize) {
		await this.tokenizer.ignore(dataRemaining);
		return this.parseId3Data(this.id3Header.size - extendedHeaderSize);
	}
	async parseId3Data(dataLen) {
		const uint8Array = await this.tokenizer.readToken(new Uint8ArrayType(dataLen));
		for (const tag of this.parseMetadata(uint8Array)) switch (tag.id) {
			case "TXXX":
				if (tag.value) await this.handleTag(tag, tag.value.text, () => tag.value.description);
				break;
			default: await (Array.isArray(tag.value) ? Promise.all(tag.value.map((value) => this.addTag(tag.id, value))) : this.addTag(tag.id, tag.value));
		}
	}
	async handleTag(tag, values, descriptor, resolveValue = (value) => value) {
		await Promise.all(values.map((value) => this.addTag(ID3v2Parser.makeDescriptionTagName(tag.id, descriptor(value)), resolveValue(value))));
	}
	async addTag(id, value) {
		await this.metadata.addTag(this.headerType, id, value);
	}
	parseMetadata(data) {
		let offset = 0;
		const tags = [];
		while (true) {
			if (offset === data.length) break;
			const frameHeaderLength = getFrameHeaderLength(this.id3Header.version.major);
			if (offset + frameHeaderLength > data.length) {
				this.metadata.addWarning("Illegal ID3v2 tag length");
				break;
			}
			const frameHeaderBytes = data.subarray(offset, offset + frameHeaderLength);
			offset += frameHeaderLength;
			const frameHeader = readFrameHeader(frameHeaderBytes, this.id3Header.version.major, this.metadata);
			const frameDataBytes = data.subarray(offset, offset + frameHeader.length);
			offset += frameHeader.length;
			const values = ID3v2Parser.readFrameData(frameDataBytes, frameHeader, this.id3Header.version.major, !this.options.skipCovers, this.metadata);
			if (values) tags.push({
				id: frameHeader.id,
				value: values
			});
		}
		return tags;
	}
	/**
	* Convert parsed ID3v2 chapter frames (CHAP / CTOC) to generic `format.chapters`.
	*
	* This function expects the `native` tags already to contain parsed `CHAP` and `CTOC` frame values,
	* as produced by `FrameParser.readData`.
	*/
	static mapId3v2Chapters(id3Tags) {
		if (!id3Tags) return;
		const chapFrames = id3Tags.filter((t) => t.id === "CHAP");
		if (!chapFrames?.length) return;
		const topLevelToc = id3Tags.filter((t) => t.id === "CTOC")?.find((t) => t.value.flags?.topLevel);
		const chapterById = /* @__PURE__ */ new Map();
		for (const chap of chapFrames) chapterById.set(chap.value.label, chap.value);
		const orderedIds = topLevelToc?.value.childElementIds;
		const chapters = [];
		const source = orderedIds ?? [...chapterById.keys()];
		for (const id of source) {
			const chap = chapterById.get(id);
			if (!chap) continue;
			const frames = chap.frames;
			const title = frames.get("TIT2");
			if (!title) continue;
			chapters.push({
				id,
				title,
				url: frames.get("WXXX"),
				start: chap.info.startTime / 1e3,
				end: chap.info.endTime / 1e3,
				image: frames.get("APIC")
			});
		}
		if (!orderedIds) chapters.sort((a, b) => a.start - b.start);
		return chapters.length ? chapters : void 0;
	}
};
function makeUnexpectedMajorVersionError(majorVer) {
	throw new Id3v2ContentError(`Unexpected majorVer: ${majorVer}`);
}
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffToken.js
var compressionTypes = {
	NONE: "not compressed	PCM	Apple Computer",
	sowt: "PCM (byte swapped)",
	fl32: "32-bit floating point IEEE 32-bit float",
	fl64: "64-bit floating point IEEE 64-bit float	Apple Computer",
	alaw: "ALaw 2:1	8-bit ITU-T G.711 A-law",
	ulaw: "µLaw 2:1	8-bit ITU-T G.711 µ-law	Apple Computer",
	ULAW: "CCITT G.711 u-law 8-bit ITU-T G.711 µ-law",
	ALAW: "CCITT G.711 A-law 8-bit ITU-T G.711 A-law",
	FL32: "Float 32	IEEE 32-bit float "
};
var AiffContentError = class extends makeUnexpectedFileContentError("AIFF") {};
var Common = class {
	constructor(header, isAifc) {
		this.isAifc = isAifc;
		const minimumChunkSize = isAifc ? 22 : 18;
		if (header.chunkSize < minimumChunkSize) throw new AiffContentError(`COMMON CHUNK size should always be at least ${minimumChunkSize}`);
		this.len = header.chunkSize;
	}
	get(buf, off) {
		const shift = UINT16_BE.get(buf, off + 8) - 16398;
		const baseSampleRate = UINT16_BE.get(buf, off + 8 + 2);
		const res = {
			numChannels: UINT16_BE.get(buf, off),
			numSampleFrames: UINT32_BE.get(buf, off + 2),
			sampleSize: UINT16_BE.get(buf, off + 6),
			sampleRate: shift < 0 ? baseSampleRate >> Math.abs(shift) : baseSampleRate << shift
		};
		if (this.isAifc) {
			res.compressionType = FourCcToken.get(buf, off + 18);
			if (this.len > 22) {
				const strLen = UINT8.get(buf, off + 22);
				if (strLen > 0) {
					const padding = (strLen + 1) % 2;
					if (23 + strLen + padding === this.len) res.compressionName = new StringType(strLen, "latin1").get(buf, off + 23);
					else throw new AiffContentError("Illegal pstring length");
				} else res.compressionName = void 0;
			}
		} else res.compressionName = "PCM";
		return res;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/iff/index.js
/**
* Common AIFF chunk header
*/
var Header$4 = {
	len: 8,
	get: (buf, off) => {
		return {
			chunkID: FourCcToken.get(buf, off),
			chunkSize: Number(BigInt(UINT32_BE.get(buf, off + 4)))
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffParser.js
var AiffParser_exports = /* @__PURE__ */ __exportAll({ AIFFParser: () => AIFFParser });
var debug$25 = (0, import_src.default)("music-metadata:parser:aiff");
/**
* AIFF - Audio Interchange File Format
*
* Ref:
* - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html
* - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf
*/
var AIFFParser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.isCompressed = null;
	}
	async parse() {
		if ((await this.tokenizer.readToken(Header$4)).chunkID !== "FORM") throw new AiffContentError("Invalid Chunk-ID, expected 'FORM'");
		const type = await this.tokenizer.readToken(FourCcToken);
		switch (type) {
			case "AIFF":
				this.metadata.setFormat("container", type);
				this.isCompressed = false;
				break;
			case "AIFC":
				this.metadata.setFormat("container", "AIFF-C");
				this.isCompressed = true;
				break;
			default: throw new AiffContentError(`Unsupported AIFF type: ${type}`);
		}
		this.metadata.setFormat("lossless", !this.isCompressed);
		this.metadata.setAudioOnly();
		try {
			while (!this.tokenizer.fileInfo.size || this.tokenizer.fileInfo.size - this.tokenizer.position >= Header$4.len) {
				debug$25(`Reading AIFF chunk at offset=${this.tokenizer.position}`);
				const chunkHeader = await this.tokenizer.readToken(Header$4);
				const nextChunk = 2 * Math.round(chunkHeader.chunkSize / 2);
				const bytesRead = await this.readData(chunkHeader);
				await this.tokenizer.ignore(nextChunk - bytesRead);
			}
		} catch (err) {
			if (err instanceof EndOfStreamError) debug$25("End-of-stream");
			else throw err;
		}
	}
	async readData(header) {
		switch (header.chunkID) {
			case "COMM": {
				if (this.isCompressed === null) throw new AiffContentError("Failed to parse AIFF.COMM chunk when compression type is unknown");
				const common = await this.tokenizer.readToken(new Common(header, this.isCompressed));
				this.metadata.setFormat("bitsPerSample", common.sampleSize);
				this.metadata.setFormat("sampleRate", common.sampleRate);
				this.metadata.setFormat("numberOfChannels", common.numChannels);
				this.metadata.setFormat("numberOfSamples", common.numSampleFrames);
				this.metadata.setFormat("duration", common.numSampleFrames / common.sampleRate);
				if (common.compressionName || common.compressionType) this.metadata.setFormat("codec", common.compressionName ?? compressionTypes[common.compressionType]);
				return header.chunkSize;
			}
			case "ID3 ": {
				const id3_data = await this.tokenizer.readToken(new Uint8ArrayType(header.chunkSize));
				const rst = fromBuffer(id3_data);
				await new ID3v2Parser().parse(this.metadata, rst, this.options);
				return header.chunkSize;
			}
			case "SSND":
				if (this.metadata.format.duration) this.metadata.setFormat("bitrate", 8 * header.chunkSize / this.metadata.format.duration);
				return 0;
			case "NAME":
			case "AUTH":
			case "(c) ":
			case "ANNO": return this.readTextChunk(header);
			default:
				debug$25(`Ignore chunk id=${header.chunkID}, size=${header.chunkSize}`);
				return 0;
		}
	}
	async readTextChunk(header) {
		const values = (await this.tokenizer.readToken(new StringType(header.chunkSize, "ascii"))).split("\0").map((v) => v.trim()).filter((v) => v?.length);
		await Promise.all(values.map((v) => this.metadata.addTag("AIFF", header.chunkID, v)));
		return header.chunkSize;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/types.js
var TargetType = {
	10: "shot",
	20: "scene",
	30: "track",
	40: "part",
	50: "album",
	60: "edition",
	70: "collection"
};
var TrackType = {
	video: 1,
	audio: 2,
	complex: 3,
	logo: 4,
	subtitle: 17,
	button: 18,
	control: 32
};
var TrackTypeValueToKeyMap = {
	[TrackType.video]: "video",
	[TrackType.audio]: "audio",
	[TrackType.complex]: "complex",
	[TrackType.logo]: "logo",
	[TrackType.subtitle]: "subtitle",
	[TrackType.button]: "button",
	[TrackType.control]: "control"
};
//#endregion
//#region node_modules/win-guid/lib/guid.js
/**
* Parse canonical GUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
* into Windows / CFBF byte order.
*/
function parseWindowsGuid(guid) {
	let s = guid.trim();
	if (s.length !== 36 || s[8] !== "-" || s[13] !== "-" || s[18] !== "-" || s[23] !== "-") throw new Error(`Invalid GUID format: ${guid}`);
	let v;
	const out = /* @__PURE__ */ new Uint8Array(16);
	v = parseInt(s.slice(0, 8), 16);
	out[0] = v & 255;
	out[1] = v >>> 8 & 255;
	out[2] = v >>> 16 & 255;
	out[3] = v >>> 24 & 255;
	v = parseInt(s.slice(9, 13), 16);
	out[4] = v & 255;
	out[5] = v >>> 8 & 255;
	v = parseInt(s.slice(14, 18), 16);
	out[6] = v & 255;
	out[7] = v >>> 8 & 255;
	v = parseInt(s.slice(19, 23), 16);
	out[8] = v >>> 8 & 255;
	out[9] = v & 255;
	v = parseInt(s.slice(24, 32), 16);
	out[10] = v >>> 24 & 255;
	out[11] = v >>> 16 & 255;
	out[12] = v >>> 8 & 255;
	out[13] = v & 255;
	v = parseInt(s.slice(32, 36), 16);
	out[14] = v >>> 8 & 255;
	out[15] = v & 255;
	for (let i = 0; i < 16; i++) if (!Number.isFinite(out[i])) throw new Error(`Invalid GUID format: ${guid}`);
	if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) throw new Error(`Invalid GUID format: ${guid}`);
	return out;
}
var Guid = class Guid {
	constructor(bytes) {
		if (bytes.length !== 16) throw new Error("GUID must be exactly 16 bytes");
		this.bytes = bytes;
	}
	static fromString(guid) {
		return new Guid(parseWindowsGuid(guid));
	}
	/**
	* Convert Windows / CFBF byte order into canonical GUID string:
	* xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	*/
	toString() {
		const b = this.bytes;
		const hx = (n) => n.toString(16).padStart(2, "0");
		return `${hx(b[3]) + hx(b[2]) + hx(b[1]) + hx(b[0])}-${hx(b[5]) + hx(b[4])}-${hx(b[7]) + hx(b[6])}-${hx(b[8]) + hx(b[9])}-${hx(b[10]) + hx(b[11]) + hx(b[12]) + hx(b[13]) + hx(b[14]) + hx(b[15])}`.toUpperCase();
	}
	/**
	* Compare against a Uint8Array containing GUID bytes
	* in Windows / CFBF layout.
	*/
	equals(buf, offset = 0) {
		if (offset < 0 || buf.length - offset < 16) return false;
		const a = this.bytes;
		for (let i = 0; i < 16; i++) if (buf[offset + i] !== a[i]) return false;
		return true;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfGuid.js
/**
* Ref:
* - https://tools.ietf.org/html/draft-fleischman-asf-01, Appendix A: ASF GUIDs
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
*
* ASF File Structure:
* - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
*
* ASF GUIDs:
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/10_asf_guids.html
* - https://github.com/dji-sdk/FFmpeg/blob/master/libavformat/asf.c
*/
var AsfGuid = class AsfGuid {
	static fromBin(bin, offset = 0) {
		return new AsfGuid(AsfGuid.decode(bin, offset));
	}
	/**
	* Decode GUID in format like "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
	* @param objectId Binary GUID
	* @param offset Read offset in bytes, default 0
	* @returns GUID as dashed hexadecimal representation
	*/
	static decode(objectId, offset = 0) {
		return new Guid(objectId.subarray(offset, offset + 16)).toString();
	}
	/**
	* Decode stream type
	* @param mediaType Media type GUID
	* @returns Media type
	*/
	static decodeMediaType(mediaType) {
		switch (mediaType.str) {
			case AsfGuid.AudioMedia.str: return "audio";
			case AsfGuid.VideoMedia.str: return "video";
			case AsfGuid.CommandMedia.str: return "command";
			case AsfGuid.Degradable_JPEG_Media.str: return "degradable-jpeg";
			case AsfGuid.FileTransferMedia.str: return "file-transfer";
			case AsfGuid.BinaryMedia.str: return "binary";
		}
	}
	/**
	* Encode GUID
	* @param guid GUID like: "B503BF5F-2EA9-CF11-8EE3-00C00C205365"
	* @returns Encoded Binary GUID
	*/
	static encode(guid) {
		return parseWindowsGuid(guid);
	}
	constructor(str) {
		this.str = str;
	}
	equals(guid) {
		return this.str === guid.str;
	}
	toBin() {
		return AsfGuid.encode(this.str);
	}
};
AsfGuid.HeaderObject = new AsfGuid("75B22630-668E-11CF-A6D9-00AA0062CE6C");
AsfGuid.DataObject = new AsfGuid("75B22636-668E-11CF-A6D9-00AA0062CE6C");
AsfGuid.SimpleIndexObject = new AsfGuid("33000890-E5B1-11CF-89F4-00A0C90349CB");
AsfGuid.IndexObject = new AsfGuid("D6E229D3-35DA-11D1-9034-00A0C90349BE");
AsfGuid.MediaObjectIndexObject = new AsfGuid("FEB103F8-12AD-4C64-840F-2A1D2F7AD48C");
AsfGuid.TimecodeIndexObject = new AsfGuid("3CB73FD0-0C4A-4803-953D-EDF7B6228F0C");
AsfGuid.FilePropertiesObject = new AsfGuid("8CABDCA1-A947-11CF-8EE4-00C00C205365");
AsfGuid.StreamPropertiesObject = new AsfGuid("B7DC0791-A9B7-11CF-8EE6-00C00C205365");
AsfGuid.HeaderExtensionObject = new AsfGuid("5FBF03B5-A92E-11CF-8EE3-00C00C205365");
AsfGuid.CodecListObject = new AsfGuid("86D15240-311D-11D0-A3A4-00A0C90348F6");
AsfGuid.ScriptCommandObject = new AsfGuid("1EFB1A30-0B62-11D0-A39B-00A0C90348F6");
AsfGuid.MarkerObject = new AsfGuid("F487CD01-A951-11CF-8EE6-00C00C205365");
AsfGuid.BitrateMutualExclusionObject = new AsfGuid("D6E229DC-35DA-11D1-9034-00A0C90349BE");
AsfGuid.ErrorCorrectionObject = new AsfGuid("75B22635-668E-11CF-A6D9-00AA0062CE6C");
AsfGuid.ContentDescriptionObject = new AsfGuid("75B22633-668E-11CF-A6D9-00AA0062CE6C");
AsfGuid.ExtendedContentDescriptionObject = new AsfGuid("D2D0A440-E307-11D2-97F0-00A0C95EA850");
AsfGuid.ContentBrandingObject = new AsfGuid("2211B3FA-BD23-11D2-B4B7-00A0C955FC6E");
AsfGuid.StreamBitratePropertiesObject = new AsfGuid("7BF875CE-468D-11D1-8D82-006097C9A2B2");
AsfGuid.ContentEncryptionObject = new AsfGuid("2211B3FB-BD23-11D2-B4B7-00A0C955FC6E");
AsfGuid.ExtendedContentEncryptionObject = new AsfGuid("298AE614-2622-4C17-B935-DAE07EE9289C");
AsfGuid.DigitalSignatureObject = new AsfGuid("2211B3FC-BD23-11D2-B4B7-00A0C955FC6E");
AsfGuid.PaddingObject = new AsfGuid("1806D474-CADF-4509-A4BA-9AABCB96AAE8");
AsfGuid.ExtendedStreamPropertiesObject = new AsfGuid("14E6A5CB-C672-4332-8399-A96952065B5A");
AsfGuid.AdvancedMutualExclusionObject = new AsfGuid("A08649CF-4775-4670-8A16-6E35357566CD");
AsfGuid.GroupMutualExclusionObject = new AsfGuid("D1465A40-5A79-4338-B71B-E36B8FD6C249");
AsfGuid.StreamPrioritizationObject = new AsfGuid("D4FED15B-88D3-454F-81F0-ED5C45999E24");
AsfGuid.BandwidthSharingObject = new AsfGuid("A69609E6-517B-11D2-B6AF-00C04FD908E9");
AsfGuid.LanguageListObject = new AsfGuid("7C4346A9-EFE0-4BFC-B229-393EDE415C85");
AsfGuid.MetadataObject = new AsfGuid("C5F8CBEA-5BAF-4877-8467-AA8C44FA4CCA");
AsfGuid.MetadataLibraryObject = new AsfGuid("44231C94-9498-49D1-A141-1D134E457054");
AsfGuid.IndexParametersObject = new AsfGuid("D6E229DF-35DA-11D1-9034-00A0C90349BE");
AsfGuid.MediaObjectIndexParametersObject = new AsfGuid("6B203BAD-3F11-48E4-ACA8-D7613DE2CFA7");
AsfGuid.TimecodeIndexParametersObject = new AsfGuid("F55E496D-9797-4B5D-8C8B-604DFE9BFB24");
AsfGuid.CompatibilityObject = new AsfGuid("26F18B5D-4584-47EC-9F5F-0E651F0452C9");
AsfGuid.AdvancedContentEncryptionObject = new AsfGuid("43058533-6981-49E6-9B74-AD12CB86D58C");
AsfGuid.AudioMedia = new AsfGuid("F8699E40-5B4D-11CF-A8FD-00805F5C442B");
AsfGuid.VideoMedia = new AsfGuid("BC19EFC0-5B4D-11CF-A8FD-00805F5C442B");
AsfGuid.CommandMedia = new AsfGuid("59DACFC0-59E6-11D0-A3AC-00A0C90348F6");
AsfGuid.JFIF_Media = new AsfGuid("B61BE100-5B4E-11CF-A8FD-00805F5C442B");
AsfGuid.Degradable_JPEG_Media = new AsfGuid("35907DE0-E415-11CF-A917-00805F5C442B");
AsfGuid.FileTransferMedia = new AsfGuid("91BD222C-F21C-497A-8B6D-5AA86BFC0185");
AsfGuid.BinaryMedia = new AsfGuid("3AFB65E2-47EF-40F2-AC2C-70A90D71D343");
AsfGuid.ASF_Index_Placeholder_Object = new AsfGuid("D9AADE20-7C17-4F9C-BC28-8555DD98E2A2");
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfUtil.js
function getParserForAttr(i) {
	return attributeParsers[i];
}
function parseUnicodeAttr(uint8Array) {
	return stripNulls(decodeString(uint8Array, "utf-16le"));
}
var attributeParsers = [
	parseUnicodeAttr,
	parseByteArrayAttr,
	parseBoolAttr,
	parseDWordAttr,
	parseQWordAttr,
	parseWordAttr,
	parseByteArrayAttr
];
function parseByteArrayAttr(buf) {
	return new Uint8Array(buf);
}
function parseBoolAttr(buf, offset = 0) {
	return parseWordAttr(buf, offset) === 1;
}
function parseDWordAttr(buf, offset = 0) {
	return UINT32_LE.get(buf, offset);
}
function parseQWordAttr(buf, offset = 0) {
	return UINT64_LE.get(buf, offset);
}
function parseWordAttr(buf, offset = 0) {
	return UINT16_LE.get(buf, offset);
}
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfObject.js
var AsfContentParseError = class extends makeUnexpectedFileContentError("ASF") {};
/**
* Token for: 3. ASF top-level Header Object
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3
*/
var TopLevelHeaderObjectToken = {
	len: 30,
	get: (buf, off) => {
		const base = HeaderObjectToken.get(buf, off);
		if (base.objectSize < TopLevelHeaderObjectToken.len) throw new AsfContentParseError(`Invalid ASF top-level header object size: ${base.objectSize}`);
		return {
			...base,
			numberOfHeaderObjects: UINT32_LE.get(buf, off + 24)
		};
	}
};
/**
* Token for: 3.1 Header Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_1
*/
var HeaderObjectToken = {
	len: 24,
	get: (buf, off) => {
		const objectSize = UINT64_LE.get(buf, off + 16);
		if (objectSize < BigInt(HeaderObjectToken.len) || objectSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new AsfContentParseError(`Invalid ASF header object size: ${objectSize}`);
		return {
			objectId: AsfGuid.fromBin(buf, off),
			objectSize: Number(objectSize)
		};
	}
};
var State = class {
	constructor(header) {
		this.len = header.objectSize - HeaderObjectToken.len;
	}
	postProcessTag(tags, name, valueType, data) {
		if (name === "WM/Picture") tags.push({
			id: name,
			value: WmPictureToken.fromBuffer(data)
		});
		else {
			const parseAttr = getParserForAttr(valueType);
			if (!parseAttr) throw new AsfContentParseError(`unexpected value headerType: ${valueType}`);
			tags.push({
				id: name,
				value: parseAttr(data)
			});
		}
	}
};
/**
* Token for: 3.2: File Properties Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_2
*/
var FilePropertiesObject = class extends State {
	get(buf, off) {
		return {
			fileId: AsfGuid.fromBin(buf, off),
			fileSize: UINT64_LE.get(buf, off + 16),
			creationDate: UINT64_LE.get(buf, off + 24),
			dataPacketsCount: UINT64_LE.get(buf, off + 32),
			playDuration: UINT64_LE.get(buf, off + 40),
			sendDuration: UINT64_LE.get(buf, off + 48),
			preroll: UINT64_LE.get(buf, off + 56),
			flags: {
				broadcast: getBit(buf, off + 64, 24),
				seekable: getBit(buf, off + 64, 25)
			},
			minimumDataPacketSize: UINT32_LE.get(buf, off + 68),
			maximumDataPacketSize: UINT32_LE.get(buf, off + 72),
			maximumBitrate: UINT32_LE.get(buf, off + 76)
		};
	}
};
FilePropertiesObject.guid = AsfGuid.FilePropertiesObject;
/**
* Token for: 3.3 Stream Properties Object (mandatory, one per stream)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_3
*/
var StreamPropertiesObject = class extends State {
	get(buf, off) {
		return {
			streamType: AsfGuid.decodeMediaType(AsfGuid.fromBin(buf, off)),
			errorCorrectionType: AsfGuid.fromBin(buf, off + 8)
		};
	}
};
StreamPropertiesObject.guid = AsfGuid.StreamPropertiesObject;
/**
* 3.4: Header Extension Object (mandatory, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_4
*/
var HeaderExtensionObject = class {
	constructor() {
		this.len = 22;
	}
	get(buf, off) {
		const view = new DataView(buf.buffer, off);
		return {
			reserved1: AsfGuid.fromBin(buf, off),
			reserved2: view.getUint16(16, true),
			extensionDataSize: view.getUint32(18, true)
		};
	}
};
HeaderExtensionObject.guid = AsfGuid.HeaderExtensionObject;
/**
* 3.5: The Codec List Object provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
*/
var CodecListObjectHeader = {
	len: 20,
	get: (buf, off) => {
		return { entryCount: new DataView(buf.buffer, off).getUint16(16, true) };
	}
};
var BoundedReader = class {
	constructor(tokenizer, size) {
		this.tokenizer = tokenizer;
		this.remaining = size;
	}
	async readToken(token) {
		this.ensureAvailable(token.len);
		const value = await this.tokenizer.readToken(token);
		this.remaining -= token.len;
		return value;
	}
	async readNumber(token) {
		return this.readToken(token);
	}
	async readBuffer(length) {
		this.ensureAvailable(length);
		const buffer = new Uint8Array(length);
		await this.tokenizer.readBuffer(buffer);
		this.remaining -= length;
		return buffer;
	}
	async ignoreRemaining() {
		const ignored = await this.tokenizer.ignore(this.remaining);
		if (ignored !== this.remaining) throw new AsfContentParseError(`Unexpected end of ASF Codec List Object; missing ${this.remaining - ignored} bytes`);
		this.remaining = 0;
	}
	ensureAvailable(length) {
		if (length > this.remaining) throw new AsfContentParseError(`ASF Codec List field size ${length} exceeds remaining object payload size ${this.remaining}`);
	}
};
async function readString(reader) {
	const length = await reader.readNumber(UINT16_LE);
	return (await reader.readToken(new StringType(length * 2, "utf-16le"))).replace("\0", "");
}
/**
* 3.5: Read the Codec-List-Object, which provides user-friendly information about the codecs and formats used to encode the content found in the ASF file.
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_5
*/
async function readCodecEntries(tokenizer, payloadSize) {
	const reader = new BoundedReader(tokenizer, payloadSize);
	const codecHeader = await reader.readToken(CodecListObjectHeader);
	const entries = [];
	for (let i = 0; i < codecHeader.entryCount; ++i) entries.push(await readCodecEntry(reader));
	await reader.ignoreRemaining();
	return entries;
}
async function readInformation(reader) {
	const length = await reader.readNumber(UINT16_LE);
	return reader.readBuffer(length);
}
/**
* Read Codec-Entries
* @param reader
*/
async function readCodecEntry(reader) {
	const type = await reader.readNumber(UINT16_LE);
	return {
		type: {
			videoCodec: (type & 1) === 1,
			audioCodec: (type & 2) === 2
		},
		codecName: await readString(reader),
		description: await readString(reader),
		information: await readInformation(reader)
	};
}
/**
* 3.10 Content Description Object (optional, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_10
*/
var ContentDescriptionObjectState = class ContentDescriptionObjectState extends State {
	get(buf, off) {
		const tags = [];
		const view = new DataView(buf.buffer, off);
		let pos = 10;
		for (let i = 0; i < ContentDescriptionObjectState.contentDescTags.length; ++i) {
			const length = view.getUint16(i * 2, true);
			if (length > 0) {
				const tagName = ContentDescriptionObjectState.contentDescTags[i];
				const end = pos + length;
				tags.push({
					id: tagName,
					value: parseUnicodeAttr(buf.subarray(off + pos, off + end))
				});
				pos = end;
			}
		}
		return tags;
	}
};
ContentDescriptionObjectState.guid = AsfGuid.ContentDescriptionObject;
ContentDescriptionObjectState.contentDescTags = [
	"Title",
	"Author",
	"Copyright",
	"Description",
	"Rating"
];
/**
* 3.11 Extended Content Description Object (optional, one only)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/03_asf_top_level_header_object.html#3_11
*/
var ExtendedContentDescriptionObjectState = class extends State {
	get(buf, off) {
		const tags = [];
		const view = new DataView(buf.buffer, off);
		const attrCount = view.getUint16(0, true);
		let pos = 2;
		for (let i = 0; i < attrCount; i += 1) {
			const nameLen = view.getUint16(pos, true);
			pos += 2;
			const name = parseUnicodeAttr(buf.subarray(off + pos, off + pos + nameLen));
			pos += nameLen;
			const valueType = view.getUint16(pos, true);
			pos += 2;
			const valueLen = view.getUint16(pos, true);
			pos += 2;
			const value = buf.subarray(off + pos, off + pos + valueLen);
			pos += valueLen;
			this.postProcessTag(tags, name, valueType, value);
		}
		return tags;
	}
};
ExtendedContentDescriptionObjectState.guid = AsfGuid.ExtendedContentDescriptionObject;
/**
* 4.1 Extended Stream Properties Object (optional, 1 per media stream)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_1
*/
var ExtendedStreamPropertiesObjectState = class extends State {
	get(buf, off) {
		const view = new DataView(buf.buffer, off);
		return {
			startTime: UINT64_LE.get(buf, off),
			endTime: UINT64_LE.get(buf, off + 8),
			dataBitrate: view.getInt32(12, true),
			bufferSize: view.getInt32(16, true),
			initialBufferFullness: view.getInt32(20, true),
			alternateDataBitrate: view.getInt32(24, true),
			alternateBufferSize: view.getInt32(28, true),
			alternateInitialBufferFullness: view.getInt32(32, true),
			maximumObjectSize: view.getInt32(36, true),
			flags: {
				reliableFlag: getBit(buf, off + 40, 0),
				seekableFlag: getBit(buf, off + 40, 1),
				resendLiveCleanpointsFlag: getBit(buf, off + 40, 2)
			},
			streamNumber: view.getInt16(42, true),
			streamLanguageId: view.getInt16(44, true),
			averageTimePerFrame: view.getInt32(52, true),
			streamNameCount: view.getInt32(54, true),
			payloadExtensionSystems: view.getInt32(56, true),
			streamNames: [],
			streamPropertiesObject: null
		};
	}
};
ExtendedStreamPropertiesObjectState.guid = AsfGuid.ExtendedStreamPropertiesObject;
/**
* 4.7  Metadata Object (optional, 0 or 1)
* Ref: http://drang.s4.xrea.com/program/tips/id3tag/wmp/04_objects_in_the_asf_header_extension_object.html#4_7
*/
var MetadataObjectState = class extends State {
	get(uint8Array, off) {
		const tags = [];
		const view = new DataView(uint8Array.buffer, off);
		const descriptionRecordsCount = view.getUint16(0, true);
		let pos = 2;
		for (let i = 0; i < descriptionRecordsCount; i += 1) {
			pos += 4;
			const nameLen = view.getUint16(pos, true);
			pos += 2;
			const dataType = view.getUint16(pos, true);
			pos += 2;
			const dataLen = view.getUint32(pos, true);
			pos += 4;
			const name = parseUnicodeAttr(uint8Array.subarray(off + pos, off + pos + nameLen));
			pos += nameLen;
			const data = uint8Array.subarray(off + pos, off + pos + dataLen);
			pos += dataLen;
			this.postProcessTag(tags, name, dataType, data);
		}
		return tags;
	}
};
MetadataObjectState.guid = AsfGuid.MetadataObject;
var MetadataLibraryObjectState = class extends MetadataObjectState {};
MetadataLibraryObjectState.guid = AsfGuid.MetadataLibraryObject;
/**
* Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd757977(v=vs.85).aspx
*/
var WmPictureToken = class WmPictureToken {
	static fromBuffer(buffer) {
		return new WmPictureToken(buffer.length).get(buffer, 0);
	}
	constructor(len) {
		this.len = len;
	}
	get(buffer, offset) {
		const view = new DataView(buffer.buffer, offset);
		const typeId = view.getUint8(0);
		const size = view.getInt32(1, true);
		let index = 5;
		while (view.getUint16(index) !== 0) index += 2;
		const format = new StringType(index - 5, "utf-16le").get(buffer, 5);
		while (view.getUint16(index) !== 0) index += 2;
		const description = new StringType(index - 5, "utf-16le").get(buffer, 5);
		return {
			type: AttachedPictureType[typeId],
			format,
			description,
			size,
			data: buffer.slice(index + 4)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfParser.js
var AsfParser_exports = /* @__PURE__ */ __exportAll({ AsfParser: () => AsfParser });
var debug$24 = (0, import_src.default)("music-metadata:parser:ASF");
var headerType = "asf";
var maxAsfMetadataObjectSize = 16777216;
/**
* Windows Media Metadata Usage Guidelines
* - Ref: https://msdn.microsoft.com/en-us/library/ms867702.aspx
*
* Ref:
* - https://tools.ietf.org/html/draft-fleischman-asf-01
* - https://hwiegman.home.xs4all.nl/fileformats/asf/ASF_Specification.pdf
* - http://drang.s4.xrea.com/program/tips/id3tag/wmp/index.html
* - https://msdn.microsoft.com/en-us/library/windows/desktop/ee663575(v=vs.85).aspx
*/
var AsfParser = class extends BasicParser {
	async parse() {
		const header = await this.tokenizer.readToken(TopLevelHeaderObjectToken);
		if (!header.objectId.equals(AsfGuid.HeaderObject)) throw new AsfContentParseError(`expected asf header; but was not found; got: ${header.objectId.str}`);
		if (header.numberOfHeaderObjects < 1 || header.numberOfHeaderObjects > 1e4) throw new AsfContentParseError(`Unrealistic number of ASF header objects: ${header.numberOfHeaderObjects}`);
		await this.parseObjectHeaders(header.numberOfHeaderObjects, header.objectSize - TopLevelHeaderObjectToken.len);
	}
	async parseObjectHeaders(numberOfObjectHeaders, remainingHeaderSize) {
		let tags;
		for (let index = 0; index < numberOfObjectHeaders; ++index) {
			const { header, payloadSize } = await this.readObjectHeader(remainingHeaderSize, "header");
			debug$24("header GUID=%s", header.objectId.str);
			switch (header.objectId.str) {
				case FilePropertiesObject.guid.str: {
					this.validateAllocationSize(payloadSize, "File Properties Object");
					const fpo = await this.tokenizer.readToken(new FilePropertiesObject(header));
					this.metadata.setFormat("duration", Number(fpo.playDuration / BigInt(1e3)) / 1e4 - Number(fpo.preroll) / 1e3);
					this.metadata.setFormat("bitrate", fpo.maximumBitrate);
					break;
				}
				case StreamPropertiesObject.guid.str: {
					this.validateAllocationSize(payloadSize, "Stream Properties Object");
					const spo = await this.tokenizer.readToken(new StreamPropertiesObject(header));
					this.metadata.setFormat("container", `ASF/${spo.streamType}`);
					break;
				}
				case HeaderExtensionObject.guid.str: {
					const extensionHeaderToken = new HeaderExtensionObject();
					if (payloadSize < extensionHeaderToken.len) throw new AsfContentParseError(`ASF Header Extension Object payload is too small: ${payloadSize} bytes`);
					const extHeader = await this.tokenizer.readToken(extensionHeaderToken);
					const expectedExtensionSize = payloadSize - extensionHeaderToken.len;
					if (extHeader.extensionDataSize !== expectedExtensionSize) throw new AsfContentParseError(`ASF extension data size ${extHeader.extensionDataSize} does not match enclosing payload size ${expectedExtensionSize}`);
					await this.parseExtensionObject(extHeader.extensionDataSize);
					break;
				}
				case ContentDescriptionObjectState.guid.str:
					this.validateAllocationSize(payloadSize, "Content Description Object");
					tags = await this.tokenizer.readToken(new ContentDescriptionObjectState(header));
					await this.addTags(tags);
					break;
				case ExtendedContentDescriptionObjectState.guid.str:
					this.validateAllocationSize(payloadSize, "Extended Content Description Object");
					tags = await this.tokenizer.readToken(new ExtendedContentDescriptionObjectState(header));
					await this.addTags(tags);
					break;
				case AsfGuid.CodecListObject.str: {
					this.validateAllocationSize(payloadSize, "Codec List Object");
					let codecs;
					try {
						codecs = await readCodecEntries(this.tokenizer, payloadSize);
					} catch (error) {
						throw new AsfContentParseError(`Invalid ASF Codec List Object: ${error instanceof Error ? error.message : String(error)}`);
					}
					codecs.forEach((codec) => {
						this.metadata.addStreamInfo({
							type: codec.type.videoCodec ? TrackType.video : TrackType.audio,
							codecName: codec.codecName
						});
					});
					const audioCodecs = codecs.filter((codec) => codec.type.audioCodec).map((codec) => codec.codecName).join("/");
					this.metadata.setFormat("codec", audioCodecs);
					break;
				}
				case AsfGuid.StreamBitratePropertiesObject.str:
					await this.ignorePayload(payloadSize, "Stream Bitrate Properties Object");
					break;
				case AsfGuid.PaddingObject.str:
					debug$24("Padding: %s bytes", payloadSize);
					await this.ignorePayload(payloadSize, "Padding Object");
					break;
				default:
					this.metadata.addWarning(`Ignore ASF-Object-GUID: ${header.objectId.str}`);
					debug$24("Ignore ASF-Object-GUID: %s", header.objectId.str);
					await this.ignorePayload(payloadSize, `object ${header.objectId.str}`);
			}
			remainingHeaderSize -= header.objectSize;
		}
		if (remainingHeaderSize !== 0) throw new AsfContentParseError(`ASF header child objects leave ${remainingHeaderSize} payload byte(s) unaccounted`);
	}
	async addTags(tags) {
		await Promise.all(tags.map(({ id, value }) => this.metadata.addTag(headerType, id, value)));
	}
	async readObjectHeader(remainingSize, containerType) {
		if (remainingSize < HeaderObjectToken.len) throw new AsfContentParseError(`Insufficient ASF ${containerType} data for an object header: ${remainingSize} bytes`);
		const header = await this.tokenizer.readToken(HeaderObjectToken);
		if (header.objectSize > remainingSize) throw new AsfContentParseError(`ASF ${containerType} object size ${header.objectSize} exceeds remaining ${containerType} payload size ${remainingSize}`);
		return {
			header,
			payloadSize: this.validatePayloadAvailability(header, `${containerType} object`)
		};
	}
	validatePayloadAvailability(header, objectType) {
		const payloadSize = header.objectSize - HeaderObjectToken.len;
		const fileSize = this.tokenizer.fileInfo.size;
		if (fileSize !== void 0) {
			const available = fileSize - this.tokenizer.position;
			if (payloadSize > available) throw new AsfContentParseError(`ASF ${objectType} payload size ${payloadSize} exceeds available input size ${available}`);
		}
		return payloadSize;
	}
	validateAllocationSize(payloadSize, objectType) {
		if (payloadSize > maxAsfMetadataObjectSize) throw new AsfContentParseError(`ASF ${objectType} payload size ${payloadSize} exceeds allocation limit ${maxAsfMetadataObjectSize}`);
	}
	async ignorePayload(payloadSize, objectType) {
		let ignored;
		try {
			ignored = await this.tokenizer.ignore(payloadSize);
		} catch (error) {
			if (error instanceof EndOfStreamError) throw new AsfContentParseError(`Unexpected end of ASF ${objectType}`);
			throw error;
		}
		if (ignored !== payloadSize) throw new AsfContentParseError(`Unexpected end of ASF ${objectType}; missing ${payloadSize - ignored} bytes`);
	}
	async parseExtensionObject(extensionSize) {
		while (extensionSize > 0) {
			const { header, payloadSize } = await this.readObjectHeader(extensionSize, "extension");
			switch (header.objectId.str) {
				case ExtendedStreamPropertiesObjectState.guid.str:
					this.validateAllocationSize(payloadSize, "Extended Stream Properties Object");
					await this.tokenizer.readToken(new ExtendedStreamPropertiesObjectState(header));
					break;
				case MetadataObjectState.guid.str: {
					this.validateAllocationSize(payloadSize, "Metadata Object");
					const moTags = await this.tokenizer.readToken(new MetadataObjectState(header));
					await this.addTags(moTags);
					break;
				}
				case MetadataLibraryObjectState.guid.str: {
					this.validateAllocationSize(payloadSize, "Metadata Library Object");
					const mlTags = await this.tokenizer.readToken(new MetadataLibraryObjectState(header));
					await this.addTags(mlTags);
					break;
				}
				case AsfGuid.PaddingObject.str:
					await this.ignorePayload(payloadSize, "extension Padding Object");
					break;
				case AsfGuid.CompatibilityObject.str:
					await this.ignorePayload(payloadSize, "Compatibility Object");
					break;
				case AsfGuid.ASF_Index_Placeholder_Object.str:
					await this.ignorePayload(payloadSize, "Index Placeholder Object");
					break;
				default:
					this.metadata.addWarning(`Ignore ASF-Object-GUID: ${header.objectId.str}`);
					await this.ignorePayload(payloadSize, `extension object ${header.objectId.str}`);
			}
			extensionSize -= header.objectSize;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffToken.js
/**
* DSDIFF chunk header
* The data-size encoding is deviating from EA-IFF 85
* Ref: http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
*/
var ChunkHeader64 = {
	len: 12,
	get: (buf, off) => {
		return {
			chunkID: FourCcToken.get(buf, off),
			chunkSize: INT64_BE.get(buf, off + 4)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffParser.js
var DsdiffParser_exports = /* @__PURE__ */ __exportAll({
	DsdiffContentParseError: () => DsdiffContentParseError,
	DsdiffParser: () => DsdiffParser
});
var debug$23 = (0, import_src.default)("music-metadata:parser:aiff");
var DsdiffContentParseError = class extends makeUnexpectedFileContentError("DSDIFF") {};
/**
* DSDIFF - Direct Stream Digital Interchange File Format (Phillips)
*
* Ref:
* - http://www.sonicstudio.com/pdf/dsd/DSDIFF_1.5_Spec.pdf
*/
var DsdiffParser = class extends BasicParser {
	async parse() {
		const header = await this.tokenizer.readToken(ChunkHeader64);
		if (header.chunkID !== "FRM8") throw new DsdiffContentParseError("Unexpected chunk-ID");
		this.metadata.setAudioOnly();
		const type = (await this.tokenizer.readToken(FourCcToken)).trim();
		switch (type) {
			case "DSD":
				this.metadata.setFormat("container", `DSDIFF/${type}`);
				this.metadata.setFormat("lossless", true);
				return this.readFmt8Chunks(header.chunkSize - BigInt(FourCcToken.len));
			default: throw new DsdiffContentParseError(`Unsupported DSDIFF type: ${type}`);
		}
	}
	async readFmt8Chunks(remainingSize) {
		while (remainingSize >= ChunkHeader64.len) {
			const chunkHeader = await this.tokenizer.readToken(ChunkHeader64);
			debug$23(`Chunk id=${chunkHeader.chunkID}`);
			await this.readData(chunkHeader);
			remainingSize -= BigInt(ChunkHeader64.len) + chunkHeader.chunkSize;
		}
	}
	async readData(header) {
		debug$23(`Reading data of chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
		const p0 = this.tokenizer.position;
		switch (header.chunkID.trim()) {
			case "FVER":
				debug$23(`DSDIFF version=${await this.tokenizer.readToken(UINT32_LE)}`);
				break;
			case "PROP":
				if (await this.tokenizer.readToken(FourCcToken) !== "SND ") throw new DsdiffContentParseError("Unexpected PROP-chunk ID");
				await this.handleSoundPropertyChunks(header.chunkSize - BigInt(FourCcToken.len));
				break;
			case "ID3": {
				const id3_data = await this.tokenizer.readToken(new Uint8ArrayType(Number(header.chunkSize)));
				const rst = fromBuffer(id3_data);
				await new ID3v2Parser().parse(this.metadata, rst, this.options);
				break;
			}
			case "DSD":
				if (this.metadata.format.numberOfChannels) this.metadata.setFormat("numberOfSamples", Number(header.chunkSize * BigInt(8) / BigInt(this.metadata.format.numberOfChannels)));
				if (this.metadata.format.numberOfSamples && this.metadata.format.sampleRate) this.metadata.setFormat("duration", this.metadata.format.numberOfSamples / this.metadata.format.sampleRate);
				break;
			default: debug$23(`Ignore chunk[ID=${header.chunkID}, size=${header.chunkSize}]`);
		}
		const remaining = header.chunkSize - BigInt(this.tokenizer.position - p0);
		if (remaining > 0) {
			debug$23(`After Parsing chunk, remaining ${remaining} bytes`);
			await this.tokenizer.ignore(Number(remaining));
		}
	}
	async handleSoundPropertyChunks(remainingSize) {
		debug$23(`Parsing sound-property-chunks, remainingSize=${remainingSize}`);
		while (remainingSize > 0) {
			const sndPropHeader = await this.tokenizer.readToken(ChunkHeader64);
			debug$23(`Sound-property-chunk[ID=${sndPropHeader.chunkID}, size=${sndPropHeader.chunkSize}]`);
			const p0 = this.tokenizer.position;
			switch (sndPropHeader.chunkID.trim()) {
				case "FS": {
					const sampleRate = await this.tokenizer.readToken(UINT32_BE);
					this.metadata.setFormat("sampleRate", sampleRate);
					break;
				}
				case "CHNL": {
					const numChannels = await this.tokenizer.readToken(UINT16_BE);
					this.metadata.setFormat("numberOfChannels", numChannels);
					await this.handleChannelChunks(sndPropHeader.chunkSize - BigInt(UINT16_BE.len));
					break;
				}
				case "CMPR": {
					const compressionIdCode = (await this.tokenizer.readToken(FourCcToken)).trim();
					const count = await this.tokenizer.readToken(UINT8);
					const compressionName = await this.tokenizer.readToken(new StringType(count, "ascii"));
					if (compressionIdCode === "DSD") {
						this.metadata.setFormat("lossless", true);
						this.metadata.setFormat("bitsPerSample", 1);
					}
					this.metadata.setFormat("codec", `${compressionIdCode} (${compressionName})`);
					break;
				}
				case "ABSS":
					debug$23(`ABSS ${await this.tokenizer.readToken(UINT16_BE)}:${await this.tokenizer.readToken(UINT8)}:${await this.tokenizer.readToken(UINT8)}.${await this.tokenizer.readToken(UINT32_BE)}`);
					break;
				case "LSCO":
					debug$23(`LSCO lsConfig=${await this.tokenizer.readToken(UINT16_BE)}`);
					break;
				default:
					debug$23(`Unknown sound-property-chunk[ID=${sndPropHeader.chunkID}, size=${sndPropHeader.chunkSize}]`);
					await this.tokenizer.ignore(Number(sndPropHeader.chunkSize));
			}
			const remaining = sndPropHeader.chunkSize - BigInt(this.tokenizer.position - p0);
			if (remaining > 0) {
				debug$23(`After Parsing sound-property-chunk ${sndPropHeader.chunkSize}, remaining ${remaining} bytes`);
				await this.tokenizer.ignore(Number(remaining));
			}
			remainingSize -= BigInt(ChunkHeader64.len) + sndPropHeader.chunkSize;
			debug$23(`Parsing sound-property-chunks, remainingSize=${remainingSize}`);
		}
		if (this.metadata.format.lossless && this.metadata.format.sampleRate && this.metadata.format.numberOfChannels && this.metadata.format.bitsPerSample) {
			const bitrate = this.metadata.format.sampleRate * this.metadata.format.numberOfChannels * this.metadata.format.bitsPerSample;
			this.metadata.setFormat("bitrate", bitrate);
		}
	}
	async handleChannelChunks(remainingSize) {
		debug$23(`Parsing channel-chunks, remainingSize=${remainingSize}`);
		const channels = [];
		while (remainingSize >= FourCcToken.len) {
			const channelId = await this.tokenizer.readToken(FourCcToken);
			debug$23(`Channel[ID=${channelId}]`);
			channels.push(channelId);
			remainingSize -= BigInt(FourCcToken.len);
		}
		debug$23(`Channels: ${channels.join(", ")}`);
		return channels;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/AbstractID3Parser.js
var debug$22 = (0, import_src.default)("music-metadata:parser:ID3");
/**
* Abstract parser which tries take ID3v2 and ID3v1 headers.
*/
var AbstractID3Parser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.id3parser = new ID3v2Parser();
	}
	static async startsWithID3v2Header(tokenizer) {
		return (await tokenizer.peekToken(ID3v2Header)).fileIdentifier === "ID3";
	}
	async parse() {
		try {
			await this.parseID3v2();
		} catch (err) {
			if (err instanceof EndOfStreamError) debug$22("End-of-stream");
			else throw err;
		}
	}
	finalize() {}
	async parseID3v2() {
		await this.tryReadId3v2Headers();
		debug$22("End of ID3v2 header, go to MPEG-parser: pos=%s", this.tokenizer.position);
		await this.postId3v2Parse();
		if (this.options.skipPostHeaders && this.metadata.hasAny()) this.finalize();
		else {
			await new ID3v1Parser(this.metadata, this.tokenizer, this.options).parse();
			this.finalize();
		}
	}
	async tryReadId3v2Headers() {
		if ((await this.tokenizer.peekToken(ID3v2Header)).fileIdentifier === "ID3") {
			debug$22("Found ID3v2 header, pos=%s", this.tokenizer.position);
			await this.id3parser.parse(this.metadata, this.tokenizer, this.options);
			return this.tryReadId3v2Headers();
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfChunk.js
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var ChunkHeader = {
	len: 12,
	get: (buf, off) => {
		return {
			id: FourCcToken.get(buf, off),
			size: UINT64_LE.get(buf, off + 4)
		};
	}
};
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var DsdChunk = {
	len: 16,
	get: (buf, off) => {
		return {
			fileSize: UINT64_LE.get(buf, off),
			metadataPointer: UINT64_LE.get(buf, off + 8)
		};
	}
};
/**
* Common chunk DSD header: the 'chunk name (Four-CC)' & chunk size
*/
var FormatChunk = {
	len: 40,
	get: (buf, off) => {
		return {
			formatVersion: INT32_LE.get(buf, off),
			formatID: INT32_LE.get(buf, off + 4),
			channelType: INT32_LE.get(buf, off + 8),
			channelNum: INT32_LE.get(buf, off + 12),
			samplingFrequency: INT32_LE.get(buf, off + 16),
			bitsPerSample: INT32_LE.get(buf, off + 20),
			sampleCount: INT64_LE.get(buf, off + 24),
			blockSizePerChannel: INT32_LE.get(buf, off + 32)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfParser.js
var DsfParser_exports = /* @__PURE__ */ __exportAll({
	DsdContentParseError: () => DsdContentParseError,
	DsfParser: () => DsfParser
});
var debug$21 = (0, import_src.default)("music-metadata:parser:DSF");
var DsdContentParseError = class extends makeUnexpectedFileContentError("DSD") {};
/**
* DSF (dsd stream file) File Parser
* Ref: https://dsd-guide.com/sites/default/files/white-papers/DSFFileFormatSpec_E.pdf
*/
var DsfParser = class extends AbstractID3Parser {
	async postId3v2Parse() {
		const p0 = this.tokenizer.position;
		const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
		if (chunkHeader.id !== "DSD ") throw new DsdContentParseError("Invalid chunk signature");
		if (chunkHeader.size !== BigInt(ChunkHeader.len + DsdChunk.len)) throw new DsdContentParseError(`Invalid DSD chunk size: ${chunkHeader.size}`);
		this.metadata.setFormat("container", "DSF");
		this.metadata.setFormat("lossless", true);
		this.metadata.setAudioOnly();
		const dsdChunk = await this.tokenizer.readToken(DsdChunk);
		if (dsdChunk.fileSize < chunkHeader.size) throw new DsdContentParseError(`Invalid DSF file size: ${dsdChunk.fileSize}`);
		await this.parseChunks(dsdChunk.fileSize - chunkHeader.size);
		if (dsdChunk.metadataPointer === 0n) {
			debug$21("No ID3v2 tag present");
			return;
		}
		debug$21(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
		const metadataOffset = dsdChunk.metadataPointer - BigInt(this.tokenizer.position - p0);
		if (metadataOffset < 0n || metadataOffset > BigInt(Number.MAX_SAFE_INTEGER) || dsdChunk.metadataPointer + BigInt(ID3v2Header.len) > dsdChunk.fileSize) throw new DsdContentParseError(`Invalid metadata pointer: ${dsdChunk.metadataPointer}`);
		await this.tokenizer.ignore(Number(metadataOffset));
		return new ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
	}
	async parseChunks(bytesRemaining) {
		const chunkHeaderSize = BigInt(ChunkHeader.len);
		while (bytesRemaining >= chunkHeaderSize) {
			const chunkHeader = await this.tokenizer.readToken(ChunkHeader);
			debug$21(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
			if (chunkHeader.size < chunkHeaderSize) throw new DsdContentParseError(`Invalid ${chunkHeader.id} chunk size: ${chunkHeader.size}`);
			if (chunkHeader.size > bytesRemaining) throw new DsdContentParseError(`${chunkHeader.id} chunk exceeds remaining file size`);
			const payloadSize = chunkHeader.size - chunkHeaderSize;
			switch (chunkHeader.id) {
				case "fmt ": {
					if (payloadSize < BigInt(FormatChunk.len)) throw new DsdContentParseError(`Invalid fmt chunk size: ${chunkHeader.size}`);
					const formatChunk = await this.tokenizer.readToken(FormatChunk);
					this.metadata.setFormat("numberOfChannels", formatChunk.channelNum);
					this.metadata.setFormat("sampleRate", formatChunk.samplingFrequency);
					this.metadata.setFormat("bitsPerSample", formatChunk.bitsPerSample);
					this.metadata.setFormat("numberOfSamples", formatChunk.sampleCount);
					this.metadata.setFormat("duration", Number(formatChunk.sampleCount) / formatChunk.samplingFrequency);
					const bitrate = formatChunk.bitsPerSample * formatChunk.samplingFrequency * formatChunk.channelNum;
					this.metadata.setFormat("bitrate", bitrate);
					return;
				}
				default: await this.tokenizer.ignore(Number(payloadSize));
			}
			bytesRemaining -= chunkHeader.size;
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/Vorbis.js
/**
* Parse the METADATA_BLOCK_PICTURE
* Ref: https://wiki.xiph.org/VorbisComment#METADATA_BLOCK_PICTURE
* Ref: https://xiph.org/flac/format.html#metadata_block_picture
* // ToDo: move to ID3 / APIC?
*/
var VorbisPictureToken = class VorbisPictureToken {
	static fromBase64(base64str) {
		return VorbisPictureToken.fromBuffer(Uint8Array.from(atob(base64str), (c) => c.charCodeAt(0)));
	}
	static fromBuffer(buffer) {
		return new VorbisPictureToken(buffer.length).get(buffer, 0);
	}
	constructor(len) {
		this.len = len;
	}
	get(buffer, offset) {
		const type = AttachedPictureType[UINT32_BE.get(buffer, offset)];
		offset += 4;
		const mimeLen = UINT32_BE.get(buffer, offset);
		offset += 4;
		const format = new StringType(mimeLen, "utf-8").get(buffer, offset);
		offset += mimeLen;
		const descLen = UINT32_BE.get(buffer, offset);
		offset += 4;
		const description = new StringType(descLen, "utf-8").get(buffer, offset);
		offset += descLen;
		const width = UINT32_BE.get(buffer, offset);
		offset += 4;
		const height = UINT32_BE.get(buffer, offset);
		offset += 4;
		const colour_depth = UINT32_BE.get(buffer, offset);
		offset += 4;
		const indexed_color = UINT32_BE.get(buffer, offset);
		offset += 4;
		const picDataLen = UINT32_BE.get(buffer, offset);
		offset += 4;
		return {
			type,
			format,
			description,
			width,
			height,
			colour_depth,
			indexed_color,
			data: buffer.slice(offset, offset + picDataLen)
		};
	}
};
/**
* Comment header decoder
* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-620004.2.1
*/
var CommonHeader = {
	len: 7,
	get: (buf, off) => {
		return {
			packetType: UINT8.get(buf, off),
			vorbis: new StringType(6, "ascii").get(buf, off + 1)
		};
	}
};
/**
* Identification header decoder
* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-630004.2.2
*/
var IdentificationHeader$1 = {
	len: 23,
	get: (uint8Array, off) => {
		return {
			version: UINT32_LE.get(uint8Array, off + 0),
			channelMode: UINT8.get(uint8Array, off + 4),
			sampleRate: UINT32_LE.get(uint8Array, off + 5),
			bitrateMax: UINT32_LE.get(uint8Array, off + 9),
			bitrateNominal: UINT32_LE.get(uint8Array, off + 13),
			bitrateMin: UINT32_LE.get(uint8Array, off + 17)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisDecoder.js
var VorbisDecoder = class {
	constructor(data, offset) {
		this.data = data;
		this.offset = offset;
	}
	readInt32() {
		const value = UINT32_LE.get(this.data, this.offset);
		this.offset += 4;
		return value;
	}
	readStringUtf8() {
		const len = this.readInt32();
		const value = textDecode(this.data.subarray(this.offset, this.offset + len), "utf-8");
		this.offset += len;
		return value;
	}
	parseUserComment() {
		const offset0 = this.offset;
		const v = this.readStringUtf8();
		const idx = v.indexOf("=");
		return {
			key: v.substring(0, idx).toUpperCase(),
			value: v.substring(idx + 1),
			len: this.offset - offset0
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisStream.js
var debug$20 = (0, import_src.default)("music-metadata:parser:ogg:vorbis1");
var VorbisContentError = class extends makeUnexpectedFileContentError("Vorbis") {};
/**
* Vorbis 1 Parser.
* Used by OggStream
*/
var VorbisStream = class VorbisStream {
	constructor(metadata, options) {
		this.pageSegments = [];
		this.durationOnLastPage = true;
		this.metadata = metadata;
		this.options = options;
	}
	/**
	* Vorbis 1 parser
	* @param header Ogg Page Header
	* @param pageData Page data
	*/
	async parsePage(header, pageData) {
		this.lastPageHeader = header;
		if (header.headerType.firstPage) this.parseFirstPage(header, pageData);
		else {
			if (header.headerType.continued) {
				if (this.pageSegments.length === 0) throw new VorbisContentError("Cannot continue on previous page");
				this.pageSegments.push(pageData);
			}
			if (header.headerType.lastPage || !header.headerType.continued) {
				if (this.pageSegments.length > 0) {
					const fullPage = VorbisStream.mergeUint8Arrays(this.pageSegments);
					await this.parseFullPage(fullPage);
				}
				this.pageSegments = header.headerType.lastPage ? [] : [pageData];
			}
		}
	}
	static mergeUint8Arrays(arrays) {
		const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
		const merged = new Uint8Array(totalSize);
		arrays.forEach((array, i, _arrays) => {
			const offset = _arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0);
			merged.set(array, offset);
		});
		return merged;
	}
	async flush() {
		await this.parseFullPage(VorbisStream.mergeUint8Arrays(this.pageSegments));
	}
	async parseUserComment(pageData, offset) {
		const tag = new VorbisDecoder(pageData, offset).parseUserComment();
		await this.addTag(tag.key, tag.value);
		return tag.len;
	}
	async addTag(id, value) {
		if (id === "METADATA_BLOCK_PICTURE" && typeof value === "string") {
			if (this.options.skipCovers) {
				debug$20("Ignore picture");
				return;
			}
			value = VorbisPictureToken.fromBase64(value);
			debug$20(`Push picture: id=${id}, format=${value.format}`);
		} else debug$20(`Push tag: id=${id}, value=${value}`);
		await this.metadata.addTag("vorbis", id, value);
	}
	calculateDuration(enfOfStream) {
		if (this.lastPageHeader && (enfOfStream || this.lastPageHeader.headerType.lastPage) && this.metadata.format.sampleRate && this.lastPageHeader.absoluteGranulePosition >= 0) {
			this.metadata.setFormat("numberOfSamples", this.lastPageHeader.absoluteGranulePosition);
			this.metadata.setFormat("duration", this.lastPageHeader.absoluteGranulePosition / this.metadata.format.sampleRate);
		}
	}
	/**
	* Parse first Ogg/Vorbis page
	* @param _header
	* @param pageData
	*/
	parseFirstPage(_header, pageData) {
		this.metadata.setFormat("codec", "Vorbis I");
		this.metadata.setFormat("hasAudio", true);
		debug$20("Parse first page");
		const commonHeader = CommonHeader.get(pageData, 0);
		if (commonHeader.vorbis !== "vorbis") throw new VorbisContentError("Metadata does not look like Vorbis");
		if (commonHeader.packetType === 1) {
			const idHeader = IdentificationHeader$1.get(pageData, CommonHeader.len);
			this.metadata.setFormat("sampleRate", idHeader.sampleRate);
			this.metadata.setFormat("bitrate", idHeader.bitrateNominal);
			this.metadata.setFormat("numberOfChannels", idHeader.channelMode);
			debug$20("sample-rate=%s[hz], bitrate=%s[b/s], channel-mode=%s", idHeader.sampleRate, idHeader.bitrateNominal, idHeader.channelMode);
		} else throw new VorbisContentError("First Ogg page should be type 1: the identification header");
	}
	async parseFullPage(pageData) {
		const commonHeader = CommonHeader.get(pageData, 0);
		debug$20("Parse full page: type=%s, byteLength=%s", commonHeader.packetType, pageData.byteLength);
		switch (commonHeader.packetType) {
			case 3: return this.parseUserCommentList(pageData, CommonHeader.len);
		}
	}
	/**
	* Ref: https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-840005.2
	*/
	async parseUserCommentList(pageData, offset) {
		const strLen = UINT32_LE.get(pageData, offset);
		offset += 4;
		offset += strLen;
		let userCommentListLength = UINT32_LE.get(pageData, offset);
		offset += 4;
		while (userCommentListLength-- > 0) offset += await this.parseUserComment(pageData, offset);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacToken.js
/**
* FLAC supports up to 128 kinds of metadata blocks; currently the following are defined:
* ref: https://xiph.org/flac/format.html#metadata_block
*/
var BlockType = {
	STREAMINFO: 0,
	PADDING: 1,
	APPLICATION: 2,
	SEEKTABLE: 3,
	VORBIS_COMMENT: 4,
	CUESHEET: 5,
	PICTURE: 6
};
var BlockHeader = {
	len: 4,
	get: (buf, off) => {
		return {
			lastBlock: getBit(buf, off, 7),
			type: getBitAllignedNumber$1(buf, off, 1, 7),
			length: UINT24_BE.get(buf, off + 1)
		};
	}
};
/**
* METADATA_BLOCK_DATA
* Ref: https://xiph.org/flac/format.html#metadata_block_streaminfo
*/
var BlockStreamInfo = {
	len: 34,
	get: (buf, off) => {
		return {
			minimumBlockSize: UINT16_BE.get(buf, off),
			maximumBlockSize: UINT16_BE.get(buf, off + 2) / 1e3,
			minimumFrameSize: UINT24_BE.get(buf, off + 4),
			maximumFrameSize: UINT24_BE.get(buf, off + 7),
			sampleRate: UINT24_BE.get(buf, off + 10) >> 4,
			channels: getBitAllignedNumber$1(buf, off + 12, 4, 3) + 1,
			bitsPerSample: getBitAllignedNumber$1(buf, off + 12, 7, 5) + 1,
			totalSamples: getBitAllignedNumber$1(buf, off + 13, 4, 36),
			fileMD5: new Uint8ArrayType(16).get(buf, off + 18)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacParser.js
var FlacParser_exports = /* @__PURE__ */ __exportAll({ FlacParser: () => FlacParser });
var debug$19 = (0, import_src.default)("music-metadata:parser:FLAC");
var FlacContentError = class extends makeUnexpectedFileContentError("FLAC") {};
var FlacParser = class extends AbstractID3Parser {
	constructor() {
		super(...arguments);
		this.vorbisParser = new VorbisStream(this.metadata, this.options);
	}
	async postId3v2Parse() {
		if ((await this.tokenizer.readToken(FourCcToken)).toString() !== "fLaC") throw new FlacContentError("Invalid FLAC preamble");
		let blockHeader;
		do {
			blockHeader = await this.tokenizer.readToken(BlockHeader);
			await this.parseDataBlock(blockHeader);
		} while (!blockHeader.lastBlock);
		if (this.tokenizer.fileInfo.size && this.metadata.format.duration) {
			const dataSize = this.tokenizer.fileInfo.size - this.tokenizer.position;
			this.metadata.setFormat("bitrate", 8 * dataSize / this.metadata.format.duration);
		}
	}
	async parseDataBlock(blockHeader) {
		debug$19(`blockHeader type=${blockHeader.type}, length=${blockHeader.length}`);
		switch (blockHeader.type) {
			case BlockType.STREAMINFO: return this.readBlockStreamInfo(blockHeader.length);
			case BlockType.PADDING: break;
			case BlockType.APPLICATION: break;
			case BlockType.SEEKTABLE: break;
			case BlockType.VORBIS_COMMENT: return this.readComment(blockHeader.length);
			case BlockType.CUESHEET: break;
			case BlockType.PICTURE:
				await this.parsePicture(blockHeader.length);
				return;
			default: this.metadata.addWarning(`Unknown block type: ${blockHeader.type}`);
		}
		return this.tokenizer.ignore(blockHeader.length).then();
	}
	/**
	* Parse STREAMINFO
	*/
	async readBlockStreamInfo(dataLen) {
		if (dataLen !== BlockStreamInfo.len) throw new FlacContentError("Unexpected block-stream-info length");
		const streamInfo = await this.tokenizer.readToken(BlockStreamInfo);
		this.metadata.setFormat("container", "FLAC");
		this.processsStreamInfo(streamInfo);
	}
	/**
	* Parse STREAMINFO
	*/
	processsStreamInfo(streamInfo) {
		this.metadata.setFormat("codec", "FLAC");
		this.metadata.setFormat("hasAudio", true);
		this.metadata.setFormat("lossless", true);
		this.metadata.setFormat("numberOfChannels", streamInfo.channels);
		this.metadata.setFormat("bitsPerSample", streamInfo.bitsPerSample);
		this.metadata.setFormat("sampleRate", streamInfo.sampleRate);
		if (streamInfo.totalSamples > 0) this.metadata.setFormat("duration", streamInfo.totalSamples / streamInfo.sampleRate);
	}
	/**
	* Read VORBIS_COMMENT from tokenizer
	* Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
	*/
	async readComment(dataLen) {
		const data = await this.tokenizer.readToken(new Uint8ArrayType(dataLen));
		return this.parseComment(data);
	}
	/**
	* Parse VORBIS_COMMENT
	* Ref: https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-640004.2.3
	*/
	async parseComment(data) {
		const decoder = new VorbisDecoder(data, 0);
		const vendor = decoder.readStringUtf8();
		if (vendor.length > 0) this.metadata.setFormat("tool", vendor);
		const commentListLength = decoder.readInt32();
		const tags = new Array(commentListLength);
		for (let i = 0; i < commentListLength; i++) tags[i] = decoder.parseUserComment();
		await Promise.all(tags.map((tag) => {
			if (tag.key === "ENCODER") this.metadata.setFormat("tool", tag.value);
			return this.addTag(tag.key, tag.value);
		}));
	}
	async parsePicture(dataLen) {
		if (this.options.skipCovers) return this.tokenizer.ignore(dataLen);
		return this.addPictureTag(await this.tokenizer.readToken(new VorbisPictureToken(dataLen)));
	}
	addPictureTag(picture) {
		return this.addTag("METADATA_BLOCK_PICTURE", picture);
	}
	addTag(id, value) {
		return this.vorbisParser.addTag(id, value);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/GenericTagTypes.js
var import_dist = /* @__PURE__ */ __toESM(require_dist(), 1);
var defaultTagInfo = { multiple: false };
var commonTags = {
	year: defaultTagInfo,
	track: defaultTagInfo,
	disk: defaultTagInfo,
	title: defaultTagInfo,
	artist: defaultTagInfo,
	artists: {
		multiple: true,
		unique: true
	},
	albumartist: defaultTagInfo,
	albumartists: {
		multiple: true,
		unique: true
	},
	album: defaultTagInfo,
	date: defaultTagInfo,
	originaldate: defaultTagInfo,
	originalyear: defaultTagInfo,
	releasedate: defaultTagInfo,
	comment: {
		multiple: true,
		unique: false
	},
	genre: {
		multiple: true,
		unique: true
	},
	picture: {
		multiple: true,
		unique: true
	},
	composer: {
		multiple: true,
		unique: true
	},
	lyrics: {
		multiple: true,
		unique: false
	},
	albumsort: {
		multiple: false,
		unique: true
	},
	titlesort: {
		multiple: false,
		unique: true
	},
	work: {
		multiple: false,
		unique: true
	},
	artistsort: {
		multiple: false,
		unique: true
	},
	albumartistsort: {
		multiple: false,
		unique: true
	},
	composersort: {
		multiple: false,
		unique: true
	},
	lyricist: {
		multiple: true,
		unique: true
	},
	writer: {
		multiple: true,
		unique: true
	},
	conductor: {
		multiple: true,
		unique: true
	},
	remixer: {
		multiple: true,
		unique: true
	},
	arranger: {
		multiple: true,
		unique: true
	},
	engineer: {
		multiple: true,
		unique: true
	},
	producer: {
		multiple: true,
		unique: true
	},
	technician: {
		multiple: true,
		unique: true
	},
	djmixer: {
		multiple: true,
		unique: true
	},
	mixer: {
		multiple: true,
		unique: true
	},
	label: {
		multiple: true,
		unique: true
	},
	grouping: defaultTagInfo,
	subtitle: { multiple: true },
	discsubtitle: defaultTagInfo,
	totaltracks: defaultTagInfo,
	totaldiscs: defaultTagInfo,
	compilation: defaultTagInfo,
	rating: { multiple: true },
	bpm: defaultTagInfo,
	mood: defaultTagInfo,
	media: defaultTagInfo,
	catalognumber: {
		multiple: true,
		unique: true
	},
	tvShow: defaultTagInfo,
	tvShowSort: defaultTagInfo,
	tvSeason: defaultTagInfo,
	tvEpisode: defaultTagInfo,
	tvEpisodeId: defaultTagInfo,
	tvNetwork: defaultTagInfo,
	podcast: defaultTagInfo,
	podcasturl: defaultTagInfo,
	releasestatus: defaultTagInfo,
	releasetype: { multiple: true },
	releasecountry: defaultTagInfo,
	script: defaultTagInfo,
	language: defaultTagInfo,
	copyright: defaultTagInfo,
	license: defaultTagInfo,
	encodedby: defaultTagInfo,
	encodersettings: defaultTagInfo,
	gapless: defaultTagInfo,
	barcode: defaultTagInfo,
	isrc: { multiple: true },
	asin: defaultTagInfo,
	musicbrainz_recordingid: defaultTagInfo,
	musicbrainz_trackid: defaultTagInfo,
	musicbrainz_albumid: defaultTagInfo,
	musicbrainz_artistid: { multiple: true },
	musicbrainz_albumartistid: { multiple: true },
	musicbrainz_releasegroupid: defaultTagInfo,
	musicbrainz_workid: defaultTagInfo,
	musicbrainz_trmid: defaultTagInfo,
	musicbrainz_discid: defaultTagInfo,
	acoustid_id: defaultTagInfo,
	acoustid_fingerprint: defaultTagInfo,
	musicip_puid: defaultTagInfo,
	musicip_fingerprint: defaultTagInfo,
	website: defaultTagInfo,
	"performer:instrument": {
		multiple: true,
		unique: true
	},
	averageLevel: defaultTagInfo,
	peakLevel: defaultTagInfo,
	notes: {
		multiple: true,
		unique: false
	},
	key: defaultTagInfo,
	originalalbum: defaultTagInfo,
	originalartist: defaultTagInfo,
	discogs_artist_id: {
		multiple: true,
		unique: true
	},
	discogs_release_id: defaultTagInfo,
	discogs_label_id: defaultTagInfo,
	discogs_master_release_id: defaultTagInfo,
	discogs_votes: defaultTagInfo,
	discogs_rating: defaultTagInfo,
	replaygain_track_peak: defaultTagInfo,
	replaygain_track_gain: defaultTagInfo,
	replaygain_album_peak: defaultTagInfo,
	replaygain_album_gain: defaultTagInfo,
	replaygain_track_minmax: defaultTagInfo,
	replaygain_album_minmax: defaultTagInfo,
	replaygain_undo: defaultTagInfo,
	description: { multiple: true },
	longDescription: defaultTagInfo,
	category: { multiple: true },
	hdVideo: defaultTagInfo,
	keywords: { multiple: true },
	movement: defaultTagInfo,
	movementIndex: defaultTagInfo,
	movementTotal: defaultTagInfo,
	podcastId: defaultTagInfo,
	showMovement: defaultTagInfo,
	stik: defaultTagInfo,
	playCounter: defaultTagInfo
};
/**
* @param alias Name of common tag
* @returns {boolean|*} true if given alias is mapped as a singleton', otherwise false
*/
function isSingleton(alias) {
	return commonTags[alias] && !commonTags[alias].multiple;
}
/**
* @param alias Common (generic) tag
* @returns {boolean|*} true if given alias is a singleton or explicitly marked as unique
*/
function isUnique(alias) {
	return !commonTags[alias].multiple || commonTags[alias].unique || false;
}
//#endregion
//#region node_modules/music-metadata/lib/common/GenericTagMapper.js
var CommonTagMapper = class {
	static toIntOrNull(str) {
		const cleaned = Number.parseInt(str, 10);
		return Number.isNaN(cleaned) ? null : cleaned;
	}
	static normalizeTrack(origVal) {
		const split = origVal.toString().split("/");
		return {
			no: Number.parseInt(split[0], 10) || null,
			of: Number.parseInt(split[1], 10) || null
		};
	}
	constructor(tagTypes, tagMap) {
		this.tagTypes = tagTypes;
		this.tagMap = tagMap;
	}
	/**
	* Process and set common tags
	* write common tags to
	* @param tag Native tag
	* @param warnings Register warnings
	* @return common name
	*/
	mapGenericTag(tag, warnings) {
		tag = {
			id: tag.id,
			value: tag.value
		};
		this.postMap(tag, warnings);
		const id = this.getCommonName(tag.id);
		return id ? {
			id,
			value: tag.value
		} : null;
	}
	/**
	* Convert native tag key to common tag key
	* @param tag Native header tag
	* @return common tag name (alias)
	*/
	getCommonName(tag) {
		return this.tagMap[tag];
	}
	/**
	* Handle post mapping exceptions / correction
	* @param tag Tag e.g. {"©alb", "Buena Vista Social Club")
	* @param warnings Used to register warnings
	*/
	postMap(_tag, _warnings) {}
};
CommonTagMapper.maxRatingScore = 1;
//#endregion
//#region node_modules/music-metadata/lib/id3v1/ID3v1TagMap.js
/**
* ID3v1 tag mappings
*/
var id3v1TagMap = {
	title: "title",
	artist: "artist",
	album: "album",
	year: "year",
	comment: "comment",
	track: "track",
	genre: "genre"
};
var ID3v1TagMapper = class extends CommonTagMapper {
	constructor() {
		super(["ID3v1"], id3v1TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/CaseInsensitiveTagMap.js
var CaseInsensitiveTagMap = class extends CommonTagMapper {
	constructor(tagTypes, tagMap) {
		const upperCaseMap = {};
		for (const tag of Object.keys(tagMap)) upperCaseMap[tag.toUpperCase()] = tagMap[tag];
		super(tagTypes, upperCaseMap);
	}
	/**
	* @tag  Native header tag
	* @return common tag name (alias)
	*/
	getCommonName(tag) {
		return this.tagMap[tag.toUpperCase()];
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v24TagMapper.js
/**
* ID3v2.3/ID3v2.4 tag mappings
*/
var id3v24TagMap = {
	TIT2: "title",
	TPE1: "artist",
	"TXXX:Artists": "artists",
	TPE2: "albumartist",
	TALB: "album",
	TDRV: "date",
	/**
	* Original release year
	*/
	TORY: "originalyear",
	TPOS: "disk",
	TCON: "genre",
	APIC: "picture",
	TCOM: "composer",
	USLT: "lyrics",
	TSOA: "albumsort",
	TSOT: "titlesort",
	TOAL: "originalalbum",
	TSOP: "artistsort",
	TSO2: "albumartistsort",
	TSOC: "composersort",
	TEXT: "lyricist",
	"TXXX:Writer": "writer",
	TPE3: "conductor",
	TPE4: "remixer",
	"IPLS:arranger": "arranger",
	"IPLS:engineer": "engineer",
	"IPLS:producer": "producer",
	"IPLS:DJ-mix": "djmixer",
	"IPLS:mix": "mixer",
	TPUB: "label",
	TIT1: "grouping",
	TIT3: "subtitle",
	TRCK: "track",
	TCMP: "compilation",
	POPM: "rating",
	TBPM: "bpm",
	TMED: "media",
	"TXXX:CATALOGNUMBER": "catalognumber",
	"TXXX:MusicBrainz Album Status": "releasestatus",
	"TXXX:MusicBrainz Album Type": "releasetype",
	/**
	* Release country as documented: https://picard.musicbrainz.org/docs/mappings/#cite_note-0
	*/
	"TXXX:MusicBrainz Album Release Country": "releasecountry",
	/**
	* Release country as implemented // ToDo: report
	*/
	"TXXX:RELEASECOUNTRY": "releasecountry",
	"TXXX:SCRIPT": "script",
	TLAN: "language",
	TCOP: "copyright",
	WCOP: "license",
	TENC: "encodedby",
	TSSE: "encodersettings",
	"TXXX:BARCODE": "barcode",
	"TXXX:ISRC": "isrc",
	TSRC: "isrc",
	"TXXX:ASIN": "asin",
	"TXXX:originalyear": "originalyear",
	"UFID:http://musicbrainz.org": "musicbrainz_recordingid",
	"TXXX:MusicBrainz Release Track Id": "musicbrainz_trackid",
	"TXXX:MusicBrainz Album Id": "musicbrainz_albumid",
	"TXXX:MusicBrainz Artist Id": "musicbrainz_artistid",
	"TXXX:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
	"TXXX:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
	"TXXX:MusicBrainz Work Id": "musicbrainz_workid",
	"TXXX:MusicBrainz TRM Id": "musicbrainz_trmid",
	"TXXX:MusicBrainz Disc Id": "musicbrainz_discid",
	"TXXX:ACOUSTID_ID": "acoustid_id",
	"TXXX:Acoustid Id": "acoustid_id",
	"TXXX:Acoustid Fingerprint": "acoustid_fingerprint",
	"TXXX:MusicIP PUID": "musicip_puid",
	"TXXX:MusicMagic Fingerprint": "musicip_fingerprint",
	WOAR: "website",
	TDRC: "date",
	TYER: "year",
	TDOR: "originaldate",
	"TIPL:arranger": "arranger",
	"TIPL:engineer": "engineer",
	"TIPL:producer": "producer",
	"TIPL:DJ-mix": "djmixer",
	"TIPL:mix": "mixer",
	TMOO: "mood",
	SYLT: "lyrics",
	TSST: "discsubtitle",
	TKEY: "key",
	COMM: "comment",
	TOPE: "originalartist",
	"PRIV:AverageLevel": "averageLevel",
	"PRIV:PeakLevel": "peakLevel",
	"TXXX:DISCOGS_ARTIST_ID": "discogs_artist_id",
	"TXXX:DISCOGS_ARTISTS": "artists",
	"TXXX:DISCOGS_ARTIST_NAME": "artists",
	"TXXX:DISCOGS_ALBUM_ARTISTS": "albumartist",
	"TXXX:DISCOGS_CATALOG": "catalognumber",
	"TXXX:DISCOGS_COUNTRY": "releasecountry",
	"TXXX:DISCOGS_DATE": "originaldate",
	"TXXX:DISCOGS_LABEL": "label",
	"TXXX:DISCOGS_LABEL_ID": "discogs_label_id",
	"TXXX:DISCOGS_MASTER_RELEASE_ID": "discogs_master_release_id",
	"TXXX:DISCOGS_RATING": "discogs_rating",
	"TXXX:DISCOGS_RELEASED": "date",
	"TXXX:DISCOGS_RELEASE_ID": "discogs_release_id",
	"TXXX:DISCOGS_VOTES": "discogs_votes",
	"TXXX:CATALOGID": "catalognumber",
	"TXXX:STYLE": "genre",
	"TXXX:REPLAYGAIN_TRACK_PEAK": "replaygain_track_peak",
	"TXXX:REPLAYGAIN_TRACK_GAIN": "replaygain_track_gain",
	"TXXX:REPLAYGAIN_ALBUM_PEAK": "replaygain_album_peak",
	"TXXX:REPLAYGAIN_ALBUM_GAIN": "replaygain_album_gain",
	"TXXX:MP3GAIN_MINMAX": "replaygain_track_minmax",
	"TXXX:MP3GAIN_ALBUM_MINMAX": "replaygain_album_minmax",
	"TXXX:MP3GAIN_UNDO": "replaygain_undo",
	MVNM: "movement",
	MVIN: "movementIndex",
	PCST: "podcast",
	TCAT: "category",
	TDES: "description",
	TDRL: "releasedate",
	TGID: "podcastId",
	TKWD: "keywords",
	WFED: "podcasturl",
	GRP1: "grouping",
	PCNT: "playCounter"
};
var ID3v24TagMapper = class ID3v24TagMapper extends CaseInsensitiveTagMap {
	static toRating(popm) {
		return {
			source: popm.email,
			rating: popm.rating > 0 ? (popm.rating - 1) / 254 * CommonTagMapper.maxRatingScore : void 0
		};
	}
	constructor() {
		super(["ID3v2.3", "ID3v2.4"], id3v24TagMap);
	}
	/**
	* Handle post mapping exceptions / correction
	* @param tag to post map
	* @param warnings Wil be used to register (collect) warnings
	*/
	postMap(tag, warnings) {
		switch (tag.id) {
			case "UFID":
				{
					const idTag = tag.value;
					if (idTag.owner_identifier === "http://musicbrainz.org") {
						tag.id += `:${idTag.owner_identifier}`;
						tag.value = decodeString(idTag.identifier, "latin1");
					}
				}
				break;
			case "PRIV":
				{
					const customTag = tag.value;
					switch (customTag.owner_identifier) {
						case "AverageLevel":
						case "PeakValue":
							tag.id += `:${customTag.owner_identifier}`;
							tag.value = customTag.data.length === 4 ? UINT32_LE.get(customTag.data, 0) : null;
							if (tag.value === null) warnings.addWarning("Failed to parse PRIV:PeakValue");
							break;
						default: warnings.addWarning(`Unknown PRIV owner-identifier: ${customTag.data}`);
					}
				}
				break;
			case "POPM": tag.value = ID3v24TagMapper.toRating(tag.value);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfTagMapper.js
/**
* ASF Metadata tag mappings.
* See http://msdn.microsoft.com/en-us/library/ms867702.aspx
*/
var asfTagMap = {
	Title: "title",
	Author: "artist",
	"WM/AlbumArtist": "albumartist",
	"WM/AlbumTitle": "album",
	"WM/Year": "date",
	"WM/OriginalReleaseTime": "originaldate",
	"WM/OriginalReleaseYear": "originalyear",
	Description: "comment",
	"WM/TrackNumber": "track",
	"WM/PartOfSet": "disk",
	"WM/Genre": "genre",
	"WM/Composer": "composer",
	"WM/Lyrics": "lyrics",
	"WM/AlbumSortOrder": "albumsort",
	"WM/TitleSortOrder": "titlesort",
	"WM/ArtistSortOrder": "artistsort",
	"WM/AlbumArtistSortOrder": "albumartistsort",
	"WM/ComposerSortOrder": "composersort",
	"WM/Writer": "lyricist",
	"WM/Conductor": "conductor",
	"WM/ModifiedBy": "remixer",
	"WM/Engineer": "engineer",
	"WM/Producer": "producer",
	"WM/DJMixer": "djmixer",
	"WM/Mixer": "mixer",
	"WM/Publisher": "label",
	"WM/ContentGroupDescription": "grouping",
	"WM/SubTitle": "subtitle",
	"WM/SetSubTitle": "discsubtitle",
	"WM/IsCompilation": "compilation",
	"WM/SharedUserRating": "rating",
	"WM/BeatsPerMinute": "bpm",
	"WM/Mood": "mood",
	"WM/Media": "media",
	"WM/CatalogNo": "catalognumber",
	"MusicBrainz/Album Status": "releasestatus",
	"MusicBrainz/Album Type": "releasetype",
	"MusicBrainz/Album Release Country": "releasecountry",
	"WM/Script": "script",
	"WM/Language": "language",
	Copyright: "copyright",
	LICENSE: "license",
	"WM/EncodedBy": "encodedby",
	"WM/EncodingSettings": "encodersettings",
	"WM/Barcode": "barcode",
	"WM/ISRC": "isrc",
	"MusicBrainz/Track Id": "musicbrainz_recordingid",
	"MusicBrainz/Release Track Id": "musicbrainz_trackid",
	"MusicBrainz/Album Id": "musicbrainz_albumid",
	"MusicBrainz/Artist Id": "musicbrainz_artistid",
	"MusicBrainz/Album Artist Id": "musicbrainz_albumartistid",
	"MusicBrainz/Release Group Id": "musicbrainz_releasegroupid",
	"MusicBrainz/Work Id": "musicbrainz_workid",
	"MusicBrainz/TRM Id": "musicbrainz_trmid",
	"MusicBrainz/Disc Id": "musicbrainz_discid",
	"Acoustid/Id": "acoustid_id",
	"Acoustid/Fingerprint": "acoustid_fingerprint",
	"MusicIP/PUID": "musicip_puid",
	"WM/ARTISTS": "artists",
	"WM/InitialKey": "key",
	ASIN: "asin",
	"WM/Work": "work",
	"WM/AuthorURL": "website",
	"WM/Picture": "picture"
};
var AsfTagMapper = class AsfTagMapper extends CommonTagMapper {
	static toRating(rating) {
		return { rating: Number.parseFloat(rating + 1) / 5 };
	}
	constructor() {
		super(["asf"], asfTagMap);
	}
	postMap(tag) {
		switch (tag.id) {
			case "WM/SharedUserRating": {
				const keys = tag.id.split(":");
				tag.value = AsfTagMapper.toRating(tag.value);
				tag.id = keys[0];
				break;
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/id3v2/ID3v22TagMapper.js
/**
* ID3v2.2 tag mappings
*/
var id3v22TagMap = {
	TT2: "title",
	TP1: "artist",
	TP2: "albumartist",
	TAL: "album",
	TYE: "year",
	COM: "comment",
	TRK: "track",
	TPA: "disk",
	TCO: "genre",
	PIC: "picture",
	TCM: "composer",
	TOR: "originaldate",
	TOT: "originalalbum",
	TXT: "lyricist",
	TP3: "conductor",
	TPB: "label",
	TT1: "grouping",
	TT3: "subtitle",
	TLA: "language",
	TCR: "copyright",
	WCP: "license",
	TEN: "encodedby",
	TSS: "encodersettings",
	WAR: "website",
	PCS: "podcast",
	TCP: "compilation",
	TDR: "date",
	TS2: "albumartistsort",
	TSA: "albumsort",
	TSC: "composersort",
	TSP: "artistsort",
	TST: "titlesort",
	WFD: "podcasturl",
	TBP: "bpm",
	GP1: "grouping"
};
var ID3v22TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["ID3v2.2"], id3v22TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/APEv2TagMapper.js
/**
* ID3v2.2 tag mappings
*/
var apev2TagMap = {
	Title: "title",
	Artist: "artist",
	Artists: "artists",
	"Album Artist": "albumartist",
	Album: "album",
	Year: "date",
	Originalyear: "originalyear",
	Originaldate: "originaldate",
	Releasedate: "releasedate",
	Comment: "comment",
	Track: "track",
	Disc: "disk",
	DISCNUMBER: "disk",
	Genre: "genre",
	"Cover Art (Front)": "picture",
	"Cover Art (Back)": "picture",
	Composer: "composer",
	Lyrics: "lyrics",
	ALBUMSORT: "albumsort",
	TITLESORT: "titlesort",
	WORK: "work",
	ARTISTSORT: "artistsort",
	ALBUMARTISTSORT: "albumartistsort",
	COMPOSERSORT: "composersort",
	Lyricist: "lyricist",
	Writer: "writer",
	Conductor: "conductor",
	MixArtist: "remixer",
	Arranger: "arranger",
	Engineer: "engineer",
	Producer: "producer",
	DJMixer: "djmixer",
	Mixer: "mixer",
	Label: "label",
	Grouping: "grouping",
	Subtitle: "subtitle",
	DiscSubtitle: "discsubtitle",
	Compilation: "compilation",
	BPM: "bpm",
	Mood: "mood",
	Media: "media",
	CatalogNumber: "catalognumber",
	MUSICBRAINZ_ALBUMSTATUS: "releasestatus",
	MUSICBRAINZ_ALBUMTYPE: "releasetype",
	RELEASECOUNTRY: "releasecountry",
	Script: "script",
	Language: "language",
	Copyright: "copyright",
	LICENSE: "license",
	EncodedBy: "encodedby",
	EncoderSettings: "encodersettings",
	Barcode: "barcode",
	ISRC: "isrc",
	ASIN: "asin",
	musicbrainz_trackid: "musicbrainz_recordingid",
	musicbrainz_releasetrackid: "musicbrainz_trackid",
	MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
	MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
	MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
	MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
	MUSICBRAINZ_WORKID: "musicbrainz_workid",
	MUSICBRAINZ_TRMID: "musicbrainz_trmid",
	MUSICBRAINZ_DISCID: "musicbrainz_discid",
	Acoustid_Id: "acoustid_id",
	ACOUSTID_FINGERPRINT: "acoustid_fingerprint",
	MUSICIP_PUID: "musicip_puid",
	Weblink: "website",
	REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
	REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
	MP3GAIN_MINMAX: "replaygain_track_minmax",
	MP3GAIN_UNDO: "replaygain_undo"
};
var APEv2TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["APEv2"], apev2TagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/MP4TagMapper.js
/**
* Ref: https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata
*/
var mp4TagMap = {
	"©nam": "title",
	"©ART": "artist",
	aART: "albumartist",
	/**
	* ToDo: Album artist seems to be stored here while Picard documentation says: aART
	*/
	"----:com.apple.iTunes:Band": "albumartist",
	"©alb": "album",
	"©day": "date",
	"©cmt": "comment",
	"©com": "comment",
	trkn: "track",
	disk: "disk",
	"©gen": "genre",
	covr: "picture",
	"©wrt": "composer",
	"©lyr": "lyrics",
	soal: "albumsort",
	sonm: "titlesort",
	soar: "artistsort",
	soaa: "albumartistsort",
	soco: "composersort",
	"----:com.apple.iTunes:LYRICIST": "lyricist",
	"----:com.apple.iTunes:CONDUCTOR": "conductor",
	"----:com.apple.iTunes:REMIXER": "remixer",
	"----:com.apple.iTunes:ENGINEER": "engineer",
	"----:com.apple.iTunes:PRODUCER": "producer",
	"----:com.apple.iTunes:DJMIXER": "djmixer",
	"----:com.apple.iTunes:MIXER": "mixer",
	"----:com.apple.iTunes:LABEL": "label",
	"©grp": "grouping",
	"----:com.apple.iTunes:SUBTITLE": "subtitle",
	"----:com.apple.iTunes:DISCSUBTITLE": "discsubtitle",
	cpil: "compilation",
	tmpo: "bpm",
	"----:com.apple.iTunes:MOOD": "mood",
	"----:com.apple.iTunes:MEDIA": "media",
	"----:com.apple.iTunes:CATALOGNUMBER": "catalognumber",
	tvsh: "tvShow",
	tvsn: "tvSeason",
	tves: "tvEpisode",
	sosn: "tvShowSort",
	tven: "tvEpisodeId",
	tvnn: "tvNetwork",
	pcst: "podcast",
	purl: "podcasturl",
	"----:com.apple.iTunes:MusicBrainz Album Status": "releasestatus",
	"----:com.apple.iTunes:MusicBrainz Album Type": "releasetype",
	"----:com.apple.iTunes:MusicBrainz Album Release Country": "releasecountry",
	"----:com.apple.iTunes:SCRIPT": "script",
	"----:com.apple.iTunes:LANGUAGE": "language",
	cprt: "copyright",
	"©cpy": "copyright",
	"----:com.apple.iTunes:LICENSE": "license",
	"©too": "encodedby",
	pgap: "gapless",
	"----:com.apple.iTunes:BARCODE": "barcode",
	"----:com.apple.iTunes:ISRC": "isrc",
	"----:com.apple.iTunes:ASIN": "asin",
	"----:com.apple.iTunes:NOTES": "comment",
	"----:com.apple.iTunes:MusicBrainz Track Id": "musicbrainz_recordingid",
	"----:com.apple.iTunes:MusicBrainz Release Track Id": "musicbrainz_trackid",
	"----:com.apple.iTunes:MusicBrainz Album Id": "musicbrainz_albumid",
	"----:com.apple.iTunes:MusicBrainz Artist Id": "musicbrainz_artistid",
	"----:com.apple.iTunes:MusicBrainz Album Artist Id": "musicbrainz_albumartistid",
	"----:com.apple.iTunes:MusicBrainz Release Group Id": "musicbrainz_releasegroupid",
	"----:com.apple.iTunes:MusicBrainz Work Id": "musicbrainz_workid",
	"----:com.apple.iTunes:MusicBrainz TRM Id": "musicbrainz_trmid",
	"----:com.apple.iTunes:MusicBrainz Disc Id": "musicbrainz_discid",
	"----:com.apple.iTunes:Acoustid Id": "acoustid_id",
	"----:com.apple.iTunes:Acoustid Fingerprint": "acoustid_fingerprint",
	"----:com.apple.iTunes:MusicIP PUID": "musicip_puid",
	"----:com.apple.iTunes:fingerprint": "musicip_fingerprint",
	"----:com.apple.iTunes:replaygain_track_gain": "replaygain_track_gain",
	"----:com.apple.iTunes:replaygain_track_peak": "replaygain_track_peak",
	"----:com.apple.iTunes:replaygain_album_gain": "replaygain_album_gain",
	"----:com.apple.iTunes:replaygain_album_peak": "replaygain_album_peak",
	"----:com.apple.iTunes:replaygain_track_minmax": "replaygain_track_minmax",
	"----:com.apple.iTunes:replaygain_album_minmax": "replaygain_album_minmax",
	"----:com.apple.iTunes:replaygain_undo": "replaygain_undo",
	gnre: "genre",
	"----:com.apple.iTunes:ALBUMARTISTSORT": "albumartistsort",
	"----:com.apple.iTunes:ARTISTS": "artists",
	"----:com.apple.iTunes:ORIGINALDATE": "originaldate",
	"----:com.apple.iTunes:ORIGINALYEAR": "originalyear",
	"----:com.apple.iTunes:RELEASEDATE": "releasedate",
	desc: "description",
	ldes: "longDescription",
	"©mvn": "movement",
	"©mvi": "movementIndex",
	"©mvc": "movementTotal",
	"©wrk": "work",
	catg: "category",
	egid: "podcastId",
	hdvd: "hdVideo",
	keyw: "keywords",
	shwm: "showMovement",
	stik: "stik",
	rate: "rating"
};
var tagType = "iTunes";
var MP4TagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super([tagType], mp4TagMap);
	}
	postMap(tag, _warnings) {
		switch (tag.id) {
			case "rate": tag.value = {
				source: void 0,
				rating: Number.parseFloat(tag.value) / 100
			};
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/vorbis/VorbisTagMapper.js
/**
* Vorbis tag mappings
*
* Mapping from native header format to one or possibly more 'common' entries
* The common entries aim to read the same information from different media files
* independent of the underlying format
*/
var vorbisTagMap = {
	TITLE: "title",
	ARTIST: "artist",
	ARTISTS: "artists",
	ALBUMARTIST: "albumartist",
	"ALBUM ARTIST": "albumartist",
	ALBUM: "album",
	DATE: "date",
	ORIGINALDATE: "originaldate",
	ORIGINALYEAR: "originalyear",
	RELEASEDATE: "releasedate",
	COMMENT: "comment",
	TRACKNUMBER: "track",
	DISCNUMBER: "disk",
	GENRE: "genre",
	METADATA_BLOCK_PICTURE: "picture",
	COMPOSER: "composer",
	LYRICS: "lyrics",
	ALBUMSORT: "albumsort",
	TITLESORT: "titlesort",
	WORK: "work",
	ARTISTSORT: "artistsort",
	ALBUMARTISTSORT: "albumartistsort",
	COMPOSERSORT: "composersort",
	LYRICIST: "lyricist",
	WRITER: "writer",
	CONDUCTOR: "conductor",
	REMIXER: "remixer",
	ARRANGER: "arranger",
	ENGINEER: "engineer",
	PRODUCER: "producer",
	DJMIXER: "djmixer",
	MIXER: "mixer",
	LABEL: "label",
	GROUPING: "grouping",
	SUBTITLE: "subtitle",
	DISCSUBTITLE: "discsubtitle",
	TRACKTOTAL: "totaltracks",
	DISCTOTAL: "totaldiscs",
	COMPILATION: "compilation",
	RATING: "rating",
	BPM: "bpm",
	KEY: "key",
	MOOD: "mood",
	MEDIA: "media",
	CATALOGNUMBER: "catalognumber",
	RELEASESTATUS: "releasestatus",
	RELEASETYPE: "releasetype",
	RELEASECOUNTRY: "releasecountry",
	SCRIPT: "script",
	LANGUAGE: "language",
	COPYRIGHT: "copyright",
	LICENSE: "license",
	ENCODEDBY: "encodedby",
	ENCODERSETTINGS: "encodersettings",
	BARCODE: "barcode",
	ISRC: "isrc",
	ASIN: "asin",
	MUSICBRAINZ_TRACKID: "musicbrainz_recordingid",
	MUSICBRAINZ_RELEASETRACKID: "musicbrainz_trackid",
	MUSICBRAINZ_ALBUMID: "musicbrainz_albumid",
	MUSICBRAINZ_ARTISTID: "musicbrainz_artistid",
	MUSICBRAINZ_ALBUMARTISTID: "musicbrainz_albumartistid",
	MUSICBRAINZ_RELEASEGROUPID: "musicbrainz_releasegroupid",
	MUSICBRAINZ_WORKID: "musicbrainz_workid",
	MUSICBRAINZ_TRMID: "musicbrainz_trmid",
	MUSICBRAINZ_DISCID: "musicbrainz_discid",
	ACOUSTID_ID: "acoustid_id",
	ACOUSTID_ID_FINGERPRINT: "acoustid_fingerprint",
	MUSICIP_PUID: "musicip_puid",
	WEBSITE: "website",
	NOTES: "notes",
	TOTALTRACKS: "totaltracks",
	TOTALDISCS: "totaldiscs",
	DISCOGS_ARTIST_ID: "discogs_artist_id",
	DISCOGS_ARTISTS: "artists",
	DISCOGS_ARTIST_NAME: "artists",
	DISCOGS_ALBUM_ARTISTS: "albumartist",
	DISCOGS_CATALOG: "catalognumber",
	DISCOGS_COUNTRY: "releasecountry",
	DISCOGS_DATE: "originaldate",
	DISCOGS_LABEL: "label",
	DISCOGS_LABEL_ID: "discogs_label_id",
	DISCOGS_MASTER_RELEASE_ID: "discogs_master_release_id",
	DISCOGS_RATING: "discogs_rating",
	DISCOGS_RELEASED: "date",
	DISCOGS_RELEASE_ID: "discogs_release_id",
	DISCOGS_VOTES: "discogs_votes",
	CATALOGID: "catalognumber",
	STYLE: "genre",
	REPLAYGAIN_TRACK_GAIN: "replaygain_track_gain",
	REPLAYGAIN_TRACK_PEAK: "replaygain_track_peak",
	REPLAYGAIN_ALBUM_GAIN: "replaygain_album_gain",
	REPLAYGAIN_ALBUM_PEAK: "replaygain_album_peak",
	REPLAYGAIN_MINMAX: "replaygain_track_minmax",
	REPLAYGAIN_ALBUM_MINMAX: "replaygain_album_minmax",
	REPLAYGAIN_UNDO: "replaygain_undo"
};
var VorbisTagMapper = class VorbisTagMapper extends CommonTagMapper {
	static toRating(email, rating, maxScore) {
		return {
			source: email ? email.toLowerCase() : void 0,
			rating: Number.parseFloat(rating) / maxScore * CommonTagMapper.maxRatingScore
		};
	}
	constructor() {
		super(["vorbis"], vorbisTagMap);
	}
	postMap(tag) {
		if (tag.id === "RATING") tag.value = VorbisTagMapper.toRating(void 0, tag.value, 100);
		else if (tag.id.indexOf("RATING:") === 0) {
			const keys = tag.id.split(":");
			tag.value = VorbisTagMapper.toRating(keys[1], tag.value, 1);
			tag.id = keys[0];
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/riff/RiffInfoTagMap.js
/**
* RIFF Info Tags; part of the EXIF 2.3
* Ref: http://owl.phy.queensu.ca/~phil/exiftool/TagNames/RIFF.html#Info
*/
var riffInfoTagMap = {
	IART: "artist",
	ICRD: "date",
	INAM: "title",
	TITL: "title",
	IPRD: "album",
	ITRK: "track",
	IPRT: "track",
	COMM: "comment",
	ICMT: "comment",
	ICNT: "releasecountry",
	GNRE: "genre",
	IWRI: "writer",
	RATE: "rating",
	YEAR: "year",
	ISFT: "encodedby",
	CODE: "encodedby",
	TURL: "website",
	IGNR: "genre",
	IENG: "engineer",
	ITCH: "technician",
	IMED: "media",
	IRPD: "album"
};
var RiffInfoTagMapper = class extends CommonTagMapper {
	constructor() {
		super(["exif"], riffInfoTagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaTagMapper.js
/**
* EBML Tag map
*/
var ebmlTagMap = {
	"segment:title": "title",
	"album:ARTIST": "albumartist",
	"album:ARTISTSORT": "albumartistsort",
	"album:TITLE": "album",
	"album:DATE_RECORDED": "originaldate",
	"album:DATE_RELEASED": "releasedate",
	"album:PART_NUMBER": "disk",
	"album:TOTAL_PARTS": "totaltracks",
	"track:ARTIST": "artist",
	"track:ARTISTSORT": "artistsort",
	"track:TITLE": "title",
	"track:PART_NUMBER": "track",
	"track:MUSICBRAINZ_TRACKID": "musicbrainz_recordingid",
	"track:MUSICBRAINZ_ALBUMID": "musicbrainz_albumid",
	"track:MUSICBRAINZ_ARTISTID": "musicbrainz_artistid",
	"track:PUBLISHER": "label",
	"track:GENRE": "genre",
	"track:ENCODER": "encodedby",
	"track:ENCODER_OPTIONS": "encodersettings",
	"edition:TOTAL_PARTS": "totaldiscs",
	picture: "picture"
};
var MatroskaTagMapper = class extends CaseInsensitiveTagMap {
	constructor() {
		super(["matroska"], ebmlTagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffTagMap.js
/**
* ID3v1 tag mappings
*/
var tagMap = {
	NAME: "title",
	AUTH: "artist",
	"(c) ": "copyright",
	ANNO: "comment"
};
var AiffTagMapper = class extends CommonTagMapper {
	constructor() {
		super(["AIFF"], tagMap);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/common/CombinedTagMapper.js
var CombinedTagMapper = class {
	constructor() {
		this.tagMappers = {};
		[
			new ID3v1TagMapper(),
			new ID3v22TagMapper(),
			new ID3v24TagMapper(),
			new MP4TagMapper(),
			new MP4TagMapper(),
			new VorbisTagMapper(),
			new APEv2TagMapper(),
			new AsfTagMapper(),
			new RiffInfoTagMapper(),
			new MatroskaTagMapper(),
			new AiffTagMapper()
		].forEach((mapper) => {
			this.registerTagMapper(mapper);
		});
	}
	/**
	* Convert native to generic (common) tags
	* @param tagType Originating tag format
	* @param tag     Native tag to map to a generic tag id
	* @param warnings
	* @return Generic tag result (output of this function)
	*/
	mapTag(tagType, tag, warnings) {
		if (this.tagMappers[tagType]) return this.tagMappers[tagType].mapGenericTag(tag, warnings);
		throw new InternalParserError(`No generic tag mapper defined for tag-format: ${tagType}`);
	}
	registerTagMapper(genericTagMapper) {
		for (const tagType of genericTagMapper.tagTypes) this.tagMappers[tagType] = genericTagMapper;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/lrc/LyricsParser.js
var TIMESTAMP_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})]/;
function parseLyrics(input) {
	if (TIMESTAMP_REGEX.test(input)) return parseLrc(input);
	return toUnsyncedLyrics(input);
}
function toUnsyncedLyrics(lyrics) {
	return {
		contentType: LyricsContentType.lyrics,
		timeStampFormat: TimestampFormat.notSynchronized,
		text: lyrics.trim(),
		syncText: []
	};
}
/**
* Parse LRC (Lyrics) formatted text
* Ref: https://en.wikipedia.org/wiki/LRC_(file_format)
* @param lrcString
*/
function parseLrc(lrcString) {
	const lines = lrcString.split("\n");
	const syncText = [];
	for (const line of lines) {
		const match = line.match(TIMESTAMP_REGEX);
		if (match) {
			const minutes = Number.parseInt(match[1], 10);
			const seconds = Number.parseInt(match[2], 10);
			const ms = match[3].length === 3 ? Number.parseInt(match[3], 10) : Number.parseInt(match[3], 10) * 10;
			const timestamp = (minutes * 60 + seconds) * 1e3 + ms;
			const text = line.replace(TIMESTAMP_REGEX, "").trim();
			syncText.push({
				timestamp,
				text
			});
		}
	}
	return {
		contentType: LyricsContentType.lyrics,
		timeStampFormat: TimestampFormat.milliseconds,
		text: syncText.map((line) => line.text).join("\n"),
		syncText
	};
}
//#endregion
//#region node_modules/music-metadata/lib/common/MetadataCollector.js
var debug$18 = (0, import_src.default)("music-metadata:collector");
var TagPriority = [
	"matroska",
	"APEv2",
	"vorbis",
	"ID3v2.4",
	"ID3v2.3",
	"ID3v2.2",
	"exif",
	"asf",
	"iTunes",
	"AIFF",
	"ID3v1"
];
/**
* Provided to the parser to uodate the metadata result.
* Responsible for triggering async updates
*/
var MetadataCollector = class {
	constructor(opts) {
		this.format = {
			tagTypes: [],
			trackInfo: []
		};
		this.native = {};
		this.common = {
			track: {
				no: null,
				of: null
			},
			disk: {
				no: null,
				of: null
			},
			movementIndex: {
				no: null,
				of: null
			}
		};
		this.quality = { warnings: [] };
		/**
		* Keeps track of origin priority for each mapped id
		*/
		this.commonOrigin = {};
		/**
		* Maps a tag type to a priority
		*/
		this.originPriority = {};
		this.tagMapper = new CombinedTagMapper();
		this.opts = opts;
		let priority = 1;
		for (const tagType of TagPriority) this.originPriority[tagType] = priority++;
		this.originPriority.artificial = 500;
		this.originPriority.id3v1 = 600;
	}
	/**
	* @returns {boolean} true if one or more tags have been found
	*/
	hasAny() {
		return Object.keys(this.native).length > 0;
	}
	addStreamInfo(streamInfo) {
		debug$18(`streamInfo: type=${streamInfo.type ? TrackTypeValueToKeyMap[streamInfo.type] : "?"}, codec=${streamInfo.codecName}`);
		this.format.trackInfo.push(streamInfo);
	}
	setFormat(key, value) {
		debug$18(`format: ${key} = ${value}`);
		this.format[key] = value;
		if (this.opts?.observer) this.opts.observer({
			metadata: this,
			tag: {
				type: "format",
				id: key,
				value
			}
		});
	}
	setAudioOnly() {
		this.setFormat("hasAudio", true);
		this.setFormat("hasVideo", false);
	}
	async addTag(tagType, tagId, value) {
		debug$18(`tag ${tagType}.${tagId} = ${value}`);
		if (!this.native[tagType]) {
			this.format.tagTypes.push(tagType);
			this.native[tagType] = [];
		}
		this.native[tagType].push({
			id: tagId,
			value
		});
		await this.toCommon(tagType, tagId, value);
	}
	addWarning(warning) {
		this.quality.warnings.push({ message: warning });
	}
	async postMap(tagType, tag) {
		switch (tag.id) {
			case "artist": return this.handleSingularArtistTag(tagType, tag, "artist", "artists");
			case "albumartist": return this.handleSingularArtistTag(tagType, tag, "albumartist", "albumartists");
			case "artists": return this.handlePluralArtistTag(tagType, tag, "artist", "artists");
			case "albumartists": return this.handlePluralArtistTag(tagType, tag, "albumartist", "albumartists");
			case "picture": return this.postFixPicture(tag.value).then((picture) => {
				if (picture !== null) {
					tag.value = picture;
					this.setGenericTag(tagType, tag);
				}
			});
			case "totaltracks":
				this.common.track.of = CommonTagMapper.toIntOrNull(tag.value);
				return;
			case "totaldiscs":
				this.common.disk.of = CommonTagMapper.toIntOrNull(tag.value);
				return;
			case "movementTotal":
				this.common.movementIndex.of = CommonTagMapper.toIntOrNull(tag.value);
				return;
			case "track":
			case "disk":
			case "movementIndex": {
				const of = this.common[tag.id].of;
				this.common[tag.id] = CommonTagMapper.normalizeTrack(tag.value);
				this.common[tag.id].of = of != null ? of : this.common[tag.id].of;
				return;
			}
			case "bpm":
			case "year":
			case "originalyear":
				tag.value = Number.parseInt(tag.value, 10);
				break;
			case "date": {
				const year = Number.parseInt(tag.value.substr(0, 4), 10);
				if (!Number.isNaN(year)) this.common.year = year;
				break;
			}
			case "discogs_label_id":
			case "discogs_release_id":
			case "discogs_master_release_id":
			case "discogs_artist_id":
			case "discogs_votes":
				tag.value = typeof tag.value === "string" ? Number.parseInt(tag.value, 10) : tag.value;
				break;
			case "replaygain_track_gain":
			case "replaygain_track_peak":
			case "replaygain_album_gain":
			case "replaygain_album_peak":
				tag.value = toRatio(tag.value);
				break;
			case "replaygain_track_minmax":
				tag.value = tag.value.split(",").map((v) => Number.parseInt(v, 10));
				break;
			case "replaygain_undo": {
				const minMix = tag.value.split(",").map((v) => Number.parseInt(v, 10));
				tag.value = {
					leftChannel: minMix[0],
					rightChannel: minMix[1]
				};
				break;
			}
			case "gapless":
			case "compilation":
			case "podcast":
			case "showMovement":
				tag.value = tag.value === "1" || tag.value === 1;
				break;
			case "isrc": {
				const commonTag = this.common[tag.id];
				if (commonTag && commonTag.indexOf(tag.value) !== -1) return;
				break;
			}
			case "comment":
				if (typeof tag.value === "string") tag.value = { text: tag.value };
				if (tag.value.descriptor === "iTunPGAP") this.setGenericTag(tagType, {
					id: "gapless",
					value: tag.value.text === "1"
				});
				break;
			case "lyrics": if (typeof tag.value === "string") tag.value = parseLyrics(tag.value);
		}
		if (tag.value !== null) this.setGenericTag(tagType, tag);
	}
	/**
	* Convert native tags to common tags
	* @returns {IAudioMetadata} Native + common tags
	*/
	toCommonMetadata() {
		return {
			format: this.format,
			native: this.native,
			quality: this.quality,
			common: this.common
		};
	}
	/**
	* Handle singular artist tags (artist, albumartist) and cross-populate to plural form
	*/
	handleSingularArtistTag(tagType, tag, singularId, pluralId) {
		if (this.commonOrigin[singularId] === this.originPriority[tagType]) return this.postMap("artificial", {
			id: pluralId,
			value: tag.value
		});
		if (!this.common[pluralId]) this.setGenericTag("artificial", {
			id: pluralId,
			value: tag.value
		});
		this.setGenericTag(tagType, tag);
	}
	/**
	* Handle plural artist tags (artists, albumartists) and cross-populate to singular form
	*/
	handlePluralArtistTag(tagType, tag, singularId, pluralId) {
		if (!this.common[singularId] || this.commonOrigin[singularId] === this.originPriority.artificial) {
			if (!this.common[pluralId] || this.common[pluralId].indexOf(tag.value) === -1) {
				const value = joinArtists((this.common[pluralId] || []).concat([tag.value]));
				this.setGenericTag("artificial", {
					id: singularId,
					value
				});
			}
		}
		this.setGenericTag(tagType, tag);
	}
	/**
	* Fix some common issues with picture object
	* @param picture Picture
	*/
	async postFixPicture(picture) {
		if (picture.data && picture.data.length > 0) {
			if (!picture.format) {
				const fileType = await fileTypeFromBuffer(Uint8Array.from(picture.data));
				if (fileType) picture.format = fileType.mime;
				else return null;
			}
			picture.format = picture.format.toLocaleLowerCase();
			switch (picture.format) {
				case "image/jpg": picture.format = "image/jpeg";
			}
			return picture;
		}
		this.addWarning("Empty picture tag found");
		return null;
	}
	/**
	* Convert native tag to common tags
	*/
	async toCommon(tagType, tagId, value) {
		const tag = {
			id: tagId,
			value
		};
		const genericTag = this.tagMapper.mapTag(tagType, tag, this);
		if (genericTag) await this.postMap(tagType, genericTag);
	}
	/**
	* Set generic tag
	*/
	setGenericTag(tagType, tag) {
		debug$18(`common.${tag.id} = ${tag.value}`);
		const prio0 = this.commonOrigin[tag.id] || 1e3;
		const prio1 = this.originPriority[tagType];
		if (isSingleton(tag.id)) {
			if (prio1 <= prio0) {
				this.common[tag.id] = tag.value;
				this.commonOrigin[tag.id] = prio1;
			} else return debug$18(`Ignore native tag (singleton): ${tagType}.${tag.id} = ${tag.value}`);
		} else if (prio1 === prio0) {
			if (!isUnique(tag.id) || this.common[tag.id].indexOf(tag.value) === -1) this.common[tag.id].push(tag.value);
			else debug$18(`Ignore duplicate value: ${tagType}.${tag.id} = ${tag.value}`);
		} else if (prio1 < prio0) {
			this.common[tag.id] = [tag.value];
			this.commonOrigin[tag.id] = prio1;
		} else return debug$18(`Ignore native tag (list): ${tagType}.${tag.id} = ${tag.value}`);
		if (this.opts?.observer) this.opts.observer({
			metadata: this,
			tag: {
				type: "common",
				id: tag.id,
				value: tag.value
			}
		});
	}
};
function joinArtists(artists) {
	if (artists.length > 2) return `${artists.slice(0, artists.length - 1).join(", ")} & ${artists[artists.length - 1]}`;
	return artists.join(" & ");
}
//#endregion
//#region node_modules/music-metadata/lib/mpeg/MpegLoader.js
var mpegParserLoader = {
	parserType: "mpeg",
	extensions: [
		".mp2",
		".mp3",
		".m2a",
		".aac",
		"aacp"
	],
	mimeTypes: [
		"audio/mpeg",
		"audio/mp3",
		"audio/aacs",
		"audio/aacp"
	],
	async load() {
		return (await Promise.resolve().then(() => MpegParser_exports)).MpegParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/apev2/Apev2Loader.js
var apeParserLoader = {
	parserType: "apev2",
	extensions: [".ape"],
	mimeTypes: ["audio/ape", "audio/monkeys-audio"],
	async load() {
		return (await Promise.resolve().then(() => APEv2Parser_exports)).APEv2Parser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/asf/AsfLoader.js
var asfParserLoader = {
	parserType: "asf",
	extensions: [
		".asf",
		".wma",
		".wmv"
	],
	mimeTypes: [
		"audio/ms-wma",
		"video/ms-wmv",
		"audio/ms-asf",
		"video/ms-asf",
		"application/vnd.ms-asf"
	],
	async load() {
		return (await Promise.resolve().then(() => AsfParser_exports)).AsfParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsdiff/DsdiffLoader.js
var dsdiffParserLoader = {
	parserType: "dsdiff",
	extensions: [".dff"],
	mimeTypes: ["audio/dsf", "audio/dsd"],
	async load() {
		return (await Promise.resolve().then(() => DsdiffParser_exports)).DsdiffParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/aiff/AiffLoader.js
var aiffParserLoader = {
	parserType: "aiff",
	extensions: [
		".aif",
		"aiff",
		"aifc"
	],
	mimeTypes: [
		"audio/aiff",
		"audio/aif",
		"audio/aifc",
		"application/aiff"
	],
	async load() {
		return (await Promise.resolve().then(() => AiffParser_exports)).AIFFParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/dsf/DsfLoader.js
var dsfParserLoader = {
	parserType: "dsf",
	extensions: [".dsf"],
	mimeTypes: ["audio/dsf"],
	async load() {
		return (await Promise.resolve().then(() => DsfParser_exports)).DsfParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/flac/FlacLoader.js
var flacParserLoader = {
	parserType: "flac",
	extensions: [".flac"],
	mimeTypes: ["audio/flac"],
	async load() {
		return (await Promise.resolve().then(() => FlacParser_exports)).FlacParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaLoader.js
var matroskaParserLoader = {
	parserType: "matroska",
	extensions: [
		".mka",
		".mkv",
		".mk3d",
		".mks",
		"webm"
	],
	mimeTypes: [
		"audio/matroska",
		"video/matroska",
		"audio/webm",
		"video/webm"
	],
	async load() {
		return (await Promise.resolve().then(() => MatroskaParser_exports)).MatroskaParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/Mp4Loader.js
var mp4ParserLoader = {
	parserType: "mp4",
	extensions: [
		".mp4",
		".m4a",
		".m4b",
		".m4pa",
		"m4v",
		"m4r",
		"3gp",
		".mov",
		".movie",
		".qt"
	],
	mimeTypes: [
		"audio/mp4",
		"audio/m4a",
		"video/m4v",
		"video/mp4",
		"video/quicktime"
	],
	async load() {
		return (await Promise.resolve().then(() => MP4Parser_exports)).MP4Parser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackLoader.js
var musepackParserLoader = {
	parserType: "musepack",
	extensions: [".mpc"],
	mimeTypes: ["audio/musepack"],
	async load() {
		return (await Promise.resolve().then(() => MusepackParser_exports)).MusepackParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggLoader.js
var oggParserLoader = {
	parserType: "ogg",
	extensions: [
		".ogg",
		".ogv",
		".oga",
		".ogm",
		".ogx",
		".opus",
		".spx"
	],
	mimeTypes: [
		"audio/ogg",
		"audio/opus",
		"audio/speex",
		"video/ogg"
	],
	async load() {
		return (await Promise.resolve().then(() => OggParser_exports)).OggParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackLoader.js
var wavpackParserLoader = {
	parserType: "wavpack",
	extensions: [".wv", ".wvp"],
	mimeTypes: ["audio/wavpack"],
	async load() {
		return (await Promise.resolve().then(() => WavPackParser_exports)).WavPackParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveLoader.js
var riffParserLoader = {
	parserType: "riff",
	extensions: [
		".wav",
		"wave",
		".bwf"
	],
	mimeTypes: [
		"audio/vnd.wave",
		"audio/wav",
		"audio/wave"
	],
	async load() {
		return (await Promise.resolve().then(() => WaveParser_exports)).WaveParser;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ParserFactory.js
var debug$17 = (0, import_src.default)("music-metadata:parser:factory");
function parseHttpContentType(contentType) {
	const type = import_dist.parse(contentType);
	const mime = parse(type.type);
	return {
		type: mime.type,
		subtype: mime.subtype,
		suffix: mime.suffix,
		parameters: type.parameters
	};
}
var ParserFactory = class {
	constructor() {
		this.parsers = [];
		[
			flacParserLoader,
			mpegParserLoader,
			apeParserLoader,
			mp4ParserLoader,
			matroskaParserLoader,
			riffParserLoader,
			oggParserLoader,
			asfParserLoader,
			aiffParserLoader,
			wavpackParserLoader,
			musepackParserLoader,
			dsfParserLoader,
			dsdiffParserLoader
		].forEach((parser) => {
			this.registerParser(parser);
		});
	}
	registerParser(parser) {
		this.parsers.push(parser);
	}
	async parse(tokenizer, parserLoader, opts) {
		if (tokenizer.supportsRandomAccess()) {
			debug$17("tokenizer supports random-access, scanning for appending headers");
			await scanAppendingHeaders(tokenizer, opts);
		} else debug$17("tokenizer does not support random-access, cannot scan for appending headers");
		if (!parserLoader) {
			const buf = /* @__PURE__ */ new Uint8Array(4100);
			if (tokenizer.fileInfo.mimeType) parserLoader = this.findLoaderForContentType(tokenizer.fileInfo.mimeType);
			if (!parserLoader && tokenizer.fileInfo.path) parserLoader = this.findLoaderForExtension(tokenizer.fileInfo.path);
			if (!parserLoader) {
				debug$17("Guess parser on content...");
				await tokenizer.peekBuffer(buf, { mayBeLess: true });
				const guessedType = await fileTypeFromBuffer(buf, { mpegOffsetTolerance: 10 });
				if (!guessedType || !guessedType.mime) throw new CouldNotDetermineFileTypeError("Failed to determine audio format");
				debug$17(`Guessed file type is mime=${guessedType.mime}, extension=${guessedType.ext}`);
				parserLoader = this.findLoaderForContentType(guessedType.mime);
				if (!parserLoader) throw new UnsupportedFileTypeError(`Guessed MIME-type not supported: ${guessedType.mime}`);
			}
		}
		debug$17(`Loading ${parserLoader.parserType} parser...`);
		const metadata = new MetadataCollector(opts);
		const parser = new (await (parserLoader.load()))(metadata, tokenizer, opts ?? {});
		debug$17(`Parser ${parserLoader.parserType} loaded`);
		await parser.parse();
		if (metadata.format.trackInfo) {
			if (metadata.format.hasAudio === void 0) metadata.setFormat("hasAudio", !!metadata.format.trackInfo.find((track) => track.type === TrackType.audio));
			if (metadata.format.hasVideo === void 0) metadata.setFormat("hasVideo", !!metadata.format.trackInfo.find((track) => track.type === TrackType.video));
		}
		return metadata.toCommonMetadata();
	}
	/**
	* @param filePath - Path, filename or extension to audio file
	* @return Parser submodule name
	*/
	findLoaderForExtension(filePath) {
		if (!filePath) return;
		const extension = getExtension(filePath).toLocaleLowerCase() || filePath;
		return this.parsers.find((parser) => parser.extensions.indexOf(extension) !== -1);
	}
	findLoaderForContentType(httpContentType) {
		let mime;
		if (!httpContentType) return;
		try {
			mime = parseHttpContentType(httpContentType);
		} catch (_err) {
			debug$17(`Invalid HTTP Content-Type header value: ${httpContentType}`);
			return;
		}
		const subType = mime.subtype.indexOf("x-") === 0 ? mime.subtype.substring(2) : mime.subtype;
		return this.parsers.find((parser) => parser.mimeTypes.find((loader) => loader.indexOf(`${mime.type}/${subType}`) !== -1));
	}
	getSupportedMimeTypes() {
		const mimeTypeSet = /* @__PURE__ */ new Set();
		this.parsers.forEach((loader) => {
			loader.mimeTypes.forEach((mimeType) => {
				mimeTypeSet.add(mimeType);
				mimeTypeSet.add(mimeType.replace("/", "/x-"));
			});
		});
		return Array.from(mimeTypeSet);
	}
};
function getExtension(fname) {
	const i = fname.lastIndexOf(".");
	return i === -1 ? "" : fname.substring(i);
}
async function getLyricsHeaderLength(tokenizer) {
	const fileSize = tokenizer.fileInfo.size;
	if (fileSize >= 143) {
		const buf = /* @__PURE__ */ new Uint8Array(15);
		const position = tokenizer.position;
		await tokenizer.readBuffer(buf, { position: fileSize - 143 });
		tokenizer.setPosition(position);
		const txt = textDecode(buf, "latin1");
		if (txt.substring(6) === "LYRICS200") return Number.parseInt(txt.substring(0, 6), 10) + 15;
	}
	return 0;
}
//#endregion
//#region node_modules/music-metadata/lib/core.js
/**
* Primary entry point, Node.js specific entry point is MusepackParser.ts
*/
/**
* Parse audio from memory
* @param uint8Array - Uint8Array holding audio data
* @param fileInfo - File information object or MIME-type string
* @param options - Parsing options
* @returns Metadata
* Ref: https://github.com/Borewit/strtok3/blob/e6938c81ff685074d5eb3064a11c0b03ca934c1d/src/index.ts#L15
*/
async function parseBuffer(uint8Array, fileInfo, options = {}) {
	return parseFromTokenizer(fromBuffer(uint8Array, { fileInfo: typeof fileInfo === "string" ? { mimeType: fileInfo } : fileInfo }), options);
}
/**
* Parse audio from ITokenizer source
* @param tokenizer - Audio source implementing the tokenizer interface
* @param options - Parsing options
* @returns Metadata
*/
function parseFromTokenizer(tokenizer, options) {
	return new ParserFactory().parse(tokenizer, void 0, options);
}
async function scanAppendingHeaders(tokenizer, options = {}) {
	let apeOffset = tokenizer.fileInfo.size;
	if (await hasID3v1Header(tokenizer)) {
		apeOffset -= 128;
		const lyricsLen = await getLyricsHeaderLength(tokenizer);
		apeOffset -= lyricsLen;
	}
	options.apeHeader = await APEv2Parser.findApeFooterOffset(tokenizer, apeOffset);
}
//#endregion
//#region node_modules/music-metadata/lib/index.js
/**
* Node.js specific entry point.
*/
var lib_exports = /* @__PURE__ */ __exportAll({
	FieldDecodingError: () => FieldDecodingError,
	InternalParserError: () => InternalParserError,
	UnexpectedFileContentError: () => UnexpectedFileContentError,
	makeParseError: () => makeParseError,
	makeUnexpectedFileContentError: () => makeUnexpectedFileContentError,
	parseBuffer: () => parseBuffer,
	parseFile: () => parseFile,
	parseFromTokenizer: () => parseFromTokenizer,
	parseStream: () => parseStream,
	scanAppendingHeaders: () => scanAppendingHeaders
});
var debug$16 = (0, import_src.default)("music-metadata:parser");
/**
* Parse audio from Node Stream.Readable
* @param stream - Stream to read the audio track from
* @param fileInfo - File information object or MIME-type, e.g.: 'audio/mpeg'
* @param options - Parsing options
* @returns Metadata
*/
async function parseStream(stream, fileInfo, options = {}) {
	const tokenizer = await fromStream(stream, { fileInfo: typeof fileInfo === "string" ? { mimeType: fileInfo } : fileInfo });
	try {
		return await parseFromTokenizer(tokenizer, options);
	} finally {
		await tokenizer.close();
	}
}
/**
* Parse audio from Node file
* @param filePath - Media file to read meta-data from
* @param options - Parsing options
* @returns Metadata
*/
async function parseFile(filePath, options = {}) {
	debug$16(`parseFile: ${filePath}`);
	const fileTokenizer = await fromFile(filePath);
	const parserFactory = new ParserFactory();
	try {
		const parserLoader = parserFactory.findLoaderForExtension(filePath);
		if (!parserLoader) debug$16("Parser could not be determined by file extension");
		try {
			return await parserFactory.parse(fileTokenizer, parserLoader, options);
		} catch (error) {
			if (error instanceof CouldNotDetermineFileTypeError || error instanceof UnsupportedFileTypeError) error.message += `: ${filePath}`;
			throw error;
		}
	} finally {
		await fileTokenizer.close();
	}
}
//#endregion
//#region node_modules/music-metadata/lib/ebml/types.js
var DataType = {
	string: 0,
	uint: 1,
	uid: 2,
	bool: 3,
	binary: 4,
	float: 5
};
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaDtd.js
/**
* Elements of document type description
* Derived from https://github.com/tungol/EBML/blob/master/doctypes/matroska.dtd
* Extended with:
* - https://www.matroska.org/technical/specs/index.html
*/
var matroskaDtd = {
	name: "dtd",
	container: {
		440786851: {
			name: "ebml",
			container: {
				17030: {
					name: "ebmlVersion",
					value: DataType.uint
				},
				17143: {
					name: "ebmlReadVersion",
					value: DataType.uint
				},
				17138: {
					name: "ebmlMaxIDWidth",
					value: DataType.uint
				},
				17139: {
					name: "ebmlMaxSizeWidth",
					value: DataType.uint
				},
				17026: {
					name: "docType",
					value: DataType.string
				},
				17031: {
					name: "docTypeVersion",
					value: DataType.uint
				},
				17029: {
					name: "docTypeReadVersion",
					value: DataType.uint
				}
			}
		},
		408125543: {
			name: "segment",
			container: {
				290298740: {
					name: "seekHead",
					container: { 19899: {
						name: "seek",
						multiple: true,
						container: {
							21419: {
								name: "id",
								value: DataType.binary
							},
							21420: {
								name: "position",
								value: DataType.uint
							}
						}
					} }
				},
				357149030: {
					name: "info",
					container: {
						29604: {
							name: "uid",
							value: DataType.uid
						},
						29572: {
							name: "filename",
							value: DataType.string
						},
						3979555: {
							name: "prevUID",
							value: DataType.uid
						},
						3965867: {
							name: "prevFilename",
							value: DataType.string
						},
						4110627: {
							name: "nextUID",
							value: DataType.uid
						},
						4096955: {
							name: "nextFilename",
							value: DataType.string
						},
						2807729: {
							name: "timecodeScale",
							value: DataType.uint
						},
						17545: {
							name: "duration",
							value: DataType.float
						},
						17505: {
							name: "dateUTC",
							value: DataType.uint
						},
						31657: {
							name: "title",
							value: DataType.string
						},
						19840: {
							name: "muxingApp",
							value: DataType.string
						},
						22337: {
							name: "writingApp",
							value: DataType.string
						}
					}
				},
				524531317: {
					name: "cluster",
					multiple: true,
					container: {
						231: {
							name: "timecode",
							value: DataType.uid
						},
						22743: {
							name: "silentTracks ",
							multiple: true
						},
						167: {
							name: "position",
							value: DataType.uid
						},
						171: {
							name: "prevSize",
							value: DataType.uid
						},
						160: { name: "blockGroup" },
						163: { name: "simpleBlock" }
					}
				},
				374648427: {
					name: "tracks",
					container: { 174: {
						name: "entries",
						multiple: true,
						container: {
							215: {
								name: "trackNumber",
								value: DataType.uint
							},
							29637: {
								name: "uid",
								value: DataType.uid
							},
							131: {
								name: "trackType",
								value: DataType.uint
							},
							185: {
								name: "flagEnabled",
								value: DataType.bool
							},
							136: {
								name: "flagDefault",
								value: DataType.bool
							},
							21930: {
								name: "flagForced",
								value: DataType.bool
							},
							156: {
								name: "flagLacing",
								value: DataType.bool
							},
							28135: {
								name: "minCache",
								value: DataType.uint
							},
							28136: {
								name: "maxCache",
								value: DataType.uint
							},
							2352003: {
								name: "defaultDuration",
								value: DataType.uint
							},
							2306383: {
								name: "timecodeScale",
								value: DataType.float
							},
							21358: {
								name: "name",
								value: DataType.string
							},
							2274716: {
								name: "language",
								value: DataType.string
							},
							134: {
								name: "codecID",
								value: DataType.string
							},
							25506: {
								name: "codecPrivate",
								value: DataType.binary
							},
							2459272: {
								name: "codecName",
								value: DataType.string
							},
							3839639: {
								name: "codecSettings",
								value: DataType.string
							},
							3883072: {
								name: "codecInfoUrl",
								value: DataType.string
							},
							2536e3: {
								name: "codecDownloadUrl",
								value: DataType.string
							},
							170: {
								name: "codecDecodeAll",
								value: DataType.bool
							},
							28587: {
								name: "trackOverlay",
								value: DataType.uint
							},
							224: {
								name: "video",
								container: {
									154: {
										name: "flagInterlaced",
										value: DataType.bool
									},
									21432: {
										name: "stereoMode",
										value: DataType.uint
									},
									176: {
										name: "pixelWidth",
										value: DataType.uint
									},
									186: {
										name: "pixelHeight",
										value: DataType.uint
									},
									21680: {
										name: "displayWidth",
										value: DataType.uint
									},
									21690: {
										name: "displayHeight",
										value: DataType.uint
									},
									21683: {
										name: "aspectRatioType",
										value: DataType.uint
									},
									3061028: {
										name: "colourSpace",
										value: DataType.uint
									},
									3126563: {
										name: "gammaValue",
										value: DataType.float
									}
								}
							},
							225: {
								name: "audio",
								container: {
									181: {
										name: "samplingFrequency",
										value: DataType.float
									},
									30901: {
										name: "outputSamplingFrequency",
										value: DataType.float
									},
									159: {
										name: "channels",
										value: DataType.uint
									},
									148: {
										name: "channels",
										value: DataType.uint
									},
									32123: {
										name: "channelPositions",
										value: DataType.binary
									},
									25188: {
										name: "bitDepth",
										value: DataType.uint
									}
								}
							},
							28032: {
								name: "contentEncodings",
								container: { 25152: {
									name: "contentEncoding",
									container: {
										20529: {
											name: "order",
											value: DataType.uint
										},
										20530: {
											name: "scope",
											value: DataType.bool
										},
										20531: {
											name: "type",
											value: DataType.uint
										},
										20532: {
											name: "contentEncoding",
											container: {
												16980: {
													name: "contentCompAlgo",
													value: DataType.uint
												},
												16981: {
													name: "contentCompSettings",
													value: DataType.binary
												}
											}
										},
										20533: {
											name: "contentEncoding",
											container: {
												18401: {
													name: "contentEncAlgo",
													value: DataType.uint
												},
												18402: {
													name: "contentEncKeyID",
													value: DataType.binary
												},
												18403: {
													name: "contentSignature ",
													value: DataType.binary
												},
												18404: {
													name: "ContentSigKeyID  ",
													value: DataType.binary
												},
												18405: {
													name: "contentSigAlgo ",
													value: DataType.uint
												},
												18406: {
													name: "contentSigHashAlgo ",
													value: DataType.uint
												}
											}
										},
										25188: {
											name: "bitDepth",
											value: DataType.uint
										}
									}
								} }
							}
						}
					} }
				},
				475249515: {
					name: "cues",
					container: { 187: {
						name: "cuePoint",
						container: {
							179: {
								name: "cueTime",
								value: DataType.uid
							},
							183: {
								name: "positions",
								container: {
									247: {
										name: "track",
										value: DataType.uint
									},
									241: {
										name: "clusterPosition",
										value: DataType.uint
									},
									21368: {
										name: "blockNumber",
										value: DataType.uint
									},
									234: {
										name: "codecState",
										value: DataType.uint
									},
									219: {
										name: "reference",
										container: {
											150: {
												name: "time",
												value: DataType.uint
											},
											151: {
												name: "cluster",
												value: DataType.uint
											},
											21343: {
												name: "number",
												value: DataType.uint
											},
											235: {
												name: "codecState",
												value: DataType.uint
											}
										}
									},
									240: {
										name: "relativePosition",
										value: DataType.uint
									}
								}
							}
						}
					} }
				},
				423732329: {
					name: "attachments",
					container: { 24999: {
						name: "attachedFiles",
						multiple: true,
						container: {
							18046: {
								name: "description",
								value: DataType.string
							},
							18030: {
								name: "name",
								value: DataType.string
							},
							18016: {
								name: "mimeType",
								value: DataType.string
							},
							18012: {
								name: "data",
								value: DataType.binary
							},
							18094: {
								name: "uid",
								value: DataType.uid
							}
						}
					} }
				},
				272869232: {
					name: "chapters",
					container: { 17849: {
						name: "editionEntry",
						container: { 182: {
							name: "chapterAtom",
							container: {
								29636: {
									name: "uid",
									value: DataType.uid
								},
								145: {
									name: "timeStart",
									value: DataType.uint
								},
								146: {
									name: "timeEnd",
									value: DataType.uid
								},
								152: {
									name: "hidden",
									value: DataType.bool
								},
								17816: {
									name: "enabled",
									value: DataType.uid
								},
								143: {
									name: "track",
									container: {
										137: {
											name: "trackNumber",
											value: DataType.uid
										},
										128: {
											name: "display",
											container: {
												133: {
													name: "string",
													value: DataType.string
												},
												17276: {
													name: "language ",
													value: DataType.string
												},
												17278: {
													name: "country ",
													value: DataType.string
												}
											}
										}
									}
								}
							}
						} }
					} }
				},
				307544935: {
					name: "tags",
					container: { 29555: {
						name: "tag",
						multiple: true,
						container: {
							25536: {
								name: "target",
								container: {
									25541: {
										name: "tagTrackUID",
										value: DataType.uid
									},
									25540: {
										name: "tagChapterUID",
										value: DataType.uint
									},
									25542: {
										name: "tagAttachmentUID",
										value: DataType.uid
									},
									25546: {
										name: "targetType",
										value: DataType.string
									},
									26826: {
										name: "targetTypeValue",
										value: DataType.uint
									},
									25545: {
										name: "tagEditionUID",
										value: DataType.uid
									}
								}
							},
							26568: {
								name: "simpleTags",
								multiple: true,
								container: {
									17827: {
										name: "name",
										value: DataType.string
									},
									17543: {
										name: "string",
										value: DataType.string
									},
									17541: {
										name: "binary",
										value: DataType.binary
									},
									17530: {
										name: "language",
										value: DataType.string
									},
									17531: {
										name: "languageIETF",
										value: DataType.string
									},
									17540: {
										name: "default",
										value: DataType.bool
									}
								}
							}
						}
					} }
				}
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ebml/EbmlIterator.js
var debug$15 = (0, import_src.default)("music-metadata:parser:ebml");
var EbmlContentError = class extends makeUnexpectedFileContentError("EBML") {};
var ParseAction = {
	ReadNext: 0,
	IgnoreElement: 2,
	SkipSiblings: 3,
	TerminateParsing: 4,
	SkipElement: 5
};
/**
* Extensible Binary Meta Language (EBML) iterator
* https://en.wikipedia.org/wiki/Extensible_Binary_Meta_Language
* http://matroska.sourceforge.net/technical/specs/rfc/index.html
*
* WEBM VP8 AUDIO FILE
*/
var EbmlIterator = class {
	/**
	* @param {ITokenizer} tokenizer Input
	* @param tokenizer
	*/
	constructor(tokenizer) {
		this.parserMap = /* @__PURE__ */ new Map();
		this.ebmlMaxIDLength = 4;
		this.ebmlMaxSizeLength = 8;
		this.tokenizer = tokenizer;
		this.parserMap.set(DataType.uint, (e) => this.readUint(e));
		this.parserMap.set(DataType.string, (e) => this.readString(e));
		this.parserMap.set(DataType.binary, (e) => this.readBuffer(e));
		this.parserMap.set(DataType.uid, async (e) => this.readBuffer(e));
		this.parserMap.set(DataType.bool, (e) => this.readFlag(e));
		this.parserMap.set(DataType.float, (e) => this.readFloat(e));
	}
	async iterate(dtdElement, posDone, listener) {
		return this.parseContainer(linkParents(dtdElement), posDone, listener);
	}
	async parseContainer(dtdElement, posDone, listener) {
		const tree = {};
		while (this.tokenizer.position < posDone) {
			let element;
			const elementPosition = this.tokenizer.position;
			try {
				element = await this.readElement();
			} catch (error) {
				if (error instanceof EndOfStreamError) break;
				throw error;
			}
			const child = dtdElement.container[element.id];
			if (child) switch (listener.startNext(child)) {
				case ParseAction.ReadNext:
					if (element.id === 524531317) {}
					debug$15(`Read element: name=${getElementPath(child)}{id=0x${element.id.toString(16)}, container=${!!child.container}} at position=${elementPosition}`);
					if (child.container) {
						const res = await this.parseContainer(child, element.len >= 0 ? this.tokenizer.position + element.len : -1, listener);
						if (child.multiple) {
							if (!tree[child.name]) tree[child.name] = [];
							tree[child.name].push(res);
						} else tree[child.name] = res;
						await listener.elementValue(child, res, elementPosition);
					} else {
						const parser = this.parserMap.get(child.value);
						if (typeof parser === "function") {
							const value = await parser(element);
							tree[child.name] = value;
							await listener.elementValue(child, value, elementPosition);
						}
					}
					break;
				case ParseAction.SkipElement:
					debug$15(`Go to next element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
					break;
				case ParseAction.IgnoreElement:
					debug$15(`Ignore element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
					await this.tokenizer.ignore(element.len);
					break;
				case ParseAction.SkipSiblings:
					debug$15(`Ignore remaining container, at: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
					await this.tokenizer.ignore(posDone - this.tokenizer.position);
					break;
				case ParseAction.TerminateParsing:
					debug$15(`Terminate parsing at element: name=${getElementPath(child)}, element.id=0x${element.id}, container=${!!child.container} at position=${elementPosition}`);
					return tree;
			}
			else switch (element.id) {
				case 236:
					await this.tokenizer.ignore(element.len);
					break;
				default:
					debug$15(`parseEbml: parent=${getElementPath(dtdElement)}, unknown child: id=${element.id.toString(16)} at position=${elementPosition}`);
					await this.tokenizer.ignore(element.len);
			}
		}
		return tree;
	}
	async readVintData(maxLength) {
		const msb = await this.tokenizer.peekNumber(UINT8);
		let mask = 128;
		let oc = 1;
		while ((msb & mask) === 0) {
			if (oc > maxLength) throw new EbmlContentError("VINT value exceeding maximum size");
			++oc;
			mask >>= 1;
		}
		const id = new Uint8Array(oc);
		await this.tokenizer.readBuffer(id);
		return id;
	}
	async readElement() {
		const id = await this.readVintData(this.ebmlMaxIDLength);
		const lenField = await this.readVintData(this.ebmlMaxSizeLength);
		lenField[0] ^= 128 >> lenField.length - 1;
		return {
			id: readUIntBE(id, id.length),
			len: readUIntBE(lenField, lenField.length)
		};
	}
	async readFloat(e) {
		switch (e.len) {
			case 0: return 0;
			case 4: return this.tokenizer.readNumber(Float32_BE);
			case 8: return this.tokenizer.readNumber(Float64_BE);
			case 10: return this.tokenizer.readNumber(Float64_BE);
			default: throw new EbmlContentError(`Invalid IEEE-754 float length: ${e.len}`);
		}
	}
	async readFlag(e) {
		return await this.readUint(e) === 1;
	}
	async readUint(e) {
		return readUIntBE(await this.readBuffer(e), e.len);
	}
	async readString(e) {
		return (await this.tokenizer.readToken(new StringType(e.len, "utf-8"))).replace(/\x00.*$/g, "");
	}
	async readBuffer(e) {
		const buf = new Uint8Array(e.len);
		await this.tokenizer.readBuffer(buf);
		return buf;
	}
};
function readUIntBE(buf, len) {
	return Number(readUIntBeAsBigInt(buf, len));
}
/**
* Reeds an unsigned integer from a big endian buffer of length `len`
* @param buf Buffer to decode from
* @param len Number of bytes
* @private
*/
function readUIntBeAsBigInt(buf, len) {
	const normalizedNumber = /* @__PURE__ */ new Uint8Array(8);
	const cleanNumber = buf.subarray(0, len);
	try {
		normalizedNumber.set(cleanNumber, 8 - len);
		return UINT64_BE.get(normalizedNumber, 0);
	} catch (_error) {
		return BigInt(-1);
	}
}
function linkParents(element) {
	if (element.container) Object.keys(element.container).map((id) => {
		const child = element.container[id];
		child.id = Number.parseInt(id, 10);
		return child;
	}).forEach((child) => {
		child.parent = element;
		linkParents(child);
	});
	return element;
}
function getElementPath(element) {
	let path = "";
	if (element.parent && element.parent.name !== "dtd") path += `${getElementPath(element.parent)}/`;
	return path + element.name;
}
//#endregion
//#region node_modules/music-metadata/lib/matroska/MatroskaParser.js
var MatroskaParser_exports = /* @__PURE__ */ __exportAll({ MatroskaParser: () => MatroskaParser });
var debug$14 = (0, import_src.default)("music-metadata:parser:matroska");
/**
* Extensible Binary Meta Language (EBML) parser
* https://en.wikipedia.org/wiki/Extensible_Binary_Meta_Language
* http://matroska.sourceforge.net/technical/specs/rfc/index.html
*
* WEBM VP8 AUDIO FILE
*/
var MatroskaParser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.seekHeadOffset = 0;
		/**
		* Use index to skip multiple segment/cluster elements at once.
		* Significant performance impact
		*/
		this.flagUseIndexToSkipClusters = this.options.mkvUseIndex ?? false;
	}
	async parse() {
		const containerSize = this.tokenizer.fileInfo.size ?? Number.MAX_SAFE_INTEGER;
		const matroskaIterator = new EbmlIterator(this.tokenizer);
		debug$14("Initializing DTD end MatroskaIterator");
		await matroskaIterator.iterate(matroskaDtd, containerSize, {
			startNext: (element) => {
				switch (element.id) {
					case 475249515:
						debug$14(`Skip element: name=${element.name}, id=0x${element.id.toString(16)}`);
						return ParseAction.IgnoreElement;
					case 524531317:
						if (this.flagUseIndexToSkipClusters && this.seekHead) {
							const index = this.seekHead.seek.find((index) => index.position + this.seekHeadOffset > this.tokenizer.position);
							if (index) {
								const ignoreSize = index.position + this.seekHeadOffset - this.tokenizer.position;
								debug$14(`Use index to go to next position, ignoring ${ignoreSize} bytes`);
								this.tokenizer.ignore(ignoreSize);
								return ParseAction.SkipElement;
							}
						}
						return ParseAction.IgnoreElement;
					default: return ParseAction.ReadNext;
				}
			},
			elementValue: async (element, value, offset) => {
				debug$14(`Received: name=${element.name}, value=${value}`);
				switch (element.id) {
					case 17026:
						this.metadata.setFormat("container", `EBML/${value}`);
						break;
					case 290298740:
						this.seekHead = value;
						this.seekHeadOffset = offset;
						break;
					case 357149030:
						{
							const info = value;
							const timecodeScale = info.timecodeScale ? info.timecodeScale : 1e6;
							if (typeof info.duration === "number") {
								const duration = info.duration * timecodeScale / 1e9;
								await this.addTag("segment:title", info.title);
								this.metadata.setFormat("duration", Number(duration));
							}
						}
						break;
					case 374648427:
						{
							const audioTracks = value;
							if (audioTracks?.entries) {
								audioTracks.entries.forEach((entry) => {
									const stream = {
										codecName: entry.codecID.replace("A_", "").replace("V_", ""),
										codecSettings: entry.codecSettings,
										flagDefault: entry.flagDefault,
										flagLacing: entry.flagLacing,
										flagEnabled: entry.flagEnabled,
										language: entry.language,
										name: entry.name,
										type: entry.trackType,
										audio: entry.audio,
										video: entry.video
									};
									this.metadata.addStreamInfo(stream);
								});
								const audioTrack = audioTracks.entries.filter((entry) => entry.trackType === TrackType.audio).reduce((acc, cur) => {
									if (!acc) return cur;
									if (cur.flagDefault && !acc.flagDefault) return cur;
									if (cur.trackNumber < acc.trackNumber) return cur;
									return acc;
								}, null);
								if (audioTrack) {
									this.metadata.setFormat("codec", audioTrack.codecID.replace("A_", ""));
									this.metadata.setFormat("sampleRate", audioTrack.audio.samplingFrequency);
									this.metadata.setFormat("numberOfChannels", audioTrack.audio.channels);
								}
							}
						}
						break;
					case 307544935:
						{
							const tags = value;
							await Promise.all(tags.tag.map(async (tag) => {
								const target = tag.target;
								const targetType = target?.targetTypeValue ? TargetType[target.targetTypeValue] : target?.targetType ? target.targetType : "track";
								await Promise.all(tag.simpleTags.map(async (simpleTag) => {
									const value = simpleTag.string ? simpleTag.string : simpleTag.binary;
									await this.addTag(`${targetType}:${simpleTag.name}`, value);
								}));
							}));
						}
						break;
					case 423732329: {
						const attachments = value;
						await Promise.all(attachments.attachedFiles.filter((file) => file.mimeType.startsWith("image/")).map((file) => this.addTag("picture", {
							data: file.data,
							format: file.mimeType,
							description: file.description,
							name: file.name
						})));
					}
				}
			}
		});
	}
	async addTag(tagId, value) {
		await this.metadata.addTag("matroska", tagId, value);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/AtomToken.js
var debug$13 = (0, import_src.default)("music-metadata:parser:MP4:atom");
var Mp4ContentError = class extends makeUnexpectedFileContentError("MP4") {};
var Header$3 = {
	len: 8,
	get: (buf, off) => {
		const length = UINT32_BE.get(buf, off);
		if (length < 0) throw new Mp4ContentError("Invalid atom header length");
		return {
			length: BigInt(length),
			name: new StringType(4, "latin1").get(buf, off + 4)
		};
	},
	put: (buf, off, hdr) => {
		UINT32_BE.put(buf, off, Number(hdr.length));
		return FourCcToken.put(buf, off + 4, hdr.name);
	}
};
/**
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap1/qtff1.html#//apple_ref/doc/uid/TP40000939-CH203-38190
*/
var ExtendedSize = UINT64_BE;
var ftyp = {
	len: 4,
	get: (buf, off) => {
		return { type: new StringType(4, "ascii").get(buf, off) };
	}
};
/**
* Base class for 'fixed' length atoms.
* In some cases these atoms are longer then the sum of the described fields.
* Issue: https://github.com/Borewit/music-metadata/issues/120
*/
var FixedLengthAtom = class {
	/**
	*
	* @param {number} len Length as specified in the size field
	* @param {number} expLen Total length of sum of specified fields in the standard
	* @param atomId Atom ID
	*/
	constructor(len, expLen, atomId) {
		if (len < expLen) throw new Mp4ContentError(`Atom ${atomId} expected to be ${expLen}, but specifies ${len} bytes long.`);
		if (len > expLen) debug$13(`Warning: atom ${atomId} expected to be ${expLen}, but was actually ${len} bytes long.`);
		this.len = len;
	}
};
/**
* Timestamp stored in seconds since Mac Epoch (1 January 1904)
*/
var SecondsSinceMacEpoch = {
	len: 4,
	get: (buf, off) => {
		const secondsSinceUnixEpoch = UINT32_BE.get(buf, off) - 2082844800;
		return /* @__PURE__ */ new Date(secondsSinceUnixEpoch * 1e3);
	}
};
var SecondsSinceMacEpoch64 = {
	len: 8,
	get: (buf, off) => {
		const secondsSinceUnixEpoch = Number(UINT64_BE.get(buf, off)) - 2082844800;
		return /* @__PURE__ */ new Date(secondsSinceUnixEpoch * 1e3);
	}
};
/**
* Token: Media Header Atom
* Ref:
* - https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-SW34
* - https://wiki.multimedia.cx/index.php/QuickTime_container#mdhd
*/
var MdhdAtom = class extends FixedLengthAtom {
	constructor(len) {
		super(len, 24, "mdhd");
	}
	get(buf, off) {
		const version = UINT8.get(buf, off + 0);
		const flags = UINT24_BE.get(buf, off + 1);
		switch (version) {
			case 0: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
				timeScale: UINT32_BE.get(buf, off + 12),
				duration: UINT32_BE.get(buf, off + 16),
				language: UINT16_BE.get(buf, off + 20),
				quality: UINT16_BE.get(buf, off + 22)
			};
			case 1: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch64.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch64.get(buf, off + 12),
				timeScale: UINT32_BE.get(buf, off + 20),
				duration: Number(UINT64_BE.get(buf, off + 24)),
				language: UINT16_BE.get(buf, off + 32),
				quality: UINT16_BE.get(buf, off + 34)
			};
			default: throw new FieldDecodingError("Invalid mdhd version header");
		}
	}
};
/**
* Token: Movie Header Atom
*/
var MvhdAtom = class extends FixedLengthAtom {
	constructor(len) {
		super(len, 100, "mvhd");
	}
	get(buf, off) {
		const version = UINT8.get(buf, off);
		const flags = UINT24_BE.get(buf, off + 1);
		if (version === 1) return {
			version,
			flags,
			creationTime: SecondsSinceMacEpoch64.get(buf, off + 4),
			modificationTime: SecondsSinceMacEpoch64.get(buf, off + 12),
			timeScale: UINT32_BE.get(buf, off + 20),
			duration: Number(UINT64_BE.get(buf, off + 24)),
			preferredRate: UINT32_BE.get(buf, off + 32),
			preferredVolume: UINT16_BE.get(buf, off + 36),
			previewTime: UINT32_BE.get(buf, off + 84),
			previewDuration: UINT32_BE.get(buf, off + 88),
			posterTime: UINT32_BE.get(buf, off + 92),
			selectionTime: UINT32_BE.get(buf, off + 96),
			selectionDuration: UINT32_BE.get(buf, off + 100),
			currentTime: UINT32_BE.get(buf, off + 104),
			nextTrackID: UINT32_BE.get(buf, off + 108)
		};
		return {
			version,
			flags,
			creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
			modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
			timeScale: UINT32_BE.get(buf, off + 12),
			duration: UINT32_BE.get(buf, off + 16),
			preferredRate: UINT32_BE.get(buf, off + 20),
			preferredVolume: UINT16_BE.get(buf, off + 24),
			previewTime: UINT32_BE.get(buf, off + 72),
			previewDuration: UINT32_BE.get(buf, off + 76),
			posterTime: UINT32_BE.get(buf, off + 80),
			selectionTime: UINT32_BE.get(buf, off + 84),
			selectionDuration: UINT32_BE.get(buf, off + 88),
			currentTime: UINT32_BE.get(buf, off + 92),
			nextTrackID: UINT32_BE.get(buf, off + 96)
		};
	}
};
/**
* Data Atom Structure
*/
var DataAtom = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		return {
			type: {
				set: UINT8.get(buf, off + 0),
				type: UINT24_BE.get(buf, off + 1)
			},
			locale: UINT24_BE.get(buf, off + 4),
			value: new Uint8ArrayType(this.len - 8).get(buf, off + 8)
		};
	}
};
/**
* Data Atom Structure
* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW31
*/
var NameAtom = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		return {
			version: UINT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			name: new StringType(this.len - 4, "utf-8").get(buf, off + 4)
		};
	}
};
/**
* Track Header Atoms structure (`tkhd`)
* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25550
*/
var TrackHeaderAtom = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const version = UINT8.get(buf, off);
		const flags = UINT24_BE.get(buf, off + 1);
		switch (version) {
			case 0: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch.get(buf, off + 8),
				trackId: UINT32_BE.get(buf, off + 12),
				duration: UINT32_BE.get(buf, off + 20),
				layer: UINT16_BE.get(buf, off + 32),
				alternateGroup: UINT16_BE.get(buf, off + 34),
				volume: UINT16_BE.get(buf, off + 36)
			};
			case 1: return {
				version,
				flags,
				creationTime: SecondsSinceMacEpoch64.get(buf, off + 4),
				modificationTime: SecondsSinceMacEpoch64.get(buf, off + 12),
				trackId: UINT32_BE.get(buf, off + 20),
				duration: Number(UINT64_BE.get(buf, off + 28)),
				layer: UINT16_BE.get(buf, off + 44),
				alternateGroup: UINT16_BE.get(buf, off + 46),
				volume: UINT16_BE.get(buf, off + 48)
			};
			default: throw new FieldDecodingError("Invalid tkhd version header");
		}
	}
};
/**
* Atom: Sample Description Atom ('stsd')
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
*/
var stsdHeader = {
	len: 8,
	get: (buf, off) => {
		return {
			version: UINT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			numberOfEntries: UINT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Atom: Sample Description Atom ('stsd')
* Ref: https://developer.apple.com/documentation/quicktime-file-format/sample_description_atom
*/
var SampleDescriptionTable = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const descrLen = this.len - 12;
		return {
			dataFormat: FourCcToken.get(buf, off),
			dataReferenceIndex: UINT16_BE.get(buf, off + 10),
			description: descrLen > 0 ? new Uint8ArrayType(descrLen).get(buf, off + 12) : void 0
		};
	}
};
/**
* Atom: Sample-description Atom ('stsd')
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25691
*/
var StsdAtom = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const header = stsdHeader.get(buf, off);
		off += stsdHeader.len;
		const table = [];
		for (let n = 0; n < header.numberOfEntries; ++n) {
			const size = UINT32_BE.get(buf, off);
			off += UINT32_BE.len;
			table.push(new SampleDescriptionTable(size - UINT32_BE.len).get(buf, off));
			off += size - UINT32_BE.len;
		}
		return {
			header,
			table
		};
	}
};
/**
* Common Sound Sample Description (version & revision)
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-57317
*/
var SoundSampleDescriptionVersion = {
	len: 8,
	get(buf, off) {
		return {
			version: INT16_BE.get(buf, off),
			revision: INT16_BE.get(buf, off + 2),
			vendor: INT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Sound Sample Description (Version 0)
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-130736
*/
var SoundSampleDescriptionV0 = {
	len: 12,
	get(buf, off) {
		return {
			numAudioChannels: INT16_BE.get(buf, off + 0),
			sampleSize: INT16_BE.get(buf, off + 2),
			compressionId: INT16_BE.get(buf, off + 4),
			packetSize: INT16_BE.get(buf, off + 6),
			sampleRate: UINT16_BE.get(buf, off + 8) + UINT16_BE.get(buf, off + 10) / 1e4
		};
	}
};
var SimpleTableAtom = class {
	constructor(len, token) {
		this.len = len;
		this.token = token;
	}
	get(buf, off) {
		const nrOfEntries = INT32_BE.get(buf, off + 4);
		return {
			version: INT8.get(buf, off + 0),
			flags: INT24_BE.get(buf, off + 1),
			numberOfEntries: nrOfEntries,
			entries: readTokenTable(buf, this.token, off + 8, this.len - 8, nrOfEntries)
		};
	}
};
var TimeToSampleToken = {
	len: 8,
	get(buf, off) {
		return {
			count: INT32_BE.get(buf, off + 0),
			duration: INT32_BE.get(buf, off + 4)
		};
	}
};
/**
* Time-to-sample('stts') atom.
* Store duration information for a media’s samples.
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25696
*/
var SttsAtom = class extends SimpleTableAtom {
	constructor(len) {
		super(len, TimeToSampleToken);
	}
};
var SampleToChunkToken = {
	len: 12,
	get(buf, off) {
		return {
			firstChunk: INT32_BE.get(buf, off),
			samplesPerChunk: INT32_BE.get(buf, off + 4),
			sampleDescriptionId: INT32_BE.get(buf, off + 8)
		};
	}
};
/**
* Sample-to-Chunk ('stsc') atom interface
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25706
*/
var StscAtom = class extends SimpleTableAtom {
	constructor(len) {
		super(len, SampleToChunkToken);
	}
};
/**
* Sample-size ('stsz') atom
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25710
*/
var StszAtom = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const nrOfEntries = INT32_BE.get(buf, off + 8);
		return {
			version: INT8.get(buf, off),
			flags: INT24_BE.get(buf, off + 1),
			sampleSize: INT32_BE.get(buf, off + 4),
			numberOfEntries: nrOfEntries,
			entries: readTokenTable(buf, INT32_BE, off + 12, this.len - 12, nrOfEntries)
		};
	}
};
/**
* Chunk offset atom, 'stco'
* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-25715
*/
var StcoAtom = class extends SimpleTableAtom {
	constructor(len) {
		super(len, INT32_BE);
		this.len = len;
	}
};
/**
* Token used to decode text-track from 'mdat' atom (raw data stream)
*/
var ChapterText = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const titleLen = INT16_BE.get(buf, off + 0);
		return new StringType(titleLen, "utf-8").get(buf, off + 2);
	}
};
function readTokenTable(buf, token, off, remainingLen, numberOfEntries) {
	debug$13(`remainingLen=${remainingLen}, numberOfEntries=${numberOfEntries} * token-len=${token.len}`);
	if (remainingLen === 0) return [];
	if (remainingLen !== numberOfEntries * token.len) throw new Mp4ContentError("mismatch number-of-entries with remaining atom-length");
	const entries = [];
	for (let n = 0; n < numberOfEntries; ++n) {
		entries.push(token.get(buf, off));
		off += token.len;
	}
	return entries;
}
/**
* Sample-size ('tfhd') TrackFragmentHeaderBox
*/
var TrackFragmentHeaderBox = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const flagOffset = off + 1;
		const header = {
			version: INT8.get(buf, off),
			flags: {
				baseDataOffsetPresent: getBit(buf, flagOffset + 2, 0),
				sampleDescriptionIndexPresent: getBit(buf, flagOffset + 2, 1),
				defaultSampleDurationPresent: getBit(buf, flagOffset + 2, 3),
				defaultSampleSizePresent: getBit(buf, flagOffset + 2, 4),
				defaultSampleFlagsPresent: getBit(buf, flagOffset + 2, 5),
				defaultDurationIsEmpty: getBit(buf, flagOffset, 0),
				defaultBaseIsMoof: getBit(buf, flagOffset, 1)
			},
			trackId: UINT32_BE.get(buf, 4)
		};
		let dynOffset = 8;
		if (header.flags.baseDataOffsetPresent) {
			header.baseDataOffset = UINT64_BE.get(buf, dynOffset);
			dynOffset += 8;
		}
		if (header.flags.sampleDescriptionIndexPresent) {
			header.sampleDescriptionIndex = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleDurationPresent) {
			header.defaultSampleDuration = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleSizePresent) {
			header.defaultSampleSize = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (header.flags.defaultSampleFlagsPresent) header.defaultSampleFlags = UINT32_BE.get(buf, dynOffset);
		return header;
	}
};
/**
* Sample-size ('trun') TrackRunBox
*/
var TrackRunBox = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		const flagOffset = off + 1;
		const trun = {
			version: INT8.get(buf, off),
			flags: {
				dataOffsetPresent: getBit(buf, flagOffset + 2, 0),
				firstSampleFlagsPresent: getBit(buf, flagOffset + 2, 2),
				sampleDurationPresent: getBit(buf, flagOffset + 1, 0),
				sampleSizePresent: getBit(buf, flagOffset + 1, 1),
				sampleFlagsPresent: getBit(buf, flagOffset + 1, 2),
				sampleCompositionTimeOffsetsPresent: getBit(buf, flagOffset + 1, 3)
			},
			sampleCount: UINT32_BE.get(buf, off + 4),
			samples: []
		};
		let dynOffset = off + 8;
		if (trun.flags.dataOffsetPresent) {
			trun.dataOffset = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		if (trun.flags.firstSampleFlagsPresent) {
			trun.firstSampleFlags = UINT32_BE.get(buf, dynOffset);
			dynOffset += 4;
		}
		for (let n = 0; n < trun.sampleCount; ++n) {
			if (dynOffset >= this.len) {
				debug$13("TrackRunBox size mismatch");
				break;
			}
			const sample = {};
			if (trun.flags.sampleDurationPresent) {
				sample.sampleDuration = UINT32_BE.get(buf, dynOffset);
				dynOffset += 4;
			}
			if (trun.flags.sampleSizePresent) {
				sample.sampleSize = UINT32_BE.get(buf, dynOffset);
				dynOffset += 4;
			}
			if (trun.flags.sampleFlagsPresent) {
				sample.sampleFlags = UINT32_BE.get(buf, dynOffset);
				dynOffset += 4;
			}
			if (trun.flags.sampleCompositionTimeOffsetsPresent) {
				sample.sampleCompositionTimeOffset = UINT32_BE.get(buf, dynOffset);
				dynOffset += 4;
			}
			trun.samples.push(sample);
		}
		return trun;
	}
};
/**
* HandlerBox (`hdlr`)
*/
var HandlerBox = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		off + 1;
		const charTypeToken = new StringType(4, "utf-8");
		return {
			version: INT8.get(buf, off),
			flags: UINT24_BE.get(buf, off + 1),
			componentType: charTypeToken.get(buf, off + 4),
			handlerType: charTypeToken.get(buf, off + 8),
			componentName: new StringType(this.len - 28, "utf-8").get(buf, off + 28)
		};
	}
};
/**
* Chapter Track Reference Box (`chap`)
*/
var ChapterTrackReferenceBox = class {
	constructor(len) {
		this.len = len;
	}
	get(buf, off) {
		let dynOffset = 0;
		const trackIds = [];
		while (dynOffset < this.len) {
			trackIds.push(UINT32_BE.get(buf, off + dynOffset));
			dynOffset += 4;
		}
		return trackIds;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/Atom.js
var debug$12 = (0, import_src.default)("music-metadata:parser:MP4:Atom");
var Atom = class Atom {
	static async readAtom(tokenizer, dataHandler, parent, remaining) {
		const offset = tokenizer.position;
		debug$12(`Reading next token on offset=${offset}...`);
		const header = await tokenizer.readToken(Header$3);
		const extended = header.length === 1n;
		if (extended) header.length = await tokenizer.readToken(ExtendedSize);
		const atomBean = new Atom(header, extended, parent);
		const payloadLength = atomBean.getPayloadLength(remaining);
		debug$12(`parse atom name=${atomBean.atomPath}, extended=${atomBean.extended}, offset=${offset}, len=${atomBean.header.length}`);
		await atomBean.readData(tokenizer, dataHandler, payloadLength);
		return atomBean;
	}
	constructor(header, extended, parent) {
		this.header = header;
		this.extended = extended;
		this.parent = parent;
		this.children = [];
		this.atomPath = (this.parent ? `${this.parent.atomPath}.` : "") + this.header.name;
	}
	getHeaderLength() {
		return this.extended ? 16 : 8;
	}
	getPayloadLength(remaining) {
		return (this.header.length === 0n ? remaining : Number(this.header.length)) - this.getHeaderLength();
	}
	async readAtoms(tokenizer, dataHandler, size) {
		while (size > 0) {
			const atomBean = await Atom.readAtom(tokenizer, dataHandler, this, size);
			this.children.push(atomBean);
			size -= atomBean.header.length === 0n ? size : Number(atomBean.header.length);
		}
	}
	async readData(tokenizer, dataHandler, remaining) {
		switch (this.header.name) {
			case "moov":
			case "udta":
			case "mdia":
			case "minf":
			case "stbl":
			case "<id>":
			case "ilst":
			case "tref":
			case "moof": return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining));
			case "meta": {
				const paddingLength = (await tokenizer.peekToken(Header$3)).name === "hdlr" ? 0 : 4;
				await tokenizer.ignore(paddingLength);
				return this.readAtoms(tokenizer, dataHandler, this.getPayloadLength(remaining) - paddingLength);
			}
			default: return dataHandler(this, remaining);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mp4/MP4Parser.js
var MP4Parser_exports = /* @__PURE__ */ __exportAll({ MP4Parser: () => MP4Parser });
var debug$11 = (0, import_src.default)("music-metadata:parser:MP4");
var tagFormat = "iTunes";
var encoderDict = {
	raw: {
		lossy: false,
		format: "raw"
	},
	MAC3: {
		lossy: true,
		format: "MACE 3:1"
	},
	MAC6: {
		lossy: true,
		format: "MACE 6:1"
	},
	ima4: {
		lossy: true,
		format: "IMA 4:1"
	},
	ulaw: {
		lossy: true,
		format: "uLaw 2:1"
	},
	alaw: {
		lossy: true,
		format: "uLaw 2:1"
	},
	Qclp: {
		lossy: true,
		format: "QUALCOMM PureVoice"
	},
	".mp3": {
		lossy: true,
		format: "MPEG-1 layer 3"
	},
	alac: {
		lossy: false,
		format: "ALAC"
	},
	"ac-3": {
		lossy: true,
		format: "AC-3"
	},
	mp4a: {
		lossy: true,
		format: "MPEG-4/AAC"
	},
	mp4s: {
		lossy: true,
		format: "MP4S"
	},
	c608: {
		lossy: true,
		format: "CEA-608"
	},
	c708: {
		lossy: true,
		format: "CEA-708"
	}
};
function distinct(value, index, self) {
	return self.indexOf(value) === index;
}
/**
* Determine if a track carries audio.
*
* Ref: ISO/IEC 14496-12, 8.5.2: the sample entries in a sample description box are track-type specific,
* selected by the handler type of the enclosing track. Only an audio track holds an AudioSampleEntry, so
* only such a track may be described by a sound sample description; `isAudio()` treats both the 'soun'
* and 'audi' handler types as audio.
*
* Falls back to the sample description when no handler box was found, preserving the previous behavior.
*/
function isAudioTrack(track) {
	const [ssd] = track.soundSampleDescription ?? [];
	if (!ssd) return false;
	if (track.isAudio) return track.isAudio();
	return !!ssd.description && ssd.description.numAudioChannels > 0;
}
var MP4Parser = class MP4Parser extends BasicParser {
	constructor() {
		super(...arguments);
		this.tracks = /* @__PURE__ */ new Map();
		this.hasVideoTrack = false;
		this.hasAudioTrack = true;
		this.atomParsers = {
			/**
			* Parse movie header (mvhd) atom
			* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap2/qtff2.html#//apple_ref/doc/uid/TP40000939-CH204-56313
			*/
			mvhd: async (len) => {
				const mvhd = await this.tokenizer.readToken(new MvhdAtom(len));
				this.metadata.setFormat("creationTime", mvhd.creationTime);
				this.metadata.setFormat("modificationTime", mvhd.modificationTime);
			},
			chap: async (len) => {
				const td = this.getTrackDescription();
				const trackIds = [];
				while (len >= UINT32_BE.len) {
					trackIds.push(await this.tokenizer.readNumber(UINT32_BE));
					len -= UINT32_BE.len;
				}
				td.chapterList = trackIds;
			},
			/**
			* Parse mdat atom.
			* Will scan for chapters
			*/
			mdat: async (len) => {
				if (this.options.includeChapters) {
					const trackWithChapters = [...this.tracks.values()].filter((track) => track.chapterList);
					if (trackWithChapters.length === 1) {
						const chapterTrackIds = trackWithChapters[0].chapterList;
						const chapterTracks = [...this.tracks.values()].filter((track) => chapterTrackIds.indexOf(track.header.trackId) !== -1);
						if (chapterTracks.length === 1) return this.parseChapterTrack(chapterTracks[0], trackWithChapters[0], len);
					}
				}
				await this.tokenizer.ignore(len);
			},
			ftyp: async (len) => {
				const types = [];
				while (len > 0) {
					const ftype = await this.tokenizer.readToken(ftyp);
					len -= ftyp.len;
					const value = ftype.type.replace(/\W/g, "");
					if (value.length > 0) types.push(value);
				}
				debug$11(`ftyp: ${types.join("/")}`);
				const x = types.filter(distinct).join("/");
				this.metadata.setFormat("container", x);
			},
			/**
			* Parse sample description atom
			*/
			stsd: async (len) => {
				const stsd = await this.tokenizer.readToken(new StsdAtom(len));
				const trackDescription = this.getTrackDescription();
				trackDescription.soundSampleDescription = stsd.table.map((dfEntry) => this.parseSoundSampleDescription(dfEntry));
			},
			/**
			* Parse sample-sizes atom ('stsz')
			*/
			stsz: async (len) => {
				const stsz = await this.tokenizer.readToken(new StszAtom(len));
				const td = this.getTrackDescription();
				td.sampleSize = stsz.sampleSize;
				td.sampleSizeTable = stsz.entries;
			},
			date: async (len) => {
				const date = await this.tokenizer.readToken(new StringType(len, "utf-8"));
				await this.addTag("date", date);
			}
		};
	}
	static read_BE_Integer(array, signed) {
		const integerType = (signed ? "INT" : "UINT") + array.length * 8 + (array.length > 1 ? "_BE" : "");
		const token = lib_exports$1[integerType];
		if (!token) throw new Mp4ContentError(`Token for integer type not found: "${integerType}"`);
		return Number(token.get(array, 0));
	}
	async parse() {
		this.hasVideoTrack = false;
		this.hasAudioTrack = true;
		this.tracks.clear();
		let remainingFileSize = this.tokenizer.fileInfo.size || 0;
		while (!this.tokenizer.fileInfo.size || remainingFileSize > 0) {
			try {
				if ((await this.tokenizer.peekToken(Header$3)).name === "\0\0\0\0") {
					const errMsg = `Error at offset=${this.tokenizer.position}: box.id=0`;
					debug$11(errMsg);
					this.addWarning(errMsg);
					break;
				}
			} catch (error) {
				if (error instanceof Error) {
					const errMsg = `Error at offset=${this.tokenizer.position}: ${error.message}`;
					debug$11(errMsg);
					this.addWarning(errMsg);
				} else throw error;
				break;
			}
			const rootAtom = await Atom.readAtom(this.tokenizer, (atom, remaining) => this.handleAtom(atom, remaining), null, remainingFileSize);
			remainingFileSize -= rootAtom.header.length === BigInt(0) ? remainingFileSize : Number(rootAtom.header.length);
		}
		const formatList = [];
		this.tracks.forEach((track) => {
			const trackFormats = [];
			const trackIsAudio = isAudioTrack(track);
			track.soundSampleDescription.forEach((ssd) => {
				const streamInfo = {};
				const encoderInfo = encoderDict[ssd.dataFormat];
				if (encoderInfo) {
					trackFormats.push(encoderInfo.format);
					streamInfo.codecName = encoderInfo.format;
				} else streamInfo.codecName = `<${ssd.dataFormat}>`;
				if (trackIsAudio && ssd.description) {
					const { description } = ssd;
					if (description.sampleRate > 0) {
						streamInfo.type = TrackType.audio;
						streamInfo.audio = {
							samplingFrequency: description.sampleRate,
							bitDepth: description.sampleSize,
							channels: description.numAudioChannels
						};
					}
				}
				this.metadata.addStreamInfo(streamInfo);
			});
			if (trackFormats.length >= 1) formatList.push(trackFormats.join("/"));
		});
		if (formatList.length > 0) this.metadata.setFormat("codec", formatList.filter(distinct).join("+"));
		const audioTracks = [...this.tracks.values()].filter(isAudioTrack);
		for (const audioTrack of audioTracks) {
			if (audioTrack.media.header && audioTrack.media.header.timeScale > 0) {
				audioTrack.sampleRate = audioTrack.media.header.timeScale;
				if (audioTrack.media.header.duration > 0) {
					debug$11("Using duration defined on audio track");
					audioTrack.samples = audioTrack.media.header.duration;
					audioTrack.duration = audioTrack.samples / audioTrack.sampleRate;
				}
				if (audioTrack.fragments.length > 0) {
					debug$11("Calculate duration defined in track fragments");
					let totalTimeUnits = 0;
					audioTrack.sizeInBytes = 0;
					for (const fragment of audioTrack.fragments) for (const sample of fragment.trackRun.samples) {
						const dur = sample.sampleDuration ?? fragment.header.defaultSampleDuration ?? 0;
						const size = sample.sampleSize ?? fragment.header.defaultSampleSize ?? 0;
						if (dur === 0) throw new Error("Missing sampleDuration and no defaultSampleDuration in track fragment header");
						if (size === 0) throw new Error("Missing sampleSize and no defaultSampleSize in track fragment header");
						totalTimeUnits += dur;
						audioTrack.sizeInBytes += size;
					}
					if (!audioTrack.samples) audioTrack.samples = totalTimeUnits;
					if (!audioTrack.duration) audioTrack.duration = totalTimeUnits / audioTrack.sampleRate;
				} else if (audioTrack.sampleSizeTable.length > 0) audioTrack.sizeInBytes = audioTrack.sampleSizeTable.reduce((sum, n) => sum + n, 0);
			}
			const ssd = audioTrack.soundSampleDescription[0];
			if (ssd.description && audioTrack.media.header) {
				this.metadata.setFormat("sampleRate", ssd.description.sampleRate);
				this.metadata.setFormat("bitsPerSample", ssd.description.sampleSize);
				this.metadata.setFormat("numberOfChannels", ssd.description.numAudioChannels);
				if (audioTrack.media.header.timeScale === 0 && audioTrack.timeToSampleTable.length > 0) audioTrack.duration = audioTrack.timeToSampleTable.map((ttstEntry) => ttstEntry.count * ttstEntry.duration).reduce((total, sampleSize) => total + sampleSize) / ssd.description.sampleRate;
			}
			const encoderInfo = encoderDict[ssd.dataFormat];
			if (encoderInfo) this.metadata.setFormat("lossless", !encoderInfo.lossy);
		}
		if (audioTracks.length >= 1) {
			const firstAudioTrack = audioTracks[0];
			if (firstAudioTrack.duration) {
				this.metadata.setFormat("duration", firstAudioTrack.duration);
				if (firstAudioTrack.sizeInBytes) this.metadata.setFormat("bitrate", 8 * firstAudioTrack.sizeInBytes / firstAudioTrack.duration);
			}
		}
		this.metadata.setFormat("hasAudio", this.hasAudioTrack);
		this.metadata.setFormat("hasVideo", this.hasVideoTrack);
	}
	async handleAtom(atom, remaining) {
		if (atom.parent) switch (atom.parent.header.name) {
			case "ilst":
			case "<id>": return this.parseMetadataItemData(atom);
			case "moov":
				switch (atom.header.name) {
					case "trak": return this.parseTrackBox(atom);
					case "udta": return this.parseTrackBox(atom);
				}
				break;
			case "moof": switch (atom.header.name) {
				case "traf": return this.parseTrackFragmentBox(atom);
			}
		}
		if (this.atomParsers[atom.header.name]) return this.atomParsers[atom.header.name](remaining);
		debug$11(`No parser for atom path=${atom.atomPath}, payload-len=${remaining}, ignoring atom`);
		await this.tokenizer.ignore(remaining);
	}
	getTrackDescription() {
		const tracks = [...this.tracks.values()];
		return tracks[tracks.length - 1];
	}
	async addTag(id, value) {
		await this.metadata.addTag(tagFormat, id, value);
	}
	addWarning(message) {
		debug$11(`Warning: ${message}`);
		this.metadata.addWarning(message);
	}
	/**
	* Parse data of Meta-item-list-atom (item of 'ilst' atom)
	* @param metaAtom
	* Ref: https://developer.apple.com/library/content/documentation/QuickTime/QTFF/Metadata/Metadata.html#//apple_ref/doc/uid/TP40000939-CH1-SW8
	*/
	parseMetadataItemData(metaAtom) {
		let tagKey = metaAtom.header.name;
		return metaAtom.readAtoms(this.tokenizer, async (child, remaining) => {
			const payLoadLength = child.getPayloadLength(remaining);
			switch (child.header.name) {
				case "data": return this.parseValueAtom(tagKey, child);
				case "name":
				case "mean":
				case "rate": {
					const name = await this.tokenizer.readToken(new NameAtom(payLoadLength));
					tagKey += `:${name.name}`;
					break;
				}
				default: {
					const uint8Array = await this.tokenizer.readToken(new Uint8ArrayType(payLoadLength));
					this.addWarning(`Unsupported meta-item: ${tagKey}[${child.header.name}] => value=${uint8ArrayToHex(uint8Array)} ascii=${textDecode(uint8Array, "ascii")}`);
				}
			}
		}, metaAtom.getPayloadLength(0));
	}
	async parseValueAtom(tagKey, metaAtom) {
		const dataAtom = await this.tokenizer.readToken(new DataAtom(Number(metaAtom.header.length) - Header$3.len));
		if (dataAtom.type.set !== 0) throw new Mp4ContentError(`Unsupported type-set != 0: ${dataAtom.type.set}`);
		switch (dataAtom.type.type) {
			case 0:
				switch (tagKey) {
					case "trkn":
					case "disk": {
						const num = UINT8.get(dataAtom.value, 3);
						const of = UINT8.get(dataAtom.value, 5);
						await this.addTag(tagKey, `${num}/${of}`);
						break;
					}
					case "gnre": {
						const genreStr = Genres[UINT8.get(dataAtom.value, 1) - 1];
						await this.addTag(tagKey, genreStr);
						break;
					}
					case "rate": {
						const rate = textDecode(dataAtom.value, "ascii");
						await this.addTag(tagKey, rate);
						break;
					}
					default: debug$11(`unknown proprietary value type for: ${metaAtom.atomPath}`);
				}
				break;
			case 1:
			case 18:
				await this.addTag(tagKey, textDecode(dataAtom.value));
				break;
			case 13:
				if (this.options.skipCovers) break;
				await this.addTag(tagKey, {
					format: "image/jpeg",
					data: Uint8Array.from(dataAtom.value)
				});
				break;
			case 14:
				if (this.options.skipCovers) break;
				await this.addTag(tagKey, {
					format: "image/png",
					data: Uint8Array.from(dataAtom.value)
				});
				break;
			case 21:
				await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, true));
				break;
			case 22:
				await this.addTag(tagKey, MP4Parser.read_BE_Integer(dataAtom.value, false));
				break;
			case 65:
				await this.addTag(tagKey, UINT8.get(dataAtom.value, 0));
				break;
			case 66:
				await this.addTag(tagKey, UINT16_BE.get(dataAtom.value, 0));
				break;
			case 67:
				await this.addTag(tagKey, UINT32_BE.get(dataAtom.value, 0));
				break;
			default: this.addWarning(`atom key=${tagKey}, has unknown well-known-type (data-type): ${dataAtom.type.type}`);
		}
	}
	async parseTrackBox(trakBox) {
		const track = {
			media: {},
			fragments: []
		};
		await trakBox.readAtoms(this.tokenizer, async (child, remaining) => {
			const payLoadLength = child.getPayloadLength(remaining);
			switch (child.header.name) {
				case "chap": {
					const chap = await this.tokenizer.readToken(new ChapterTrackReferenceBox(remaining));
					track.chapterList = chap;
					break;
				}
				case "tkhd":
					track.header = await this.tokenizer.readToken(new TrackHeaderAtom(payLoadLength));
					break;
				case "hdlr":
					track.handler = await this.tokenizer.readToken(new HandlerBox(payLoadLength));
					track.isAudio = () => track.handler.handlerType === "audi" || track.handler.handlerType === "soun";
					track.isVideo = () => track.handler.handlerType === "vide";
					if (track.isAudio()) this.hasAudioTrack = true;
					else if (track.isVideo()) this.hasVideoTrack = true;
					break;
				case "mdhd": {
					const mdhd_data = await this.tokenizer.readToken(new MdhdAtom(payLoadLength));
					track.media.header = mdhd_data;
					break;
				}
				case "stco": {
					const stco = await this.tokenizer.readToken(new StcoAtom(payLoadLength));
					track.chunkOffsetTable = stco.entries;
					break;
				}
				case "stsc": {
					const stsc = await this.tokenizer.readToken(new StscAtom(payLoadLength));
					track.sampleToChunkTable = stsc.entries;
					break;
				}
				case "stsd": {
					const stsd = await this.tokenizer.readToken(new StsdAtom(payLoadLength));
					track.soundSampleDescription = stsd.table.map((dfEntry) => this.parseSoundSampleDescription(dfEntry));
					break;
				}
				case "stts": {
					const stts = await this.tokenizer.readToken(new SttsAtom(payLoadLength));
					track.timeToSampleTable = stts.entries;
					break;
				}
				case "stsz": {
					const stsz = await this.tokenizer.readToken(new StszAtom(payLoadLength));
					track.sampleSize = stsz.sampleSize;
					track.sampleSizeTable = stsz.entries;
					break;
				}
				case "dinf":
				case "vmhd":
				case "smhd":
					debug$11(`Ignoring: ${child.header.name}`);
					await this.tokenizer.ignore(payLoadLength);
					break;
				default:
					debug$11(`Unexpected track box: ${child.header.name}`);
					await this.tokenizer.ignore(payLoadLength);
			}
		}, trakBox.getPayloadLength(0));
		this.tracks.set(track.header.trackId, track);
	}
	parseTrackFragmentBox(trafBox) {
		let tfhd;
		return trafBox.readAtoms(this.tokenizer, async (child, remaining) => {
			const payLoadLength = child.getPayloadLength(remaining);
			switch (child.header.name) {
				case "tfhd": {
					const fragmentHeaderBox = new TrackFragmentHeaderBox(child.getPayloadLength(remaining));
					tfhd = await this.tokenizer.readToken(fragmentHeaderBox);
					break;
				}
				case "tfdt":
					await this.tokenizer.ignore(payLoadLength);
					break;
				case "trun": {
					const trackRunBox = new TrackRunBox(payLoadLength);
					const trun = await this.tokenizer.readToken(trackRunBox);
					if (tfhd) this.tracks.get(tfhd.trackId)?.fragments.push({
						header: tfhd,
						trackRun: trun
					});
					break;
				}
				default:
					debug$11(`Unexpected box: ${child.header.name}`);
					await this.tokenizer.ignore(payLoadLength);
			}
		}, trafBox.getPayloadLength(0));
	}
	/**
	* @param sampleDescription
	* Ref: https://developer.apple.com/library/archive/documentation/QuickTime/QTFF/QTFFChap3/qtff3.html#//apple_ref/doc/uid/TP40000939-CH205-128916
	*/
	parseSoundSampleDescription(sampleDescription) {
		const ssd = {
			dataFormat: sampleDescription.dataFormat,
			dataReferenceIndex: sampleDescription.dataReferenceIndex
		};
		let offset = 0;
		const { description } = sampleDescription;
		if (description && description.length >= SoundSampleDescriptionVersion.len) {
			const version = SoundSampleDescriptionVersion.get(description, offset);
			offset += SoundSampleDescriptionVersion.len;
			if (version.version === 0 || version.version === 1) {
				if (description.length >= offset + SoundSampleDescriptionV0.len) ssd.description = SoundSampleDescriptionV0.get(description, offset);
				else debug$11(`Warning: sound-sample-description too short: ${description.length} bytes`);
			} else debug$11(`Warning: sound-sample-description ${version} not implemented`);
		}
		return ssd;
	}
	async parseChapterTrack(chapterTrack, track, len) {
		if (!chapterTrack.sampleSize) {
			if (chapterTrack.chunkOffsetTable.length !== chapterTrack.sampleSizeTable.length) throw new Error("Expected equal chunk-offset-table & sample-size-table length.");
		}
		const chapters = [];
		for (let i = 0; i < chapterTrack.chunkOffsetTable.length && len > 0; ++i) {
			const start = chapterTrack.timeToSampleTable.slice(0, i).reduce((acc, cur) => acc + cur.duration, 0);
			const nextChunkLen = chapterTrack.chunkOffsetTable[i] - this.tokenizer.position;
			const sampleSize = chapterTrack.sampleSize > 0 ? chapterTrack.sampleSize : chapterTrack.sampleSizeTable[i];
			len -= nextChunkLen + sampleSize;
			if (len < 0) throw new Mp4ContentError("Chapter chunk exceeding token length");
			await this.tokenizer.ignore(nextChunkLen);
			const title = await this.tokenizer.readToken(new ChapterText(sampleSize));
			debug$11(`Chapter ${i + 1}: ${title}`);
			const chapter = {
				title,
				timeScale: chapterTrack.media.header ? chapterTrack.media.header.timeScale : 0,
				start,
				sampleOffset: this.findSampleOffset(track, this.tokenizer.position)
			};
			debug$11(`Chapter title=${chapter.title}, offset=${chapter.sampleOffset}/${track.header.duration}`);
			chapters.push(chapter);
		}
		this.metadata.setFormat("chapters", chapters);
		await this.tokenizer.ignore(len);
	}
	findSampleOffset(track, chapterOffset) {
		let chunkIndex = 0;
		while (chunkIndex < track.chunkOffsetTable.length && track.chunkOffsetTable[chunkIndex] < chapterOffset) ++chunkIndex;
		return this.getChunkDuration(chunkIndex + 1, track);
	}
	getChunkDuration(chunkId, track) {
		let ttsi = 0;
		let ttsc = track.timeToSampleTable[ttsi].count;
		let ttsd = track.timeToSampleTable[ttsi].duration;
		let curChunkId = 1;
		let samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
		let totalDuration = 0;
		while (curChunkId < chunkId) {
			const nrOfSamples = Math.min(ttsc, samplesPerChunk);
			totalDuration += nrOfSamples * ttsd;
			ttsc -= nrOfSamples;
			samplesPerChunk -= nrOfSamples;
			if (samplesPerChunk === 0) {
				++curChunkId;
				samplesPerChunk = this.getSamplesPerChunk(curChunkId, track.sampleToChunkTable);
			} else {
				++ttsi;
				ttsc = track.timeToSampleTable[ttsi].count;
				ttsd = track.timeToSampleTable[ttsi].duration;
			}
		}
		return totalDuration;
	}
	getSamplesPerChunk(chunkId, stcTable) {
		for (let i = 0; i < stcTable.length - 1; ++i) if (chunkId >= stcTable[i].firstChunk && chunkId < stcTable[i + 1].firstChunk) return stcTable[i].samplesPerChunk;
		return stcTable[stcTable.length - 1].samplesPerChunk;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/ReplayGainDataFormat.js
/**
* Replay Gain Data Format
*
* https://github.com/Borewit/music-metadata/wiki/Replay-Gain-Data-Format
*/
var ReplayGain = {
	len: 2,
	get: (buf, off) => {
		const gain_type = getBitAllignedNumber$1(buf, off, 0, 3);
		const sign = getBitAllignedNumber$1(buf, off, 6, 1);
		const gain_adj = getBitAllignedNumber$1(buf, off, 7, 9) / 10;
		if (gain_type > 0) return {
			type: getBitAllignedNumber$1(buf, off, 0, 3),
			origin: getBitAllignedNumber$1(buf, off, 3, 3),
			adjustment: sign ? -gain_adj : gain_adj
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/ExtendedLameHeader.js
/**
* Extended Lame Header
*/
/**
* Info Tag
* @link http://gabriel.mp3-tech.org/mp3infotag.html
* @link https://github.com/quodlibet/mutagen/blob/abd58ee58772224334a18817c3fb31103572f70e/mutagen/mp3/_util.py#L112
*/
var ExtendedLameHeader = {
	len: 27,
	get: (buf, off) => {
		const track_peak = UINT32_BE.get(buf, off + 2);
		return {
			revision: getBitAllignedNumber$1(buf, off, 0, 4),
			vbr_method: getBitAllignedNumber$1(buf, off, 4, 4),
			lowpass_filter: 100 * UINT8.get(buf, off + 1),
			track_peak: track_peak === 0 ? null : track_peak / 2 ** 23,
			track_gain: ReplayGain.get(buf, 6),
			album_gain: ReplayGain.get(buf, 8),
			music_length: UINT32_BE.get(buf, off + 20),
			music_crc: UINT8.get(buf, off + 24),
			header_crc: UINT16_BE.get(buf, off + 24)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/mpeg/XingTag.js
/**
* Info Tag: Xing, LAME
*/
var InfoTagHeaderTag = new StringType(4, "ascii");
/**
* LAME TAG value
* Did not find any official documentation for this
* Value e.g.: "3.98.4"
*/
var LameEncoderVersion = new StringType(6, "ascii");
/**
* Info Tag
* Ref: http://gabriel.mp3-tech.org/mp3infotag.html
*/
var XingHeaderFlags = {
	len: 4,
	get: (buf, off) => {
		return {
			frames: isBitSet$2(buf, off, 31),
			bytes: isBitSet$2(buf, off, 30),
			toc: isBitSet$2(buf, off, 29),
			vbrScale: isBitSet$2(buf, off, 28)
		};
	}
};
async function readXingHeader(tokenizer) {
	const flags = await tokenizer.readToken(XingHeaderFlags);
	const xingInfoTag = {
		numFrames: null,
		streamSize: null,
		vbrScale: null
	};
	if (flags.frames) xingInfoTag.numFrames = await tokenizer.readToken(UINT32_BE);
	if (flags.bytes) xingInfoTag.streamSize = await tokenizer.readToken(UINT32_BE);
	if (flags.toc) {
		xingInfoTag.toc = /* @__PURE__ */ new Uint8Array(100);
		await tokenizer.readBuffer(xingInfoTag.toc);
	}
	if (flags.vbrScale) xingInfoTag.vbrScale = await tokenizer.readToken(UINT32_BE);
	if (await tokenizer.peekToken(new StringType(4, "ascii")) === "LAME") {
		await tokenizer.ignore(4);
		xingInfoTag.lame = { version: await tokenizer.readToken(new StringType(5, "ascii")) };
		const match = xingInfoTag.lame.version.match(/\d+.\d+/g);
		if (match !== null) {
			const version = match[0].split(".").map((n) => Number.parseInt(n, 10));
			if (version[0] >= 3 && version[1] >= 90) xingInfoTag.lame.extended = await tokenizer.readToken(ExtendedLameHeader);
		}
	}
	return xingInfoTag;
}
//#endregion
//#region node_modules/music-metadata/lib/mpeg/MpegParser.js
var MpegParser_exports = /* @__PURE__ */ __exportAll({
	MpegContentError: () => MpegContentError,
	MpegParser: () => MpegParser
});
var debug$10 = (0, import_src.default)("music-metadata:parser:mpeg");
var MpegContentError = class extends makeUnexpectedFileContentError("MPEG") {};
/**
* Cache buffer size used for searching synchronization preabmle
*/
var maxPeekLen = 1024;
/**
* MPEG-4 Audio definitions
* Ref:  https://wiki.multimedia.cx/index.php/MPEG-4_Audio
*/
var MPEG4 = {
	/**
	* Audio Object Types
	*/
	AudioObjectTypes: [
		"AAC Main",
		"AAC LC",
		"AAC SSR",
		"AAC LTP"
	],
	/**
	* Sampling Frequencies
	* https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Sampling_Frequencies
	*/
	SamplingFrequencies: [
		96e3,
		88200,
		64e3,
		48e3,
		44100,
		32e3,
		24e3,
		22050,
		16e3,
		12e3,
		11025,
		8e3,
		7350,
		null,
		null,
		null
	]
};
var MPEG4_ChannelConfigurations = [
	void 0,
	["front-center"],
	["front-left", "front-right"],
	[
		"front-center",
		"front-left",
		"front-right"
	],
	[
		"front-center",
		"front-left",
		"front-right",
		"back-center"
	],
	[
		"front-center",
		"front-left",
		"front-right",
		"back-left",
		"back-right"
	],
	[
		"front-center",
		"front-left",
		"front-right",
		"back-left",
		"back-right",
		"LFE-channel"
	],
	[
		"front-center",
		"front-left",
		"front-right",
		"side-left",
		"side-right",
		"back-left",
		"back-right",
		"LFE-channel"
	]
];
/**
* MPEG Audio Layer I/II/III frame header
* Ref: https://www.mp3-tech.org/programmer/frame_header.html
* Bit layout: AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM
* Ref: https://wiki.multimedia.cx/index.php/ADTS
*/
var MpegFrameHeader = class MpegFrameHeader {
	constructor(buf, off) {
		this.bitrateIndex = null;
		this.sampRateFreqIndex = null;
		this.padding = null;
		this.privateBit = null;
		this.channelModeIndex = null;
		this.modeExtension = null;
		this.isOriginalMedia = null;
		this.version = null;
		this.bitrate = null;
		this.samplingRate = null;
		this.frameLength = 0;
		this.versionIndex = getBitAllignedNumber$1(buf, off + 1, 3, 2);
		this.layer = MpegFrameHeader.LayerDescription[getBitAllignedNumber$1(buf, off + 1, 5, 2)];
		if (this.versionIndex > 1 && this.layer === 0) this.parseAdtsHeader(buf, off);
		else this.parseMpegHeader(buf, off);
		this.isProtectedByCRC = !isBitSet$2(buf, off + 1, 7);
	}
	calcDuration(numFrames) {
		return this.samplingRate == null ? null : numFrames * this.calcSamplesPerFrame() / this.samplingRate;
	}
	calcSamplesPerFrame() {
		return MpegFrameHeader.samplesInFrameTable[this.version === 1 ? 0 : 1][this.layer];
	}
	calculateSideInfoLength() {
		if (this.layer !== 3) return 2;
		if (this.channelModeIndex === 3) {
			if (this.version === 1) return 17;
			if (this.version === 2 || this.version === 2.5) return 9;
		} else {
			if (this.version === 1) return 32;
			if (this.version === 2 || this.version === 2.5) return 17;
		}
		return null;
	}
	calcSlotSize() {
		return [
			null,
			4,
			1,
			1
		][this.layer];
	}
	parseMpegHeader(buf, off) {
		this.container = "MPEG";
		this.bitrateIndex = getBitAllignedNumber$1(buf, off + 2, 0, 4);
		this.sampRateFreqIndex = getBitAllignedNumber$1(buf, off + 2, 4, 2);
		this.padding = isBitSet$2(buf, off + 2, 6);
		this.privateBit = isBitSet$2(buf, off + 2, 7);
		this.channelModeIndex = getBitAllignedNumber$1(buf, off + 3, 0, 2);
		this.modeExtension = getBitAllignedNumber$1(buf, off + 3, 2, 2);
		this.isCopyrighted = isBitSet$2(buf, off + 3, 4);
		this.isOriginalMedia = isBitSet$2(buf, off + 3, 5);
		this.emphasis = getBitAllignedNumber$1(buf, off + 3, 7, 2);
		this.version = MpegFrameHeader.VersionID[this.versionIndex];
		this.channelMode = MpegFrameHeader.ChannelMode[this.channelModeIndex];
		this.codec = `MPEG ${this.version} Layer ${this.layer}`;
		const bitrateInKbps = this.calcBitrate();
		if (!bitrateInKbps) throw new MpegContentError("Cannot determine bit-rate");
		this.bitrate = bitrateInKbps * 1e3;
		this.samplingRate = this.calcSamplingRate();
		if (this.samplingRate == null) throw new MpegContentError("Cannot determine sampling-rate");
	}
	parseAdtsHeader(buf, off) {
		debug$10("layer=0 => ADTS");
		this.version = this.versionIndex === 2 ? 4 : 2;
		this.container = `ADTS/MPEG-${this.version}`;
		const profileIndex = getBitAllignedNumber$1(buf, off + 2, 0, 2);
		this.codec = "AAC";
		this.codecProfile = MPEG4.AudioObjectTypes[profileIndex];
		debug$10(`MPEG-4 audio-codec=${this.codec}`);
		const samplingFrequencyIndex = getBitAllignedNumber$1(buf, off + 2, 2, 4);
		this.samplingRate = MPEG4.SamplingFrequencies[samplingFrequencyIndex];
		debug$10(`sampling-rate=${this.samplingRate}`);
		const channelIndex = getBitAllignedNumber$1(buf, off + 2, 7, 3);
		this.mp4ChannelConfig = MPEG4_ChannelConfigurations[channelIndex];
		debug$10(`channel-config=${this.mp4ChannelConfig ? this.mp4ChannelConfig.join("+") : "?"}`);
		this.frameLength = getBitAllignedNumber$1(buf, off + 3, 6, 2) << 11;
	}
	calcBitrate() {
		if (this.bitrateIndex === 0 || this.bitrateIndex === 15) return null;
		if (this.version && this.bitrateIndex) {
			const codecIndex = 10 * Math.floor(this.version) + this.layer;
			return MpegFrameHeader.bitrate_index[this.bitrateIndex][codecIndex];
		}
		return null;
	}
	calcSamplingRate() {
		if (this.sampRateFreqIndex === 3 || this.version === null || this.sampRateFreqIndex == null) return null;
		return MpegFrameHeader.sampling_rate_freq_index[this.version][this.sampRateFreqIndex];
	}
};
MpegFrameHeader.SyncByte1 = 255;
MpegFrameHeader.SyncByte2 = 224;
MpegFrameHeader.VersionID = [
	2.5,
	null,
	2,
	1
];
MpegFrameHeader.LayerDescription = [
	0,
	3,
	2,
	1
];
MpegFrameHeader.ChannelMode = [
	"stereo",
	"joint_stereo",
	"dual_channel",
	"mono"
];
MpegFrameHeader.bitrate_index = {
	1: {
		11: 32,
		12: 32,
		13: 32,
		21: 32,
		22: 8,
		23: 8
	},
	2: {
		11: 64,
		12: 48,
		13: 40,
		21: 48,
		22: 16,
		23: 16
	},
	3: {
		11: 96,
		12: 56,
		13: 48,
		21: 56,
		22: 24,
		23: 24
	},
	4: {
		11: 128,
		12: 64,
		13: 56,
		21: 64,
		22: 32,
		23: 32
	},
	5: {
		11: 160,
		12: 80,
		13: 64,
		21: 80,
		22: 40,
		23: 40
	},
	6: {
		11: 192,
		12: 96,
		13: 80,
		21: 96,
		22: 48,
		23: 48
	},
	7: {
		11: 224,
		12: 112,
		13: 96,
		21: 112,
		22: 56,
		23: 56
	},
	8: {
		11: 256,
		12: 128,
		13: 112,
		21: 128,
		22: 64,
		23: 64
	},
	9: {
		11: 288,
		12: 160,
		13: 128,
		21: 144,
		22: 80,
		23: 80
	},
	10: {
		11: 320,
		12: 192,
		13: 160,
		21: 160,
		22: 96,
		23: 96
	},
	11: {
		11: 352,
		12: 224,
		13: 192,
		21: 176,
		22: 112,
		23: 112
	},
	12: {
		11: 384,
		12: 256,
		13: 224,
		21: 192,
		22: 128,
		23: 128
	},
	13: {
		11: 416,
		12: 320,
		13: 256,
		21: 224,
		22: 144,
		23: 144
	},
	14: {
		11: 448,
		12: 384,
		13: 320,
		21: 256,
		22: 160,
		23: 160
	}
};
MpegFrameHeader.sampling_rate_freq_index = {
	1: {
		0: 44100,
		1: 48e3,
		2: 32e3
	},
	2: {
		0: 22050,
		1: 24e3,
		2: 16e3
	},
	2.5: {
		0: 11025,
		1: 12e3,
		2: 8e3
	}
};
MpegFrameHeader.samplesInFrameTable = [[
	0,
	384,
	1152,
	1152
], [
	0,
	384,
	1152,
	576
]];
/**
* MPEG Audio Layer I/II/III
*/
var FrameHeader = {
	len: 4,
	get: (buf, off) => {
		return new MpegFrameHeader(buf, off);
	}
};
function getVbrCodecProfile(vbrScale) {
	return `V${Math.floor((100 - vbrScale) / 10)}`;
}
var MpegParser = class extends AbstractID3Parser {
	constructor() {
		super(...arguments);
		this.frameCount = 0;
		this.syncFrameCount = -1;
		this.totalDataLength = 0;
		this.bitrates = [];
		this.offset = 0;
		this.frame_size = 0;
		this.calculateEofDuration = false;
		this.samplesPerFrame = null;
		this.buf_frame_header = /* @__PURE__ */ new Uint8Array(4);
		/**
		* Number of bytes already parsed since beginning of stream / file
		*/
		this.mpegOffset = null;
		this.syncPeek = {
			buf: new Uint8Array(maxPeekLen),
			len: 0
		};
	}
	/**
	* Called after ID3 headers have been parsed
	*/
	async postId3v2Parse() {
		this.metadata.setFormat("lossless", false);
		this.metadata.setAudioOnly();
		try {
			let quit = false;
			while (!quit) {
				await this.sync();
				quit = await this.parseCommonMpegHeader();
			}
		} catch (err) {
			if (err instanceof EndOfStreamError) {
				debug$10("End-of-stream");
				if (this.calculateEofDuration) {
					if (this.samplesPerFrame !== null) {
						const numberOfSamples = this.frameCount * this.samplesPerFrame;
						this.metadata.setFormat("numberOfSamples", numberOfSamples);
						if (this.metadata.format.sampleRate) {
							const duration = numberOfSamples / this.metadata.format.sampleRate;
							debug$10(`Calculate duration at EOF: ${duration} sec.`, duration);
							this.metadata.setFormat("duration", duration);
						}
					}
				}
			} else throw err;
		}
	}
	/**
	* Called after file has been fully parsed, this allows, if present, to exclude the ID3v1.1 header length
	*/
	finalize() {
		const format = this.metadata.format;
		const hasID3v1 = !!this.metadata.native.ID3v1;
		if (this.mpegOffset !== null) {
			if (format.duration && this.tokenizer.fileInfo.size) {
				const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
				if (format.codecProfile && format.codecProfile[0] === "V") this.metadata.setFormat("bitrate", mpegSize * 8 / format.duration);
			}
			if (this.tokenizer.fileInfo.size && format.codecProfile === "CBR") {
				const mpegSize = this.tokenizer.fileInfo.size - this.mpegOffset - (hasID3v1 ? 128 : 0);
				if (this.frame_size !== null && this.samplesPerFrame !== null) {
					const numberOfSamples = Math.round(mpegSize / this.frame_size) * this.samplesPerFrame;
					this.metadata.setFormat("numberOfSamples", numberOfSamples);
					if (format.sampleRate && !format.duration) {
						const duration = numberOfSamples / format.sampleRate;
						debug$10("Calculate CBR duration based on file size: %s", duration);
						this.metadata.setFormat("duration", duration);
					}
				}
			}
		}
	}
	async sync() {
		let gotFirstSync = false;
		while (true) {
			let bo = 0;
			this.syncPeek.len = await this.tokenizer.peekBuffer(this.syncPeek.buf, {
				length: maxPeekLen,
				mayBeLess: true
			});
			if (this.syncPeek.len <= 163) throw new EndOfStreamError();
			while (true) {
				if (gotFirstSync && (this.syncPeek.buf[bo] & 224) === 224) {
					this.buf_frame_header[0] = MpegFrameHeader.SyncByte1;
					this.buf_frame_header[1] = this.syncPeek.buf[bo];
					await this.tokenizer.ignore(bo);
					debug$10(`Sync at offset=${this.tokenizer.position - 1}, frameCount=${this.frameCount}`);
					if (this.syncFrameCount === this.frameCount) {
						debug$10(`Re-synced MPEG stream, frameCount=${this.frameCount}`);
						this.frameCount = 0;
						this.frame_size = 0;
					}
					this.syncFrameCount = this.frameCount;
					return;
				}
				gotFirstSync = false;
				bo = this.syncPeek.buf.indexOf(MpegFrameHeader.SyncByte1, bo);
				if (bo === -1) {
					if (this.syncPeek.len < this.syncPeek.buf.length) throw new EndOfStreamError();
					await this.tokenizer.ignore(this.syncPeek.len);
					break;
				}
				++bo;
				gotFirstSync = true;
			}
		}
	}
	/**
	* Combined ADTS & MPEG (MP2 & MP3) header handling
	* @return {Promise<boolean>} true if parser should quit
	*/
	async parseCommonMpegHeader() {
		if (this.frameCount === 0) this.mpegOffset = this.tokenizer.position - 1;
		await this.tokenizer.peekBuffer(this.buf_frame_header.subarray(1), { length: 3 });
		let header;
		try {
			header = FrameHeader.get(this.buf_frame_header, 0);
		} catch (err) {
			await this.tokenizer.ignore(1);
			if (err instanceof Error) {
				this.metadata.addWarning(`Parse error: ${err.message}`);
				return false;
			}
			throw err;
		}
		await this.tokenizer.ignore(3);
		this.metadata.setFormat("container", header.container);
		this.metadata.setFormat("codec", header.codec);
		this.metadata.setFormat("lossless", false);
		this.metadata.setFormat("sampleRate", header.samplingRate);
		this.frameCount++;
		return header.version !== null && header.version >= 2 && header.layer === 0 ? this.parseAdts(header) : this.parseAudioFrameHeader(header);
	}
	/**
	* @return {Promise<boolean>} true if parser should quit
	*/
	async parseAudioFrameHeader(header) {
		this.metadata.setFormat("numberOfChannels", header.channelMode === "mono" ? 1 : 2);
		this.metadata.setFormat("bitrate", header.bitrate);
		if (this.frameCount < 2e5) debug$10("offset=%s MP%s bitrate=%s sample-rate=%s", this.tokenizer.position - 4, header.layer, header.bitrate, header.samplingRate);
		const slot_size = header.calcSlotSize();
		if (slot_size === null) throw new MpegContentError("invalid slot_size");
		const samples_per_frame = header.calcSamplesPerFrame();
		debug$10(`samples_per_frame=${samples_per_frame}`);
		const bps = samples_per_frame / 8;
		if (header.bitrate !== null && header.samplingRate != null) {
			const fsize = bps * header.bitrate / header.samplingRate + (header.padding ? slot_size : 0);
			this.frame_size = Math.floor(fsize);
		}
		this.audioFrameHeader = header;
		if (header.bitrate !== null) this.bitrates.push(header.bitrate);
		if (this.frameCount === 1) {
			this.offset = FrameHeader.len;
			await this.skipSideInformation();
			return false;
		}
		if (this.frameCount === 4) {
			if (this.areAllSame(this.bitrates)) {
				this.samplesPerFrame = samples_per_frame;
				this.metadata.setFormat("codecProfile", "CBR");
				if (this.tokenizer.fileInfo.size) return true;
			} else if (this.metadata.format.duration) return true;
			if (!this.options.duration) return true;
		}
		if (this.options.duration && this.frameCount === 4) {
			this.samplesPerFrame = samples_per_frame;
			this.calculateEofDuration = true;
		}
		this.offset = 4;
		if (header.isProtectedByCRC) {
			await this.parseCrc();
			return false;
		}
		await this.skipSideInformation();
		return false;
	}
	async parseAdts(header) {
		const buf = /* @__PURE__ */ new Uint8Array(3);
		await this.tokenizer.readBuffer(buf);
		header.frameLength += getBitAllignedNumber$1(buf, 0, 0, 11);
		this.totalDataLength += header.frameLength;
		this.samplesPerFrame = 1024;
		if (header.samplingRate !== null) {
			const framesPerSec = header.samplingRate / this.samplesPerFrame;
			const bitrate = 8 * (this.frameCount === 0 ? 0 : this.totalDataLength / this.frameCount) * framesPerSec + .5;
			this.metadata.setFormat("bitrate", bitrate);
			debug$10(`frame-count=${this.frameCount}, size=${header.frameLength} bytes, bit-rate=${bitrate}`);
		}
		await this.tokenizer.ignore(header.frameLength > 7 ? header.frameLength - 7 : 1);
		if (this.frameCount === 3) {
			this.metadata.setFormat("codecProfile", header.codecProfile);
			if (header.mp4ChannelConfig) this.metadata.setFormat("numberOfChannels", header.mp4ChannelConfig.length);
			if (this.options.duration) this.calculateEofDuration = true;
			else return true;
		}
		return false;
	}
	async parseCrc() {
		await this.tokenizer.ignore(INT16_BE.len);
		this.offset += INT16_BE.len;
		return this.skipSideInformation();
	}
	async skipSideInformation() {
		if (this.audioFrameHeader) {
			const sideinfo_length = this.audioFrameHeader.calculateSideInfoLength();
			if (sideinfo_length !== null) {
				await this.tokenizer.readToken(new Uint8ArrayType(sideinfo_length));
				this.offset += sideinfo_length;
				await this.readXtraInfoHeader();
				return;
			}
		}
	}
	async readXtraInfoHeader() {
		const headerTag = await this.tokenizer.readToken(InfoTagHeaderTag);
		this.offset += InfoTagHeaderTag.len;
		switch (headerTag) {
			case "Info":
				this.metadata.setFormat("codecProfile", "CBR");
				return this.readXingInfoHeader();
			case "Xing": {
				const infoTag = await this.readXingInfoHeader();
				if (infoTag.vbrScale !== null) {
					const codecProfile = getVbrCodecProfile(infoTag.vbrScale);
					this.metadata.setFormat("codecProfile", codecProfile);
				}
				return null;
			}
			case "Xtra": break;
			case "LAME": {
				const version = await this.tokenizer.readToken(LameEncoderVersion);
				if (this.frame_size !== null && this.frame_size >= this.offset + LameEncoderVersion.len) {
					this.offset += LameEncoderVersion.len;
					this.metadata.setFormat("tool", `LAME ${version}`);
					await this.skipFrameData(this.frame_size - this.offset);
					return null;
				}
				this.metadata.addWarning("Corrupt LAME header");
				break;
			}
		}
		const frameDataLeft = this.frame_size - this.offset;
		if (frameDataLeft < 0) this.metadata.addWarning(`Frame ${this.frameCount}corrupt: negative frameDataLeft`);
		else await this.skipFrameData(frameDataLeft);
		return null;
	}
	/**
	* Ref: http://gabriel.mp3-tech.org/mp3infotag.html
	* @returns {Promise<string>}
	*/
	async readXingInfoHeader() {
		const offset = this.tokenizer.position;
		const infoTag = await readXingHeader(this.tokenizer);
		this.offset += this.tokenizer.position - offset;
		if (infoTag.lame) {
			this.metadata.setFormat("tool", `LAME ${stripNulls(infoTag.lame.version)}`);
			if (infoTag.lame.extended) {
				this.metadata.setFormat("trackPeakLevel", infoTag.lame.extended.track_peak);
				if (infoTag.lame.extended.track_gain) this.metadata.setFormat("trackGain", infoTag.lame.extended.track_gain.adjustment);
				if (infoTag.lame.extended.album_gain) this.metadata.setFormat("albumGain", infoTag.lame.extended.album_gain.adjustment);
				this.metadata.setFormat("duration", infoTag.lame.extended.music_length / 1e3);
			}
		}
		if (infoTag.streamSize && this.audioFrameHeader && infoTag.numFrames !== null) {
			const duration = this.audioFrameHeader.calcDuration(infoTag.numFrames);
			this.metadata.setFormat("duration", duration);
			debug$10("Get duration from Xing header: %s", this.metadata.format.duration);
			return infoTag;
		}
		const frameDataLeft = this.frame_size - this.offset;
		await this.skipFrameData(frameDataLeft);
		return infoTag;
	}
	async skipFrameData(frameDataLeft) {
		if (frameDataLeft < 0) throw new MpegContentError("frame-data-left cannot be negative");
		await this.tokenizer.ignore(frameDataLeft);
	}
	areAllSame(array) {
		const first = array[0];
		return array.every((element) => {
			return element === first;
		});
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv8/StreamVersion8.js
var debug$9 = (0, import_src.default)("music-metadata:parser:musepack:sv8");
var PacketKey = new StringType(2, "latin1");
/**
* Stream Header Packet part 1
* Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
*/
var SH_part1 = {
	len: 5,
	get: (buf, off) => {
		return {
			crc: UINT32_LE.get(buf, off),
			streamVersion: UINT8.get(buf, off + 4)
		};
	}
};
/**
* Stream Header Packet part 3
* Ref: http://trac.musepack.net/musepack/wiki/SV8Specification#StreamHeaderPacket
*/
var SH_part3 = {
	len: 2,
	get: (buf, off) => {
		return {
			sampleFrequency: [
				44100,
				48e3,
				37800,
				32e3
			][getBitAllignedNumber$1(buf, off, 0, 3)],
			maxUsedBands: getBitAllignedNumber$1(buf, off, 3, 5),
			channelCount: getBitAllignedNumber$1(buf, off + 1, 0, 4) + 1,
			msUsed: isBitSet$2(buf, off + 1, 4),
			audioBlockFrames: getBitAllignedNumber$1(buf, off + 1, 5, 3)
		};
	}
};
var StreamReader = class {
	get tokenizer() {
		return this._tokenizer;
	}
	set tokenizer(value) {
		this._tokenizer = value;
	}
	constructor(_tokenizer) {
		this._tokenizer = _tokenizer;
	}
	async readPacketHeader() {
		const key = await this.tokenizer.readToken(PacketKey);
		const size = await this.readVariableSizeField();
		return {
			key,
			payloadLength: size.value - 2 - size.len
		};
	}
	async readStreamHeader(size) {
		const streamHeader = {};
		debug$9(`Reading SH at offset=${this.tokenizer.position}`);
		const part1 = await this.tokenizer.readToken(SH_part1);
		size -= SH_part1.len;
		Object.assign(streamHeader, part1);
		debug$9(`SH.streamVersion = ${part1.streamVersion}`);
		const sampleCount = await this.readVariableSizeField();
		size -= sampleCount.len;
		streamHeader.sampleCount = sampleCount.value;
		const bs = await this.readVariableSizeField();
		size -= bs.len;
		streamHeader.beginningOfSilence = bs.value;
		const part3 = await this.tokenizer.readToken(SH_part3);
		size -= SH_part3.len;
		Object.assign(streamHeader, part3);
		await this.tokenizer.ignore(size);
		return streamHeader;
	}
	async readVariableSizeField(len = 1, hb = 0) {
		let n = await this.tokenizer.readNumber(UINT8);
		if ((n & 128) === 0) return {
			len,
			value: hb + n
		};
		n &= 127;
		n += hb;
		return this.readVariableSizeField(len + 1, n << 7);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackConentError.js
var MusepackContentError = class extends makeUnexpectedFileContentError("Musepack") {};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv8/MpcSv8Parser.js
var debug$8 = (0, import_src.default)("music-metadata:parser:musepack");
var MpcSv8Parser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.audioLength = 0;
	}
	async parse() {
		if (await this.tokenizer.readToken(FourCcToken) !== "MPCK") throw new MusepackContentError("Invalid Magic number");
		this.metadata.setFormat("container", "Musepack, SV8");
		return this.parsePacket();
	}
	async parsePacket() {
		const sv8reader = new StreamReader(this.tokenizer);
		do {
			const header = await sv8reader.readPacketHeader();
			debug$8(`packet-header key=${header.key}, payloadLength=${header.payloadLength}`);
			switch (header.key) {
				case "SH": {
					const sh = await sv8reader.readStreamHeader(header.payloadLength);
					this.metadata.setFormat("numberOfSamples", sh.sampleCount);
					this.metadata.setFormat("sampleRate", sh.sampleFrequency);
					this.metadata.setFormat("duration", sh.sampleCount / sh.sampleFrequency);
					this.metadata.setFormat("numberOfChannels", sh.channelCount);
					break;
				}
				case "AP":
					this.audioLength += header.payloadLength;
					await this.tokenizer.ignore(header.payloadLength);
					break;
				case "RG":
				case "EI":
				case "SO":
				case "ST":
				case "CT":
					await this.tokenizer.ignore(header.payloadLength);
					break;
				case "SE":
					if (this.metadata.format.duration) this.metadata.setFormat("bitrate", this.audioLength * 8 / this.metadata.format.duration);
					return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
				default: throw new MusepackContentError(`Unexpected header: ${header.key}`);
			}
		} while (true);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/BitReader.js
var BitReader = class {
	constructor(tokenizer) {
		this.pos = 0;
		this.dword = null;
		this.tokenizer = tokenizer;
	}
	/**
	*
	* @param bits 1..30 bits
	*/
	async read(bits) {
		while (this.dword === null) this.dword = await this.tokenizer.readToken(UINT32_LE);
		let out = this.dword;
		this.pos += bits;
		if (this.pos < 32) {
			out >>>= 32 - this.pos;
			return out & (1 << bits) - 1;
		}
		this.pos -= 32;
		if (this.pos === 0) {
			this.dword = null;
			return out & (1 << bits) - 1;
		}
		this.dword = await this.tokenizer.readToken(UINT32_LE);
		if (this.pos) {
			out <<= this.pos;
			out |= this.dword >>> 32 - this.pos;
		}
		return out & (1 << bits) - 1;
	}
	async ignore(bits) {
		if (this.pos > 0) {
			const remaining = 32 - this.pos;
			this.dword = null;
			bits -= remaining;
			this.pos = 0;
		}
		const remainder = bits % 32;
		const numOfWords = (bits - remainder) / 32;
		await this.tokenizer.ignore(numOfWords * 4);
		return this.read(remainder);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/StreamVersion7.js
/**
* BASIC STRUCTURE
*/
var Header$2 = {
	len: 24,
	get: (buf, off) => {
		const header = {
			signature: textDecode(buf.subarray(off, off + 3), "latin1"),
			streamMinorVersion: getBitAllignedNumber$1(buf, off + 3, 0, 4),
			streamMajorVersion: getBitAllignedNumber$1(buf, off + 3, 4, 4),
			frameCount: UINT32_LE.get(buf, off + 4),
			maxLevel: UINT16_LE.get(buf, off + 8),
			sampleFrequency: [
				44100,
				48e3,
				37800,
				32e3
			][getBitAllignedNumber$1(buf, off + 10, 0, 2)],
			link: getBitAllignedNumber$1(buf, off + 10, 2, 2),
			profile: getBitAllignedNumber$1(buf, off + 10, 4, 4),
			maxBand: getBitAllignedNumber$1(buf, off + 11, 0, 6),
			intensityStereo: isBitSet$2(buf, off + 11, 6),
			midSideStereo: isBitSet$2(buf, off + 11, 7),
			titlePeak: UINT16_LE.get(buf, off + 12),
			titleGain: UINT16_LE.get(buf, off + 14),
			albumPeak: UINT16_LE.get(buf, off + 16),
			albumGain: UINT16_LE.get(buf, off + 18),
			lastFrameLength: UINT32_LE.get(buf, off + 20) >>> 20 & 2047,
			trueGapless: isBitSet$2(buf, off + 23, 0)
		};
		header.lastFrameLength = header.trueGapless ? UINT32_LE.get(buf, 20) >>> 20 & 2047 : 0;
		return header;
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/sv7/MpcSv7Parser.js
var debug$7 = (0, import_src.default)("music-metadata:parser:musepack");
var MpcSv7Parser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.bitreader = null;
		this.audioLength = 0;
		this.duration = null;
	}
	async parse() {
		const header = await this.tokenizer.readToken(Header$2);
		if (header.signature !== "MP+") throw new MusepackContentError("Unexpected magic number");
		debug$7(`stream-version=${header.streamMajorVersion}.${header.streamMinorVersion}`);
		this.metadata.setFormat("container", "Musepack, SV7");
		this.metadata.setFormat("sampleRate", header.sampleFrequency);
		const numberOfSamples = 1152 * (header.frameCount - 1) + header.lastFrameLength;
		this.metadata.setFormat("numberOfSamples", numberOfSamples);
		this.duration = numberOfSamples / header.sampleFrequency;
		this.metadata.setFormat("duration", this.duration);
		this.bitreader = new BitReader(this.tokenizer);
		this.metadata.setFormat("numberOfChannels", header.midSideStereo || header.intensityStereo ? 2 : 1);
		const version = await this.bitreader.read(8);
		this.metadata.setFormat("codec", (version / 100).toFixed(2));
		await this.skipAudioData(header.frameCount);
		debug$7(`End of audio stream, switching to APEv2, offset=${this.tokenizer.position}`);
		return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
	}
	async skipAudioData(frameCount) {
		while (frameCount-- > 0) {
			const frameLength = await this.bitreader.read(20);
			this.audioLength += 20 + frameLength;
			await this.bitreader.ignore(frameLength);
		}
		const lastFrameLength = await this.bitreader.read(11);
		this.audioLength += lastFrameLength;
		if (this.duration !== null) this.metadata.setFormat("bitrate", this.audioLength / this.duration);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/musepack/MusepackParser.js
var MusepackParser_exports = /* @__PURE__ */ __exportAll({ MusepackParser: () => MusepackParser });
var debug$6 = (0, import_src.default)("music-metadata:parser:musepack");
var MusepackParser = class extends AbstractID3Parser {
	async postId3v2Parse() {
		const signature = await this.tokenizer.peekToken(new StringType(3, "latin1"));
		let mpcParser;
		switch (signature) {
			case "MP+":
				debug$6("Stream-version 7");
				mpcParser = new MpcSv7Parser(this.metadata, this.tokenizer, this.options);
				break;
			case "MPC":
				debug$6("Stream-version 8");
				mpcParser = new MpcSv8Parser(this.metadata, this.tokenizer, this.options);
				break;
			default: throw new MusepackContentError("Invalid signature prefix");
		}
		this.metadata.setAudioOnly();
		return mpcParser.parse();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/opus/Opus.js
var OpusContentError = class extends makeUnexpectedFileContentError("Opus") {};
/**
* Opus ID Header parser
* Ref: https://wiki.xiph.org/OggOpus#ID_Header
*/
var IdHeader = class {
	constructor(len) {
		if (len < 19) throw new OpusContentError("ID-header-page 0 should be at least 19 bytes long");
		this.len = len;
	}
	get(buf, off) {
		return {
			magicSignature: new StringType(8, "ascii").get(buf, off + 0),
			version: UINT8.get(buf, off + 8),
			channelCount: UINT8.get(buf, off + 9),
			preSkip: UINT16_LE.get(buf, off + 10),
			inputSampleRate: UINT32_LE.get(buf, off + 12),
			outputGain: UINT16_LE.get(buf, off + 16),
			channelMapping: UINT8.get(buf, off + 18)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/opus/OpusStream.js
/**
* Opus parser
* Internet Engineering Task Force (IETF) - RFC 6716
* Used by OggStream
*/
var OpusStream = class extends VorbisStream {
	constructor(metadata, options, tokenizer) {
		super(metadata, options);
		this.idHeader = null;
		this.lastPos = -1;
		this.tokenizer = tokenizer;
		this.durationOnLastPage = true;
	}
	/**
	* Parse first Opus Ogg page
	* @param {IPageHeader} header
	* @param {Uint8Array} pageData
	*/
	parseFirstPage(_header, pageData) {
		this.metadata.setFormat("codec", "Opus");
		this.idHeader = new IdHeader(pageData.length).get(pageData, 0);
		if (this.idHeader.magicSignature !== "OpusHead") throw new OpusContentError("Illegal ogg/Opus magic-signature");
		this.metadata.setFormat("sampleRate", this.idHeader.inputSampleRate);
		this.metadata.setFormat("numberOfChannels", this.idHeader.channelCount);
		this.metadata.setAudioOnly();
	}
	async parseFullPage(pageData) {
		switch (new StringType(8, "ascii").get(pageData, 0)) {
			case "OpusTags":
				await this.parseUserCommentList(pageData, 8);
				this.lastPos = this.tokenizer.position - pageData.length;
		}
	}
	calculateDuration(enfOfStream) {
		if (this.lastPageHeader && (enfOfStream || this.lastPageHeader.headerType.lastPage) && this.metadata.format.sampleRate && this.lastPageHeader.absoluteGranulePosition >= 0) {
			const pos_48bit = this.lastPageHeader.absoluteGranulePosition - this.idHeader.preSkip;
			this.metadata.setFormat("numberOfSamples", pos_48bit);
			this.metadata.setFormat("duration", pos_48bit / 48e3);
			if (this.lastPos !== -1 && this.tokenizer.fileInfo.size && this.metadata.format.duration) {
				const dataSize = this.tokenizer.fileInfo.size - this.lastPos;
				this.metadata.setFormat("bitrate", 8 * dataSize / this.metadata.format.duration);
			}
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/speex/Speex.js
/**
* Speex Header Packet
* Ref: https://www.speex.org/docs/manual/speex-manual/node8.html#SECTION00830000000000000000
*/
var Header$1 = {
	len: 80,
	get: (buf, off) => {
		return {
			speex: new StringType(8, "ascii").get(buf, off + 0),
			version: trimRightNull(new StringType(20, "ascii").get(buf, off + 8)),
			version_id: INT32_LE.get(buf, off + 28),
			header_size: INT32_LE.get(buf, off + 32),
			rate: INT32_LE.get(buf, off + 36),
			mode: INT32_LE.get(buf, off + 40),
			mode_bitstream_version: INT32_LE.get(buf, off + 44),
			nb_channels: INT32_LE.get(buf, off + 48),
			bitrate: INT32_LE.get(buf, off + 52),
			frame_size: INT32_LE.get(buf, off + 56),
			vbr: INT32_LE.get(buf, off + 60),
			frames_per_packet: INT32_LE.get(buf, off + 64),
			extra_headers: INT32_LE.get(buf, off + 68),
			reserved1: INT32_LE.get(buf, off + 72),
			reserved2: INT32_LE.get(buf, off + 76)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/speex/SpeexStream.js
var debug$5 = (0, import_src.default)("music-metadata:parser:ogg:speex");
/**
* Speex, RFC 5574
* Ref:
* - https://www.speex.org/docs/manual/speex-manual/
* - https://tools.ietf.org/html/rfc5574
*/
var SpeexStream = class extends VorbisStream {
	constructor(metadata, options, _tokenizer) {
		super(metadata, options);
		this.commentHeaderParsed = false;
	}
	/**
	* Parse first Speex Ogg page
	* @param {IPageHeader} header
	* @param {Uint8Array} pageData
	*/
	parseFirstPage(_header, pageData) {
		debug$5("First Ogg/Speex page");
		const speexHeader = Header$1.get(pageData, 0);
		this.metadata.setFormat("codec", `Speex ${speexHeader.version}`);
		this.metadata.setFormat("numberOfChannels", speexHeader.nb_channels);
		this.metadata.setFormat("sampleRate", speexHeader.rate);
		if (speexHeader.bitrate !== -1) this.metadata.setFormat("bitrate", speexHeader.bitrate);
		this.metadata.setAudioOnly();
	}
	/**
	* The packet following the identification header is the comment header, in
	* Vorbis comment format but without a packet type or magic signature.
	* Ref: https://tools.ietf.org/html/rfc5574#section-3
	*/
	async parseFullPage(pageData) {
		if (this.commentHeaderParsed) return;
		this.commentHeaderParsed = true;
		debug$5("Parse Ogg/Speex comment header");
		await this.parseUserCommentList(pageData, 0);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/theora/Theora.js
/**
* 6.2 Identification Header
* Ref: https://theora.org/doc/Theora.pdf: 6.2 Identification Header Decode
*/
var IdentificationHeader = {
	len: 42,
	get: (buf, off) => {
		return {
			id: new StringType(7, "ascii").get(buf, off),
			vmaj: UINT8.get(buf, off + 7),
			vmin: UINT8.get(buf, off + 8),
			vrev: UINT8.get(buf, off + 9),
			vmbw: UINT16_BE.get(buf, off + 10),
			vmbh: UINT16_BE.get(buf, off + 17),
			nombr: UINT24_BE.get(buf, off + 37),
			nqual: UINT8.get(buf, off + 40)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/theora/TheoraStream.js
var debug$4 = (0, import_src.default)("music-metadata:parser:ogg:theora");
/**
* Ref:
* - https://theora.org/doc/Theora.pdf
*/
var TheoraStream = class {
	constructor(metadata, _options, _tokenizer) {
		this.durationOnLastPage = false;
		this.metadata = metadata;
	}
	/**
	* Vorbis 1 parser
	* @param header Ogg Page Header
	* @param pageData Page data
	*/
	async parsePage(header, pageData) {
		if (header.headerType.firstPage) await this.parseFirstPage(header, pageData);
	}
	calculateDuration() {
		debug$4("duration calculation not implemented");
	}
	/**
	* Parse first Theora Ogg page. the initial identification header packet
	*/
	async parseFirstPage(_header, pageData) {
		debug$4("First Ogg/Theora page");
		this.metadata.setFormat("codec", "Theora");
		const idHeader = IdentificationHeader.get(pageData, 0);
		this.metadata.setFormat("bitrate", idHeader.nombr);
		this.metadata.setFormat("hasVideo", true);
	}
	flush() {
		return Promise.resolve();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggToken.js
var PageHeader = {
	len: 27,
	get: (buf, off) => {
		return {
			capturePattern: new StringType(4, "latin1").get(buf, off),
			version: UINT8.get(buf, off + 4),
			headerType: {
				continued: getBit(buf, off + 5, 0),
				firstPage: getBit(buf, off + 5, 1),
				lastPage: getBit(buf, off + 5, 2)
			},
			absoluteGranulePosition: Number(UINT64_LE.get(buf, off + 6)),
			streamSerialNumber: UINT32_LE.get(buf, off + 14),
			pageSequenceNo: UINT32_LE.get(buf, off + 18),
			pageChecksum: UINT32_LE.get(buf, off + 22),
			page_segments: UINT8.get(buf, off + 26)
		};
	}
};
var SegmentTable = class SegmentTable {
	static sum(buf, off, len) {
		const dv = new DataView(buf.buffer, 0);
		let s = 0;
		for (let i = off; i < off + len; ++i) s += dv.getUint8(i);
		return s;
	}
	constructor(header) {
		this.len = header.page_segments;
	}
	get(buf, off) {
		return { totalPageSize: SegmentTable.sum(buf, off, this.len) };
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/flac/FlacStream.js
var debug$3 = (0, import_src.default)("music-metadata:parser:ogg:theora");
/**
* Ref:
* - https://xiph.org/flac/ogg_mapping.html
*/
var FlacStream = class {
	constructor(metadata, options, tokenizer) {
		this.durationOnLastPage = false;
		this.metadata = metadata;
		this.options = options;
		this.tokenizer = tokenizer;
		this.flacParser = new FlacParser(this.metadata, this.tokenizer, options);
	}
	/**
	* Vorbis 1 parser
	* @param header Ogg Page Header
	* @param pageData Page data
	*/
	async parsePage(header, pageData) {
		if (header.headerType.firstPage) await this.parseFirstPage(header, pageData);
	}
	calculateDuration() {
		debug$3("duration calculation not implemented");
	}
	/**
	* Parse first Theora Ogg page. the initial identification header packet
	*/
	async parseFirstPage(_header, pageData) {
		debug$3("First Ogg/FLAC page");
		if ((await FourCcToken.get(pageData, 9)).toString() !== "fLaC") throw new Error("Invalid FLAC preamble");
		const blockHeader = await BlockHeader.get(pageData, 13);
		await this.parseDataBlock(blockHeader, pageData.subarray(13 + BlockHeader.len));
	}
	async parseDataBlock(blockHeader, pageData) {
		debug$3(`blockHeader type=${blockHeader.type}, length=${blockHeader.length}`);
		switch (blockHeader.type) {
			case BlockType.STREAMINFO: {
				const streamInfo = BlockStreamInfo.get(pageData, 0);
				return this.flacParser.processsStreamInfo(streamInfo);
			}
			case BlockType.PADDING: break;
			case BlockType.APPLICATION: break;
			case BlockType.SEEKTABLE: break;
			case BlockType.VORBIS_COMMENT: return this.flacParser.parseComment(pageData);
			case BlockType.PICTURE:
				if (!this.options.skipCovers) {
					const picture = new VorbisPictureToken(pageData.length).get(pageData, 0);
					return this.flacParser.addPictureTag(picture);
				}
				break;
			default: this.metadata.addWarning(`Unknown block type: ${blockHeader.type}`);
		}
		return this.tokenizer.ignore(blockHeader.length).then();
	}
	flush() {
		return Promise.resolve();
	}
};
//#endregion
//#region node_modules/music-metadata/lib/ogg/OggParser.js
var OggParser_exports = /* @__PURE__ */ __exportAll({
	OggContentError: () => OggContentError,
	OggParser: () => OggParser
});
var OggContentError = class extends makeUnexpectedFileContentError("Ogg") {};
var debug$2 = (0, import_src.default)("music-metadata:parser:ogg");
var OggStream = class {
	constructor(metadata, streamSerial, options) {
		this.pageNumber = 0;
		this.closed = false;
		this.metadata = metadata;
		this.streamSerial = streamSerial;
		this.options = options;
	}
	async parsePage(tokenizer, header) {
		this.pageNumber = header.pageSequenceNo;
		debug$2("serial=%s page#=%s, Ogg.id=%s", header.streamSerialNumber, header.pageSequenceNo, header.capturePattern);
		const segmentTable = await tokenizer.readToken(new SegmentTable(header));
		debug$2("totalPageSize=%s", segmentTable.totalPageSize);
		const pageData = await tokenizer.readToken(new Uint8ArrayType(segmentTable.totalPageSize));
		debug$2("firstPage=%s, lastPage=%s, continued=%s", header.headerType.firstPage, header.headerType.lastPage, header.headerType.continued);
		if (header.headerType.firstPage) {
			this.metadata.setFormat("container", "Ogg");
			const idData = pageData.subarray(0, 7);
			const asciiId = Array.from(idData).filter((b) => b >= 32 && b <= 126).map((b) => String.fromCharCode(b)).join("");
			switch (asciiId) {
				case "vorbis":
					debug$2(`Set Ogg stream serial ${header.streamSerialNumber}, codec=Vorbis`);
					this.pageConsumer = new VorbisStream(this.metadata, this.options);
					break;
				case "OpusHea":
					debug$2("Set page consumer to Ogg/Opus");
					this.pageConsumer = new OpusStream(this.metadata, this.options, tokenizer);
					break;
				case "Speex  ":
					debug$2("Set page consumer to Ogg/Speex");
					this.pageConsumer = new SpeexStream(this.metadata, this.options, tokenizer);
					break;
				case "fishead":
				case "theora":
					debug$2("Set page consumer to Ogg/Theora");
					this.pageConsumer = new TheoraStream(this.metadata, this.options, tokenizer);
					break;
				case "FLAC":
					debug$2("Set page consumer to Vorbis");
					this.pageConsumer = new FlacStream(this.metadata, this.options, tokenizer);
					break;
				default: throw new OggContentError(`Ogg codec not recognized (id=${asciiId}`);
			}
		}
		if (header.headerType.lastPage) this.closed = true;
		if (this.pageConsumer) await this.pageConsumer.parsePage(header, pageData);
		else throw new Error("pageConsumer should be initialized");
	}
};
/**
* Parser for Ogg logical bitstream framing
*/
var OggParser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.streams = /* @__PURE__ */ new Map();
	}
	/**
	* Parse page
	* @returns {Promise<void>}
	*/
	async parse() {
		this.streams = /* @__PURE__ */ new Map();
		let enfOfStream = false;
		let header;
		try {
			do {
				header = await this.tokenizer.readToken(PageHeader);
				if (header.capturePattern !== "OggS") throw new OggContentError("Invalid Ogg capture pattern");
				let stream = this.streams.get(header.streamSerialNumber);
				if (!stream) {
					stream = new OggStream(this.metadata, header.streamSerialNumber, this.options);
					this.streams.set(header.streamSerialNumber, stream);
				}
				await stream.parsePage(this.tokenizer, header);
				if (stream.pageNumber > 12 && !(this.options.duration && [...this.streams.values()].find((stream) => stream.pageConsumer?.durationOnLastPage))) {
					debug$2("Stop processing Ogg stream");
					break;
				}
			} while (![...this.streams.values()].every((item) => item.closed));
		} catch (err) {
			if (err instanceof EndOfStreamError) {
				debug$2("Reached end-of-stream");
				enfOfStream = true;
			} else if (err instanceof OggContentError) this.metadata.addWarning(`Corrupt Ogg content at ${this.tokenizer.position}`);
			else throw err;
		}
		for (const stream of this.streams.values()) {
			if (!stream.closed) {
				this.metadata.addWarning(`End-of-stream reached before reaching last page in Ogg stream serial=${stream.streamSerial}`);
				await stream.pageConsumer?.flush();
			}
			stream.pageConsumer?.calculateDuration(enfOfStream);
		}
	}
};
//#endregion
//#region node_modules/music-metadata/lib/riff/RiffChunk.js
/**
* Common RIFF chunk header
*/
var Header = {
	len: 8,
	get: (buf, off) => {
		return {
			chunkID: new StringType(4, "latin1").get(buf, off),
			chunkSize: UINT32_LE.get(buf, off + 4)
		};
	}
};
/**
* Token to parse RIFF-INFO tag value
*/
var ListInfoTagValue = class {
	constructor(tagHeader) {
		this.tagHeader = tagHeader;
		this.len = tagHeader.chunkSize;
		this.len += this.len & 1;
	}
	get(buf, off) {
		return new StringType(this.tagHeader.chunkSize, "utf8").get(buf, off);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveChunk.js
var WaveContentError = class extends makeUnexpectedFileContentError("Wave") {};
/**
* Ref: https://msdn.microsoft.com/en-us/library/windows/desktop/dd317599(v=vs.85).aspx
*/
var WaveFormat = {
	PCM: 1,
	ADPCM: 2,
	IEEE_FLOAT: 3,
	ALAW: 6,
	MULAW: 7,
	DVI_ADPCM: 17,
	GSM610: 49,
	MPEG_ADTS_AAC: 5632,
	MPEG_LOAS: 5634,
	RAW_AAC1: 255,
	DOLBY_AC3_SPDIF: 146,
	DVM: 8192,
	RAW_SPORT: 576,
	ESST_AC3: 577,
	DRM: 9,
	DTS2: 8193,
	MPEG: 80,
	MPEGLAYER3: 85
};
var WaveFormatNameMap = {
	[WaveFormat.PCM]: "PCM",
	[WaveFormat.ADPCM]: "ADPCM",
	[WaveFormat.IEEE_FLOAT]: "IEEE_FLOAT",
	[WaveFormat.ALAW]: "ALAW",
	[WaveFormat.MULAW]: "MULAW",
	[WaveFormat.DVI_ADPCM]: "DVI_ADPCM",
	[WaveFormat.GSM610]: "GSM610",
	[WaveFormat.MPEG_ADTS_AAC]: "MPEG_ADTS_AAC",
	[WaveFormat.MPEG_LOAS]: "MPEG_LOAS",
	[WaveFormat.RAW_AAC1]: "RAW_AAC1",
	[WaveFormat.DOLBY_AC3_SPDIF]: "DOLBY_AC3_SPDIF",
	[WaveFormat.DVM]: "DVM",
	[WaveFormat.RAW_SPORT]: "RAW_SPORT",
	[WaveFormat.ESST_AC3]: "ESST_AC3",
	[WaveFormat.DRM]: "DRM",
	[WaveFormat.DTS2]: "DTS2",
	[WaveFormat.MPEG]: "MPEG",
	[WaveFormat.MPEGLAYER3]: "MPEGLAYER3"
};
/**
* format chunk; chunk-id is "fmt "
* http://soundfile.sapp.org/doc/WaveFormat/
*/
var Format = class {
	constructor(header) {
		if (header.chunkSize < 16) throw new WaveContentError("Invalid chunk size");
		this.len = header.chunkSize;
	}
	get(buf, off) {
		return {
			wFormatTag: UINT16_LE.get(buf, off),
			nChannels: UINT16_LE.get(buf, off + 2),
			nSamplesPerSec: UINT32_LE.get(buf, off + 4),
			nAvgBytesPerSec: UINT32_LE.get(buf, off + 8),
			nBlockAlign: UINT16_LE.get(buf, off + 12),
			wBitsPerSample: UINT16_LE.get(buf, off + 14)
		};
	}
};
/**
* Fact chunk; chunk-id is "fact"
* http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
* http://www.recordingblogs.com/wiki/fact-chunk-of-a-wave-file
*/
var FactChunk = class {
	constructor(header) {
		if (header.chunkSize < 4) throw new WaveContentError("Invalid fact chunk size.");
		this.len = header.chunkSize;
	}
	get(buf, off) {
		return { dwSampleLength: UINT32_LE.get(buf, off) };
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/BwfChunk.js
/**
* Broadcast Audio Extension Chunk
* Ref: https://tech.ebu.ch/docs/tech/tech3285.pdf
*/
var BroadcastAudioExtensionChunk = {
	len: 420,
	get: (uint8array, off) => {
		return {
			description: stripNulls(new StringType(256, "ascii").get(uint8array, off)).trim(),
			originator: stripNulls(new StringType(32, "ascii").get(uint8array, off + 256)).trim(),
			originatorReference: stripNulls(new StringType(32, "ascii").get(uint8array, off + 288)).trim(),
			originationDate: stripNulls(new StringType(10, "ascii").get(uint8array, off + 320)).trim(),
			originationTime: stripNulls(new StringType(8, "ascii").get(uint8array, off + 330)).trim(),
			timeReferenceLow: UINT32_LE.get(uint8array, off + 338),
			timeReferenceHigh: UINT32_LE.get(uint8array, off + 342),
			version: UINT16_LE.get(uint8array, off + 346),
			umid: new Uint8ArrayType(64).get(uint8array, off + 348),
			loudnessValue: UINT16_LE.get(uint8array, off + 412),
			maxTruePeakLevel: UINT16_LE.get(uint8array, off + 414),
			maxMomentaryLoudness: UINT16_LE.get(uint8array, off + 416),
			maxShortTermLoudness: UINT16_LE.get(uint8array, off + 418)
		};
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wav/WaveParser.js
var WaveParser_exports = /* @__PURE__ */ __exportAll({ WaveParser: () => WaveParser });
var debug$1 = (0, import_src.default)("music-metadata:parser:RIFF");
/**
* Resource Interchange File Format (RIFF) Parser
*
* WAVE PCM soundfile format
*
* Ref:
* - http://www.johnloomis.org/cpe102/asgn/asgn1/riff.html
* - http://soundfile.sapp.org/doc/WaveFormat
*
* ToDo: Split WAVE part from RIFF parser
*/
var WaveParser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.blockAlign = 0;
		this.avgBytesPerSec = 0;
	}
	async parse() {
		const riffHeader = await this.tokenizer.readToken(Header);
		debug$1(`pos=${this.tokenizer.position}, parse: chunkID=${riffHeader.chunkID}`);
		if (riffHeader.chunkID !== "RIFF") return;
		this.metadata.setAudioOnly();
		return this.parseRiffChunk(riffHeader.chunkSize).catch((err) => {
			if (!(err instanceof EndOfStreamError)) throw err;
		});
	}
	async parseRiffChunk(chunkSize) {
		const type = await this.tokenizer.readToken(FourCcToken);
		this.metadata.setFormat("container", type);
		switch (type) {
			case "WAVE": return this.readWaveChunk(chunkSize - FourCcToken.len);
			default: throw new WaveContentError(`Unsupported RIFF format: RIFF/${type}`);
		}
	}
	async readWaveChunk(remaining) {
		while (remaining >= Header.len) {
			const header = await this.tokenizer.readToken(Header);
			remaining -= Header.len + header.chunkSize;
			if (header.chunkSize > remaining) this.metadata.addWarning("Data chunk size exceeds file size");
			this.header = header;
			debug$1(`pos=${this.tokenizer.position}, readChunk: chunkID=RIFF/WAVE/${header.chunkID}`);
			switch (header.chunkID) {
				case "LIST":
					await this.parseListTag(header);
					break;
				case "fact":
					this.metadata.setFormat("lossless", false);
					this.fact = await this.tokenizer.readToken(new FactChunk(header));
					break;
				case "fmt ": {
					const fmt = await this.tokenizer.readToken(new Format(header));
					let subFormat = WaveFormatNameMap[fmt.wFormatTag];
					if (!subFormat) {
						debug$1(`WAVE/non-PCM format=${fmt.wFormatTag}`);
						subFormat = `non-PCM (${fmt.wFormatTag})`;
					}
					this.metadata.setFormat("codec", subFormat);
					this.metadata.setFormat("bitsPerSample", fmt.wBitsPerSample);
					this.metadata.setFormat("sampleRate", fmt.nSamplesPerSec);
					this.metadata.setFormat("numberOfChannels", fmt.nChannels);
					this.blockAlign = fmt.nBlockAlign;
					this.avgBytesPerSec = fmt.nAvgBytesPerSec;
					break;
				}
				case "id3 ":
				case "ID3 ": {
					const id3_data = await this.tokenizer.readToken(new Uint8ArrayType(header.chunkSize));
					const rst = fromBuffer(id3_data);
					await new ID3v2Parser().parse(this.metadata, rst, this.options);
					break;
				}
				case "data": {
					if (this.metadata.format.lossless !== false) this.metadata.setFormat("lossless", true);
					let chunkSize = header.chunkSize;
					if (this.tokenizer.fileInfo.size) {
						const calcRemaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
						if (calcRemaining < chunkSize) {
							this.metadata.addWarning("data chunk length exceeding file length");
							chunkSize = calcRemaining;
						}
					}
					const numberOfSamples = this.fact ? this.fact.dwSampleLength : chunkSize === 4294967295 ? void 0 : chunkSize / this.blockAlign;
					if (numberOfSamples) {
						this.metadata.setFormat("numberOfSamples", numberOfSamples);
						if (this.metadata.format.sampleRate) this.metadata.setFormat("duration", numberOfSamples / this.metadata.format.sampleRate);
					}
					if (this.avgBytesPerSec > 0) this.metadata.setFormat("bitrate", this.avgBytesPerSec * 8);
					else if (this.metadata.format.duration) this.metadata.setFormat("bitrate", chunkSize * 8 / this.metadata.format.duration);
					await this.tokenizer.ignore(header.chunkSize);
					break;
				}
				case "bext": {
					const bext = await this.tokenizer.readToken(BroadcastAudioExtensionChunk);
					Object.keys(bext).forEach((key) => {
						this.metadata.addTag("exif", `bext.${key}`, bext[key]);
					});
					const bextRemaining = header.chunkSize - BroadcastAudioExtensionChunk.len;
					await this.tokenizer.ignore(bextRemaining);
					break;
				}
				case "\0\0\0\0":
					debug$1(`Ignore padding chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
					this.metadata.addWarning(`Ignore chunk: RIFF/${header.chunkID}`);
					await this.tokenizer.ignore(header.chunkSize);
					break;
				default:
					debug$1(`Ignore chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
					this.metadata.addWarning(`Ignore chunk: RIFF/${header.chunkID}`);
					await this.tokenizer.ignore(header.chunkSize);
			}
			if (this.header.chunkSize % 2 === 1) {
				debug$1("Read odd padding byte");
				await this.tokenizer.ignore(1);
			}
		}
	}
	async parseListTag(listHeader) {
		const listType = await this.tokenizer.readToken(new StringType(4, "latin1"));
		debug$1("pos=%s, parseListTag: chunkID=RIFF/WAVE/LIST/%s", this.tokenizer.position, listType);
		switch (listType) {
			case "INFO": return this.parseRiffInfoTags(listHeader.chunkSize - 4);
			default:
				this.metadata.addWarning(`Ignore chunk: RIFF/WAVE/LIST/${listType}`);
				debug$1(`Ignoring chunkID=RIFF/WAVE/LIST/${listType}`);
				return this.tokenizer.ignore(listHeader.chunkSize - 4).then();
		}
	}
	async parseRiffInfoTags(chunkSize) {
		while (chunkSize >= 8) {
			const header = await this.tokenizer.readToken(Header);
			const valueToken = new ListInfoTagValue(header);
			const value = await this.tokenizer.readToken(valueToken);
			this.addTag(header.chunkID, stripNulls(value));
			chunkSize -= 8 + valueToken.len;
		}
		if (chunkSize !== 0) throw new WaveContentError(`Illegal remaining size: ${chunkSize}`);
	}
	addTag(id, value) {
		this.metadata.addTag("exif", id, value);
	}
};
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackToken.js
var SampleRates = [
	6e3,
	8e3,
	9600,
	11025,
	12e3,
	16e3,
	22050,
	24e3,
	32e3,
	44100,
	48e3,
	64e3,
	88200,
	96e3,
	192e3,
	-1
];
/**
* WavPack Block Header
*
* 32-byte little-endian header at the front of every WavPack block
*
* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 2/6: 2.0 "Block Header")
*/
var BlockHeaderToken = {
	len: 32,
	get: (buf, off) => {
		const flags = UINT32_LE.get(buf, off + 24);
		const res = {
			BlockID: FourCcToken.get(buf, off),
			blockSize: UINT32_LE.get(buf, off + 4),
			version: UINT16_LE.get(buf, off + 8),
			totalSamples: UINT32_LE.get(buf, off + 12),
			blockIndex: UINT32_LE.get(buf, off + 16),
			blockSamples: UINT32_LE.get(buf, off + 20),
			flags: {
				bitsPerSample: (1 + getBitAllignedNumber(flags, 0, 2)) * 8,
				isMono: isBitSet(flags, 2),
				isHybrid: isBitSet(flags, 3),
				isJointStereo: isBitSet(flags, 4),
				crossChannel: isBitSet(flags, 5),
				hybridNoiseShaping: isBitSet(flags, 6),
				floatingPoint: isBitSet(flags, 7),
				samplingRate: SampleRates[getBitAllignedNumber(flags, 23, 4)],
				isDSD: isBitSet(flags, 31)
			},
			crc: new Uint8ArrayType(4).get(buf, off + 28)
		};
		if (res.flags.isDSD) res.totalSamples *= 8;
		return res;
	}
};
/**
* 3.0 Metadata Sub-Blocks
* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf (page 4/6: 3.0 "Metadata Sub-Block")
*/
var MetadataIdToken = {
	len: 1,
	get: (buf, off) => {
		return {
			functionId: getBitAllignedNumber(buf[off], 0, 6),
			isOptional: isBitSet(buf[off], 5),
			isOddSize: isBitSet(buf[off], 6),
			largeBlock: isBitSet(buf[off], 7)
		};
	}
};
function isBitSet(flags, bitOffset) {
	return getBitAllignedNumber(flags, bitOffset, 1) === 1;
}
function getBitAllignedNumber(flags, bitOffset, len) {
	return flags >>> bitOffset & 4294967295 >>> 32 - len;
}
//#endregion
//#region node_modules/music-metadata/lib/wavpack/WavPackParser.js
var WavPackParser_exports = /* @__PURE__ */ __exportAll({
	WavPackContentError: () => WavPackContentError,
	WavPackParser: () => WavPackParser
});
var debug = (0, import_src.default)("music-metadata:parser:WavPack");
var WavPackContentError = class extends makeUnexpectedFileContentError("WavPack") {};
/**
* WavPack Parser
*/
var WavPackParser = class extends BasicParser {
	constructor() {
		super(...arguments);
		this.audioDataSize = 0;
	}
	async parse() {
		this.metadata.setAudioOnly();
		this.audioDataSize = 0;
		await this.parseWavPackBlocks();
		return tryParseApeHeader(this.metadata, this.tokenizer, this.options);
	}
	async parseWavPackBlocks() {
		do {
			if (await this.tokenizer.peekToken(FourCcToken) !== "wvpk") break;
			const header = await this.tokenizer.readToken(BlockHeaderToken);
			if (header.BlockID !== "wvpk") throw new WavPackContentError("Invalid WavPack Block-ID");
			debug(`WavPack header blockIndex=${header.blockIndex}, len=${BlockHeaderToken.len}`);
			if (header.blockIndex === 0 && !this.metadata.format.container) {
				this.metadata.setFormat("container", "WavPack");
				this.metadata.setFormat("lossless", !header.flags.isHybrid);
				this.metadata.setFormat("bitsPerSample", header.flags.bitsPerSample);
				if (!header.flags.isDSD) {
					this.metadata.setFormat("sampleRate", header.flags.samplingRate);
					this.metadata.setFormat("duration", header.totalSamples / header.flags.samplingRate);
				}
				this.metadata.setFormat("numberOfChannels", header.flags.isMono ? 1 : 2);
				this.metadata.setFormat("numberOfSamples", header.totalSamples);
				this.metadata.setFormat("codec", header.flags.isDSD ? "DSD" : "PCM");
			}
			const ignoreBytes = header.blockSize - (BlockHeaderToken.len - 8);
			await (header.blockIndex === 0 ? this.parseMetadataSubBlock(header, ignoreBytes) : this.tokenizer.ignore(ignoreBytes));
			if (header.blockSamples > 0) this.audioDataSize += header.blockSize;
		} while (!this.tokenizer.fileInfo.size || this.tokenizer.fileInfo.size - this.tokenizer.position >= BlockHeaderToken.len);
		if (this.metadata.format.duration) this.metadata.setFormat("bitrate", this.audioDataSize * 8 / this.metadata.format.duration);
	}
	/**
	* Ref: http://www.wavpack.com/WavPack5FileFormat.pdf, 3.0 Metadata Sub-blocks
	* @param header Header
	* @param remainingLength Remaining length
	*/
	async parseMetadataSubBlock(header, remainingLength) {
		let remaining = remainingLength;
		while (remaining > MetadataIdToken.len) {
			const id = await this.tokenizer.readToken(MetadataIdToken);
			const dataSizeInWords = await this.tokenizer.readNumber(id.largeBlock ? UINT24_LE : UINT8);
			const data = new Uint8Array(dataSizeInWords * 2 - (id.isOddSize ? 1 : 0));
			await this.tokenizer.readBuffer(data);
			debug(`Metadata Sub-Blocks functionId=0x${id.functionId.toString(16)}, id.largeBlock=${id.largeBlock},data-size=${data.length}`);
			switch (id.functionId) {
				case 0: break;
				case 14: {
					debug("ID_DSD_BLOCK");
					const mp = 1 << UINT8.get(data, 0);
					const samplingRate = header.flags.samplingRate * mp * 8;
					if (!header.flags.isDSD) throw new WavPackContentError("Only expect DSD block if DSD-flag is set");
					this.metadata.setFormat("sampleRate", samplingRate);
					this.metadata.setFormat("duration", header.totalSamples / samplingRate);
					break;
				}
				case 36:
					debug("ID_ALT_TRAILER: trailer for non-wav files");
					break;
				case 38:
					this.metadata.setFormat("audioMD5", data);
					break;
				case 47:
					debug(`ID_BLOCK_CHECKSUM: checksum=${uint8ArrayToHex(data)}`);
					break;
				default: debug(`Ignore unsupported meta-sub-block-id functionId=0x${id.functionId.toString(16)}`);
			}
			remaining -= MetadataIdToken.len + (id.largeBlock ? UINT24_LE.len : UINT8.len) + dataSizeInWords * 2;
			debug(`remainingLength=${remaining}`);
			if (id.isOddSize) this.tokenizer.ignore(1);
		}
		if (remaining !== 0) throw new WavPackContentError("metadata-sub-block should fit it remaining length");
	}
};
//#endregion
export { lib_exports as t };
