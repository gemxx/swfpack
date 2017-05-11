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
        console.error('[swfpack] ' + message);
    }

    process.exit(code);
}

function strfcc(code) {
    return String.fromCharCode(code);
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
    } else if (fs.existsSync(buffer)) {
        swf_bytes_buf = fs.readFileSync(buffer);
    } else {
        return exit('pls specify "swfPath" parameter!');
    }

    this.buffer = swf_bytes_buf;
    this.level = 7;

    this._parse();
    this._check();
}

Swf.prototype = {
    /**
     * parse swf.
     */
    _parse: function () {
        var swf_buf = this.buffer;
        var signature = '';

        if (strfcc(swf_buf[1]) !== 'W' && strfcc(swf_buf[2]) !== 'S') {
            exit('not a swf file - WS Fail!');
        }

        switch (strfcc(swf_buf[0])) {
            case 'F':
                // 70: swf uncompressed.
                signature = 0;

                this.ddata = swf_buf.slice(8);
                break;
            case 'C':
                // 67: swf compressed by zlib.
                signature = 1;

                this.ddata = zlib.inflateSync(swf_buf.slice(8));
                break;
            case 'Z':
                // 90: swf compressed by lzma.
                signature = 2;

                this.ddata = lzma.decompress(swf_buf.slice(12));
                break;
            default:
                exit('not a swf file - Signature Fail!');
        }



        this.signature = signature;
        this.version = swf_buf.readInt8(3);

        // If FWS signature, the FileLength field should exactly match the file size.
        // If CWS signature, the FileLength field indicates the total length of the file
        // after decompression, and thus generally does not match the file size.
        this.filelength = swf_buf.readUInt32LE(4);
        this.fwsBuffer = Buffer.concat([this.buffer.slice(0, 8), this.ddata]); // FWS Buffer.

    },
    _check: function () {
        if (this.fwsBuffer.length !== this.filelength) {
            exit('swf file length check failed!');
        }
    },
    pack: function (mode, level) {
        var swf_formats = {
            'fws': 0,
            'cws': 1,
            'zws': 2
        };
        var options = {
            'signature': swf_formats[mode] || 0,
            'level': level || this.level
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
                output = Buffer.concat([headers, zlib.deflateSync(this.ddata)]);
                break;
            case 2:
                var zdata = new Buffer(lzma.compress(this.ddata, options.level));
                var zsize = zdata.length - 5; // 5 accounts lzma props.
                /*
                 * Format of LZMA SWF
                 *
                 * +-----------------+-----------+---------------+------------+-----------+-----------------+
                 * | 4 bytes         | 4 bytes   | 4 bytes       | 5 bytes    | n bytes   | 6 bytes         |
                 * +-----------------+-----------+---------------+------------+-----------+-----------------+
                 * | 'ZWS' + version | scriptLen | compressedLen | LZMA props | LZMA data | LZMA end marker |
                 * +-----------------+-----------+---------------+------------+-----------+-----------------+
                 *
                 * scriptLen is the uncompressed length of the SWF data. Includes 4 bytes
                 * SWF header and 4 bytes for scriptLen itself.
                 *
                 * compressedLen does not include header (4+4+4 bytes) or lzma props (5
                 * bytes) compressedLen does include LZMA end marker (6 bytes);
                 */
                headers = this.buffer.slice(0, 12); // copy header.
                headers[0] = 'Z'.charCodeAt(0); // LZMA Format
                headers[3] = headers[3] > 13 ? headers[3] : 13; // version
                headers.writeUInt32LE(this.filelength, 4); // scriptLen
                headers.writeUInt32LE(zsize, 8); // compressedLen

                output = Buffer.concat([headers, zdata]);
                break;
        }

        return output;
    }
};

module.exports = Swf;
