# swfpack
Swfpack is a tool that convert swf format between uncompressed/zlib/lzma.

# Installation
    $ pip install pylzma # the node.js lzma module compress fail. I just rely on python module pylzma. it really ugly.
    $ npm install swfpack

# Usage
````
var swfpack = require('swfpack');

var converter = new swfpack(file); //  file <String>|<Buffer>
var buffer_pomise = converter.pack('fws'); // fws (uncompressed)
var buffer_pomise = converter.pack('cws'); // cws (compressed by using the ZLIB open standard)
var buffer_pomise = converter.pack('zws'); // zws (compressed by using the LZMA open standard), lzma level 1-9

buffer_pomise.then(function() (buffer) {
    fs.writeFileSync('/path/to/lzma.swf', buffer);
});
````

#License
MIT
