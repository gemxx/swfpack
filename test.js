/* jshint node:true, esnext:true */
'use strict';

const swf_converter = require('./index');

const basePath = 'C:/Users/Administrator.QIYI--20160310A/Desktop/lzma/';
const iqiyi_lzma = basePath + 'lzma.swf';
const iqiyi = basePath + 'iqiyi.swf';

swf_converter(iqiyi, 'lzma');
// swf_converter(iqiyi, 'lzma');


console.log(swf_converter(iqiyi));
console.log(swf_converter(iqiyi, 'zlib'));
console.log(swf_converter(iqiyi, 'lzma'));
