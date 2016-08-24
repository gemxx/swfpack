/* jshint node:true, esnext:true */
'use strict';

const fs = require('fs');
const swfpack = require('./../index');

const targetPath = __dirname + '/youtube.swf';


var converter = new swfpack(targetPath);
var packed_fws = converter.pack('fws'); // uncompressed
var packed_cws = converter.pack('cws'); // zlib
var packed_zws = converter.pack('zws', 7); // lzma

function output(mode, packed) {
    const destPath = __dirname + '/dist_'+ mode +'.swf';
    if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
    }
    fs.writeFileSync(destPath, packed);
}

output('fws', packed_fws);
output('cws', packed_cws);
output('zws', packed_zws);