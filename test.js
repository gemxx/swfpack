/* jshint node:true, esnext:true */
'use strict';

const fs = require('fs');
const swfpack = require('./index');

const targetPath = __dirname + 'iqiyi.swf';
const destPath = __dirname + 'iqiyi.swf';



var converter = new swfpack(targetPath);
var packed = converter.pack('lzma', 7);

if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
}
fs.writeFileSync(destPath, packed);

