/**
 * SWF FILE FORMAT SPECIFICATION.
 * http://www.adobe.com/content/dam/Adobe/en/devnet/swf/pdf/swf-file-format-spec.pdf
 */
/* jshint node:true, esnext:true */
'use strict';

const fs = require('fs');
const zlib = require('zlib');
const lzma = require("lzma");


function exit(message) {
    var code = 0;
    if (message) {
        code = 1;
        console.error(message);
    }

    process.exit(code);
}


/**
 * Swf Description.
 * @constructor
 * @param <Uint8Array|string> buffer
 */
function Swf(buffer) {
    var swf_bytes_buf;

    if (Buffer.isBuffer(buffer)) {
        swf_bytes_buf = buffer;
    } else if (fs.existsSync(swfPath)) {
        swf_bytes_buf = fs.readFileSync(buffer);
    } else {
        return exit('pls specify "swfPath" parameter!');
    }

    this.buffer = swf_bytes_buf;
    this.lzma_mode = 7;

    this.parse();
    this.check();
}

Swf.prototype = {
    /**
     * parse swf.
     */
    parse: function() {
        var swf_buf = this.buffer;
        var signature = '';

        function strfcc(code) {
            return String.fromCharCode(code);
        }

        switch (strfcc(swf_buf[0])) {
        case 'F':
            // swf uncompressed.
            signature = 0;

            this.uncompressed = swf_buf.slice(8);
            break;
        case 'C':
            // swf compressed by zlib.
            signature = 1;

            this.uncompressed = zlib.inflateSync(swf_buf.slice(8));
            break;
        case 'Z':
            // swf compressed by lzma.
            signature = 2;

            this.uncompressed = lzma.decompress(swf_buf.slice(12));
            break;
        default:
            exit('not a swf file!');
        }

        if (strfcc(swf_buf[1]) !== 'W' && strfcc(swf_buf[2]) !== 'S') {
            exit('not a swf file!');
        }

        this.signature = signature;
        this.version = swf_buf.readInt8(3);
        this.filelength = swf_buf.readUInt32LE(4);
        this.fwsBuffer = Buffer.concat([this.buffer.slice(0, 8), this.uncompressed]); // FWS Buffer.

    },
    check: function() {
        if (this.fwsBuffer.length !== this.filelength) {
            exit('swf file length check failed!');
        }
    },
    pack: function(mode, level) {
        var swf_modes = {
            'zlib': 1,
            'lzma': 2
        };
        var options = {
            'signature': swf_modes[mode] || 0,
            'level': level || 7
        };
        var sign = options.signature;
        var output;
        var headers = this.fwsBuffer.slice(0, 8); // copy header.
        headers.writeUInt32LE(this.fwsBuffer.length, 4);

        switch (sign) {
        case 0:
            headers[0] = 'F'.charCodeAt(0);
            output = Buffer.concat([headers, this.fwsBuffer.slice(8)]);
            break;
        case 1:
            headers[0] = 'C'.charCodeAt(0);
            output = Buffer.concat([headers, zlib.deflateSync(this.uncompressed, {finishFlush: zlib.Z_SYNC_FLUSH})]);
            break;
        case 2:
            headers = this.fwsBuffer.slice(0, 12); // copy header.
            headers[0] = 'Z'.charCodeAt(0);
            headers[3] = headers[3] > 13 ? headers[3] : 13;
            headers.writeUInt32LE(this.fwsBuffer.length + 8, 4);

            var lzmaBuffer = new Buffer(lzma.compress(this.uncompressed, this.lzma_mode));
            headers.writeUInt32LE(lzmaBuffer.length - 13, 8);

            output = Buffer.concat([headers, lzmaBuffer.slice(0, 5), lzmaBuffer.slice(13)]);
            break;
        }

        return output;
    }
};

module.exports = Swf;
