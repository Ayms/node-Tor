		//mp4box.js

/**
DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
It's like a file-like DataView on steroids.
@param {ArrayBuffer} arrayBuffer ArrayBuffer to read from.
@param {?Number} byteOffset Offset from arrayBuffer beginning for the DataStream.
@param {?Boolean} endianness DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN (the default).
*/
var DataStream = function(arrayBuffer, byteOffset, endianness) {
this._byteOffset = byteOffset || 0;
if (arrayBuffer instanceof ArrayBuffer) {
this.buffer = arrayBuffer;
} else if (typeof arrayBuffer == "object") {
this.dataView = arrayBuffer;
if (byteOffset) {
this._byteOffset += byteOffset;
}
} else {
this.buffer = new ArrayBuffer(arrayBuffer || 0);
}
this.position = 0;
this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
};
DataStream.prototype = {};
/**
Saves the DataStream contents to the given filename.
Uses Chrome's anchor download property to initiate download.
@param {string} filename Filename to save as.
@return {null}
*/
DataStream.prototype.save = function(filename) {
var blob = new Blob([this.buffer]);
var URL = (window.webkitURL || window.URL);
if (URL && URL.createObjectURL) {
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.setAttribute('href', url);
a.setAttribute('download', filename);
a.click();
URL.revokeObjectURL(url);
} else {
throw("DataStream.save: Can't create object URL.");
}
};
/**
Big-endian const to use as default endianness.
@type {boolean}
*/
DataStream.BIG_ENDIAN = false;
/**
Little-endian const to use as default endianness.
@type {boolean}
*/
DataStream.LITTLE_ENDIAN = true;
/**
Whether to extend DataStream buffer when trying to write beyond its size.
If set, the buffer is reallocated to twice its current size until the
requested write fits the buffer.
@type {boolean}
*/
DataStream.prototype._dynamicSize = true;
Object.defineProperty(DataStream.prototype, 'dynamicSize',
{ get: function() {
return this._dynamicSize;
},
set: function(v) {
if (!v) {
this._trimAlloc();
}
this._dynamicSize = v;
} });
/**
Virtual byte length of the DataStream backing buffer.
Updated to be max of original buffer size and last written size.
If dynamicSize is false is set to buffer size.
@type {number}
*/
DataStream.prototype._byteLength = 0;
/**
Returns the byte length of the DataStream object.
@type {number}
*/
Object.defineProperty(DataStream.prototype, 'byteLength',
{ get: function() {
return this._byteLength - this._byteOffset;
}});
/**
Set/get the backing ArrayBuffer of the DataStream object.
The setter updates the DataView to point to the new buffer.
@type {Object}
*/
Object.defineProperty(DataStream.prototype, 'buffer',
{ get: function() {
this._trimAlloc();
return this._buffer;
},
set: function(v) {
this._buffer = v;
this._dataView = new DataView(this._buffer, this._byteOffset);
this._byteLength = this._buffer.byteLength;
} });
/**
Set/get the byteOffset of the DataStream object.
The setter updates the DataView to point to the new byteOffset.
@type {number}
*/
Object.defineProperty(DataStream.prototype, 'byteOffset',
{ get: function() {
return this._byteOffset;
},
set: function(v) {
this._byteOffset = v;
this._dataView = new DataView(this._buffer, this._byteOffset);
this._byteLength = this._buffer.byteLength;
} });
/**
Set/get the backing DataView of the DataStream object.
The setter updates the buffer and byteOffset to point to the DataView values.
@type {Object}
*/
Object.defineProperty(DataStream.prototype, 'dataView',
{ get: function() {
return this._dataView;
},
set: function(v) {
this._byteOffset = v.byteOffset;
this._buffer = v.buffer;
this._dataView = new DataView(this._buffer, this._byteOffset);
this._byteLength = this._byteOffset + v.byteLength;
} });
/**
Internal function to resize the DataStream buffer when required.
@param {number} extra Number of bytes to add to the buffer allocation.
@return {null}
*/
DataStream.prototype._realloc = function(extra) {
if (!this._dynamicSize) {
return;
}
var req = this._byteOffset + this.position + extra;
var blen = this._buffer.byteLength;
if (req <= blen) {
if (req > this._byteLength) {
this._byteLength = req;
}
return;
}
if (blen < 1) {
blen = 1;
}
while (req > blen) {
blen *= 2;
}
var buf = new ArrayBuffer(blen);
var src = new Uint8Array(this._buffer);
var dst = new Uint8Array(buf, 0, src.length);
dst.set(src);
this.buffer = buf;
this._byteLength = req;
};
/**
Internal function to trim the DataStream buffer when required.
Used for stripping out the extra bytes from the backing buffer when
the virtual byteLength is smaller than the buffer byteLength (happens after
growing the buffer with writes and not filling the extra space completely).
@return {null}
*/
DataStream.prototype._trimAlloc = function() {
if (this._byteLength == this._buffer.byteLength) {
return;
}
var buf = new ArrayBuffer(this._byteLength);
var dst = new Uint8Array(buf);
var src = new Uint8Array(this._buffer, 0, dst.length);
dst.set(src);
this.buffer = buf;
};
/**
Internal function to trim the DataStream buffer when required.
Used for stripping out the first bytes when not needed anymore.
@return {null}
*/
DataStream.prototype.shift = function(offset) {
var buf = new ArrayBuffer(this._byteLength-offset);
var dst = new Uint8Array(buf);
var src = new Uint8Array(this._buffer, offset, dst.length);
dst.set(src);
this.buffer = buf;
this.position -= offset;
};
/**
Sets the DataStream read/write position to given position.
Clamps between 0 and DataStream length.
@param {number} pos Position to seek to.
@return {null}
*/
DataStream.prototype.seek = function(pos) {
var npos = Math.max(0, Math.min(this.byteLength, pos));
this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
};
/**
Returns true if the DataStream seek pointer is at the end of buffer and
there's no more data to read.
@return {boolean} True if the seek pointer is at the end of the buffer.
*/
DataStream.prototype.isEof = function() {
return (this.position >= this._byteLength);
};
/**
Maps an Int32Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Int32Array to the DataStream backing buffer.
*/
DataStream.prototype.mapInt32Array = function(length, e) {
this._realloc(length * 4);
var arr = new Int32Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 4;
return arr;
};
/**
Maps an Int16Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Int16Array to the DataStream backing buffer.
*/
DataStream.prototype.mapInt16Array = function(length, e) {
this._realloc(length * 2);
var arr = new Int16Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 2;
return arr;
};
/**
Maps an Int8Array into the DataStream buffer.
Nice for quickly reading in data.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Int8Array to the DataStream backing buffer.
*/
DataStream.prototype.mapInt8Array = function(length) {
this._realloc(length * 1);
var arr = new Int8Array(this._buffer, this.byteOffset+this.position, length);
this.position += length * 1;
return arr;
};
/**
Maps a Uint32Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Uint32Array to the DataStream backing buffer.
*/
DataStream.prototype.mapUint32Array = function(length, e) {
this._realloc(length * 4);
var arr = new Uint32Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 4;
return arr;
};
/**
Maps a Uint16Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Uint16Array to the DataStream backing buffer.
*/
DataStream.prototype.mapUint16Array = function(length, e) {
this._realloc(length * 2);
var arr = new Uint16Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 2;
return arr;
};
/**
Maps a Uint8Array into the DataStream buffer.
Nice for quickly reading in data.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Uint8Array to the DataStream backing buffer.
*/
DataStream.prototype.mapUint8Array = function(length) {
this._realloc(length * 1);
var arr = new Uint8Array(this._buffer, this.byteOffset+this.position, length);
this.position += length * 1;
return arr;
};
/**
Maps a Float64Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Float64Array to the DataStream backing buffer.
*/
DataStream.prototype.mapFloat64Array = function(length, e) {
this._realloc(length * 8);
var arr = new Float64Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 8;
return arr;
};
/**
Maps a Float32Array into the DataStream buffer, swizzling it to native
endianness in-place. The current offset from the start of the buffer needs to
be a multiple of element size, just like with typed array views.
Nice for quickly reading in data. Warning: potentially modifies the buffer
contents.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} Float32Array to the DataStream backing buffer.
*/
DataStream.prototype.mapFloat32Array = function(length, e) {
this._realloc(length * 4);
var arr = new Float32Array(this._buffer, this.byteOffset+this.position, length);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += length * 4;
return arr;
};
/**
Reads an Int32Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Int32Array.
*/
DataStream.prototype.readInt32Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 4) : length;
var arr = new Int32Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Reads an Int16Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Int16Array.
*/
DataStream.prototype.readInt16Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 2) : length;
var arr = new Int16Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Reads an Int8Array of desired length from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Int8Array.
*/
DataStream.prototype.readInt8Array = function(length) {
length = length == null ? (this.byteLength-this.position) : length;
var arr = new Int8Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
this.position += arr.byteLength;
return arr;
};
/**
Reads a Uint32Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Uint32Array.
*/
DataStream.prototype.readUint32Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 4) : length;
var arr = new Uint32Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Reads a Uint16Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Uint16Array.
*/
DataStream.prototype.readUint16Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 2) : length;
var arr = new Uint16Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Reads a Uint8Array of desired length from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Uint8Array.
*/
DataStream.prototype.readUint8Array = function(length) {
length = length == null ? (this.byteLength-this.position) : length;
var arr = new Uint8Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
this.position += arr.byteLength;
return arr;
};
/**
Reads a Float64Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Float64Array.
*/
DataStream.prototype.readFloat64Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 8) : length;
var arr = new Float64Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Reads a Float32Array of desired length and endianness from the DataStream.
@param {number} length Number of elements to map.
@param {?boolean} e Endianness of the data to read.
@return {Object} The read Float32Array.
*/
DataStream.prototype.readFloat32Array = function(length, e) {
length = length == null ? (this.byteLength-this.position / 4) : length;
var arr = new Float32Array(length);
DataStream.memcpy(arr.buffer, 0,
this.buffer, this.byteOffset+this.position,
length*arr.BYTES_PER_ELEMENT);
DataStream.arrayToNative(arr, e == null ? this.endianness : e);
this.position += arr.byteLength;
return arr;
};
/**
Writes an Int32Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeInt32Array = function(arr, e) {
this._realloc(arr.length * 4);
if (arr instanceof Int32Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapInt32Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeInt32(arr[i], e);
}
}
};
/**
Writes an Int16Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeInt16Array = function(arr, e) {
this._realloc(arr.length * 2);
if (arr instanceof Int16Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapInt16Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeInt16(arr[i], e);
}
}
};
/**
Writes an Int8Array to the DataStream.
@param {Object} arr The array to write.
*/
DataStream.prototype.writeInt8Array = function(arr) {
this._realloc(arr.length * 1);
if (arr instanceof Int8Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapInt8Array(arr.length);
} else {
for (var i=0; i<arr.length; i++) {
this.writeInt8(arr[i]);
}
}
};
/**
Writes a Uint32Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeUint32Array = function(arr, e) {
this._realloc(arr.length * 4);
if (arr instanceof Uint32Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapUint32Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeUint32(arr[i], e);
}
}
};
/**
Writes a Uint16Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeUint16Array = function(arr, e) {
this._realloc(arr.length * 2);
if (arr instanceof Uint16Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapUint16Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeUint16(arr[i], e);
}
}
};
/**
Writes a Uint8Array to the DataStream.
@param {Object} arr The array to write.
*/
DataStream.prototype.writeUint8Array = function(arr) {
this._realloc(arr.length * 1);
if (arr instanceof Uint8Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapUint8Array(arr.length);
} else {
for (var i=0; i<arr.length; i++) {
this.writeUint8(arr[i]);
}
}
};
/**
Writes a Float64Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeFloat64Array = function(arr, e) {
this._realloc(arr.length * 8);
if (arr instanceof Float64Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapFloat64Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeFloat64(arr[i], e);
}
}
};
/**
Writes a Float32Array of specified endianness to the DataStream.
@param {Object} arr The array to write.
@param {?boolean} e Endianness of the data to write.
*/
DataStream.prototype.writeFloat32Array = function(arr, e) {
this._realloc(arr.length * 4);
if (arr instanceof Float32Array &&
this.byteOffset+this.position % arr.BYTES_PER_ELEMENT === 0) {
DataStream.memcpy(this._buffer, this.byteOffset+this.position,
arr.buffer, 0,
arr.byteLength);
this.mapFloat32Array(arr.length, e);
} else {
for (var i=0; i<arr.length; i++) {
this.writeFloat32(arr[i], e);
}
}
};
/**
Reads a 32-bit int from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readInt32 = function(e) {
var v = this._dataView.getInt32(this.position, e == null ? this.endianness : e);
this.position += 4;
return v;
};
/**
Reads a 16-bit int from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readInt16 = function(e) {
var v = this._dataView.getInt16(this.position, e == null ? this.endianness : e);
this.position += 2;
return v;
};
/**
Reads an 8-bit int from the DataStream.
@return {number} The read number.
*/
DataStream.prototype.readInt8 = function() {
var v = this._dataView.getInt8(this.position);
this.position += 1;
return v;
};
/**
Reads a 32-bit unsigned int from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readUint32 = function(e) {
var v = this._dataView.getUint32(this.position, e == null ? this.endianness : e);
this.position += 4;
return v;
};
/**
Reads a 16-bit unsigned int from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readUint16 = function(e) {
var v = this._dataView.getUint16(this.position, e == null ? this.endianness : e);
this.position += 2;
return v;
};
/**
Reads an 8-bit unsigned int from the DataStream.
@return {number} The read number.
*/
DataStream.prototype.readUint8 = function() {
var v = this._dataView.getUint8(this.position);
this.position += 1;
return v;
};
/**
Reads a 32-bit float from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readFloat32 = function(e) {
var v = this._dataView.getFloat32(this.position, e == null ? this.endianness : e);
this.position += 4;
return v;
};
/**
Reads a 64-bit float from the DataStream with the desired endianness.
@param {?boolean} e Endianness of the number.
@return {number} The read number.
*/
DataStream.prototype.readFloat64 = function(e) {
var v = this._dataView.getFloat64(this.position, e == null ? this.endianness : e);
this.position += 8;
return v;
};
/**
Writes a 32-bit int to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeInt32 = function(v, e) {
this._realloc(4);
this._dataView.setInt32(this.position, v, e == null ? this.endianness : e);
this.position += 4;
};
/**
Writes a 16-bit int to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeInt16 = function(v, e) {
this._realloc(2);
this._dataView.setInt16(this.position, v, e == null ? this.endianness : e);
this.position += 2;
};
/**
Writes an 8-bit int to the DataStream.
@param {number} v Number to write.
*/
DataStream.prototype.writeInt8 = function(v) {
this._realloc(1);
this._dataView.setInt8(this.position, v);
this.position += 1;
};
/**
Writes a 32-bit unsigned int to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeUint32 = function(v, e) {
this._realloc(4);
this._dataView.setUint32(this.position, v, e == null ? this.endianness : e);
this.position += 4;
};
/**
Writes a 16-bit unsigned int to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeUint16 = function(v, e) {
this._realloc(2);
this._dataView.setUint16(this.position, v, e == null ? this.endianness : e);
this.position += 2;
};
/**
Writes an 8-bit unsigned int to the DataStream.
@param {number} v Number to write.
*/
DataStream.prototype.writeUint8 = function(v) {
this._realloc(1);
this._dataView.setUint8(this.position, v);
this.position += 1;
};
/**
Writes a 32-bit float to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeFloat32 = function(v, e) {
this._realloc(4);
this._dataView.setFloat32(this.position, v, e == null ? this.endianness : e);
this.position += 4;
};
/**
Writes a 64-bit float to the DataStream with the desired endianness.
@param {number} v Number to write.
@param {?boolean} e Endianness of the number.
*/
DataStream.prototype.writeFloat64 = function(v, e) {
this._realloc(8);
this._dataView.setFloat64(this.position, v, e == null ? this.endianness : e);
this.position += 8;
};
/**
Native endianness. Either DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN
depending on the platform endianness.
@type {boolean}
*/
DataStream.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
/**
Copies byteLength bytes from the src buffer at srcOffset to the
dst buffer at dstOffset.
@param {Object} dst Destination ArrayBuffer to write to.
@param {number} dstOffset Offset to the destination ArrayBuffer.
@param {Object} src Source ArrayBuffer to read from.
@param {number} srcOffset Offset to the source ArrayBuffer.
@param {number} byteLength Number of bytes to copy.
*/
DataStream.memcpy = function(dst, dstOffset, src, srcOffset, byteLength) {
var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
var srcU8 = new Uint8Array(src, srcOffset, byteLength);
dstU8.set(srcU8);
};
/**
Converts array to native endianness in-place.
@param {Object} array Typed array to convert.
@param {boolean} arrayIsLittleEndian True if the data in the array is
little-endian. Set false for big-endian.
@return {Object} The converted typed array.
*/
DataStream.arrayToNative = function(array, arrayIsLittleEndian) {
if (arrayIsLittleEndian == this.endianness) {
return array;
} else {
return this.flipArrayEndianness(array);
}
};
/**
Converts native endianness array to desired endianness in-place.
@param {Object} array Typed array to convert.
@param {boolean} littleEndian True if the converted array should be
little-endian. Set false for big-endian.
@return {Object} The converted typed array.
*/
DataStream.nativeToEndian = function(array, littleEndian) {
if (this.endianness == littleEndian) {
return array;
} else {
return this.flipArrayEndianness(array);
}
};
/**
Flips typed array endianness in-place.
@param {Object} array Typed array to flip.
@return {Object} The converted typed array.
*/
DataStream.flipArrayEndianness = function(array) {
var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
for (var i=0; i<array.byteLength; i+=array.BYTES_PER_ELEMENT) {
for (var j=i+array.BYTES_PER_ELEMENT-1, k=i; j>k; j--, k++) {
var tmp = u8[k];
u8[k] = u8[j];
u8[j] = tmp;
}
}
return array;
};
/**
Seek position where DataStream#readStruct ran into a problem.
Useful for debugging struct parsing.
@type {number}
*/
DataStream.prototype.failurePosition = 0;
/**
Reads a struct of data from the DataStream. The struct is defined as
a flat array of [name, type]-pairs. See the example below:
ds.readStruct([
'headerTag', 'uint32', // Uint32 in DataStream endianness.
'headerTag2', 'uint32be', // Big-endian Uint32.
'headerTag3', 'uint32le', // Little-endian Uint32.
'array', ['[]', 'uint32', 16], // Uint32Array of length 16.
'array2Length', 'uint32',
'array2', ['[]', 'uint32', 'array2Length'] // Uint32Array of length array2Length
]);
The possible values for the type are as follows:
// Number types
// Unsuffixed number types use DataStream endianness.
// To explicitly specify endianness, suffix the type with
// 'le' for little-endian or 'be' for big-endian,
// e.g. 'int32be' for big-endian int32.
'uint8' -- 8-bit unsigned int
'uint16' -- 16-bit unsigned int
'uint32' -- 32-bit unsigned int
'int8' -- 8-bit int
'int16' -- 16-bit int
'int32' -- 32-bit int
'float32' -- 32-bit float
'float64' -- 64-bit float
// String types
'cstring' -- ASCII string terminated by a zero byte.
'string:N' -- ASCII string of length N.
'string,CHARSET:N' -- String of byteLength N encoded with given CHARSET.
'u16string:N' -- UCS-2 string of length N in DataStream endianness.
'u16stringle:N' -- UCS-2 string of length N in little-endian.
'u16stringbe:N' -- UCS-2 string of length N in big-endian.
// Complex types
[name, type, name_2, type_2, ..., name_N, type_N] -- Struct
function(dataStream, struct) {} -- Callback function to read and return data.
{get: function(dataStream, struct) {},
set: function(dataStream, struct) {}}
-- Getter/setter functions to read and return data, handy for using the same
struct definition for reading and writing structs.
['[]', type, length] -- Array of given type and length. The length can be either
a number, a string that references a previously-read
field, or a callback function(struct, dataStream, type){}.
If length is '*', reads in as many elements as it can.
@param {Object} structDefinition Struct definition object.
@return {Object} The read struct. Null if failed to read struct.
*/
DataStream.prototype.readStruct = function(structDefinition) {
var struct = {}, t, v, n;
var p = this.position;
for (var i=0; i<structDefinition.length; i+=2) {
t = structDefinition[i+1];
v = this.readType(t, struct);
if (v == null) {
if (this.failurePosition === 0) {
this.failurePosition = this.position;
}
this.position = p;
return null;
}
struct[structDefinition[i]] = v;
}
return struct;
};
/**
Read UCS-2 string of desired length and endianness from the DataStream.
@param {number} length The length of the string to read.
@param {boolean} endianness The endianness of the string data in the DataStream.
@return {string} The read string.
*/
DataStream.prototype.readUCS2String = function(length, endianness) {
return String.fromCharCode.apply(null, this.readUint16Array(length, endianness));
};
/**
Write a UCS-2 string of desired endianness to the DataStream. The
lengthOverride argument lets you define the number of characters to write.
If the string is shorter than lengthOverride, the extra space is padded with
zeroes.
@param {string} str The string to write.
@param {?boolean} endianness The endianness to use for the written string data.
@param {?number} lengthOverride The number of characters to write.
*/
DataStream.prototype.writeUCS2String = function(str, endianness, lengthOverride) {
if (lengthOverride == null) {
lengthOverride = str.length;
}
for (var i = 0; i < str.length && i < lengthOverride; i++) {
this.writeUint16(str.charCodeAt(i), endianness);
}
for (; i<lengthOverride; i++) {
this.writeUint16(0);
}
};
/**
Read a string of desired length and encoding from the DataStream.
@param {number} length The length of the string to read in bytes.
@param {?string} encoding The encoding of the string data in the DataStream.
Defaults to ASCII.
@return {string} The read string.
*/
DataStream.prototype.readString = function(length, encoding) {
if (encoding == null || encoding == "ASCII") {
return String.fromCharCode.apply(null, this.mapUint8Array(length == null ? this.byteLength-this.position : length));
} else {
return (new TextDecoder(encoding)).decode(this.mapUint8Array(length));
}
};
/**
Writes a string of desired length and encoding to the DataStream.
@param {string} s The string to write.
@param {?string} encoding The encoding for the written string data.
Defaults to ASCII.
@param {?number} length The number of characters to write.
*/
DataStream.prototype.writeString = function(s, encoding, length) {
var i = 0;
if (encoding == null || encoding == "ASCII") {
if (length != null) {
var len = Math.min(s.length, length);
for (i=0; i<len; i++) {
this.writeUint8(s.charCodeAt(i));
}
for (; i<length; i++) {
this.writeUint8(0);
}
} else {
for (i=0; i<s.length; i++) {
this.writeUint8(s.charCodeAt(i));
}
}
} else {
this.writeUint8Array((new TextEncoder(encoding)).encode(s.substring(0, length)));
}
};
/**
Read null-terminated string of desired length from the DataStream. Truncates
the returned string so that the null byte is not a part of it.
@param {?number} length The length of the string to read.
@return {string} The read string.
*/
DataStream.prototype.readCString = function(length) {
var blen = this.byteLength-this.position;
var u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
var len = blen;
if (length != null) {
len = Math.min(length, blen);
}
for (var i = 0; i < len && u8[i] !== 0; i++); // find first zero byte
var s = String.fromCharCode.apply(null, this.mapUint8Array(i));
if (length != null) {
this.position += len-i;
} else if (i != blen) {
this.position += 1; // trailing zero if not at end of buffer
}
return s;
};
/**
Writes a null-terminated string to DataStream and zero-pads it to length
bytes. If length is not given, writes the string followed by a zero.
If string is longer than length, the written part of the string does not have
a trailing zero.
@param {string} s The string to write.
@param {?number} length The number of characters to write.
*/
DataStream.prototype.writeCString = function(s, length) {
var i = 0;
if (length != null) {
var len = Math.min(s.length, length);
for (i=0; i<len; i++) {
this.writeUint8(s.charCodeAt(i));
}
for (; i<length; i++) {
this.writeUint8(0);
}
} else {
for (i=0; i<s.length; i++) {
this.writeUint8(s.charCodeAt(i));
}
this.writeUint8(0);
}
};
/**
Reads an object of type t from the DataStream, passing struct as the thus-far
read struct to possible callbacks that refer to it. Used by readStruct for
reading in the values, so the type is one of the readStruct types.
@param {Object} t Type of the object to read.
@param {?Object} struct Struct to refer to when resolving length references
and for calling callbacks.
@return {?Object} Returns the object on successful read, null on unsuccessful.
*/
DataStream.prototype.readType = function(t, struct) {
if (typeof t == "function") {
return t(this, struct);
} else if (typeof t == "object" && !(t instanceof Array)) {
return t.get(this, struct);
} else if (t instanceof Array && t.length != 3) {
return this.readStruct(t, struct);
}
var v = null;
var lengthOverride = null;
var charset = "ASCII";
var pos = this.position;
var tp;
var i;
var u;
if (typeof t == 'string' && /:/.test(t)) {
tp = t.split(":");
t = tp[0];
lengthOverride = parseInt(tp[1]);
}
if (typeof t == 'string' && /,/.test(t)) {
tp = t.split(",");
t = tp[0];
charset = parseInt(tp[1]);
}
switch(t) {
case 'uint8':
v = this.readUint8(); break;
case 'int8':
v = this.readInt8(); break;
case 'uint16':
v = this.readUint16(this.endianness); break;
case 'int16':
v = this.readInt16(this.endianness); break;
case 'uint32':
v = this.readUint32(this.endianness); break;
case 'int32':
v = this.readInt32(this.endianness); break;
case 'float32':
v = this.readFloat32(this.endianness); break;
case 'float64':
v = this.readFloat64(this.endianness); break;
case 'uint16be':
v = this.readUint16(DataStream.BIG_ENDIAN); break;
case 'int16be':
v = this.readInt16(DataStream.BIG_ENDIAN); break;
case 'uint32be':
v = this.readUint32(DataStream.BIG_ENDIAN); break;
case 'int32be':
v = this.readInt32(DataStream.BIG_ENDIAN); break;
case 'float32be':
v = this.readFloat32(DataStream.BIG_ENDIAN); break;
case 'float64be':
v = this.readFloat64(DataStream.BIG_ENDIAN); break;
case 'uint16le':
v = this.readUint16(DataStream.LITTLE_ENDIAN); break;
case 'int16le':
v = this.readInt16(DataStream.LITTLE_ENDIAN); break;
case 'uint32le':
v = this.readUint32(DataStream.LITTLE_ENDIAN); break;
case 'int32le':
v = this.readInt32(DataStream.LITTLE_ENDIAN); break;
case 'float32le':
v = this.readFloat32(DataStream.LITTLE_ENDIAN); break;
case 'float64le':
v = this.readFloat64(DataStream.LITTLE_ENDIAN); break;
case 'cstring':
v = this.readCString(lengthOverride); break;
case 'string':
v = this.readString(lengthOverride, charset); break;
case 'u16string':
v = this.readUCS2String(lengthOverride, this.endianness); break;
case 'u16stringle':
v = this.readUCS2String(lengthOverride, DataStream.LITTLE_ENDIAN); break;
case 'u16stringbe':
v = this.readUCS2String(lengthOverride, DataStream.BIG_ENDIAN); break;
default:
if (t.length == 3) {
var ta = t[1];
var len = t[2];
var length = 0;
if (typeof len == 'function') {
length = len(struct, this, t);
} else if (typeof len == 'string' && struct[len] != null) {
length = parseInt(struct[len]);
} else {
length = parseInt(len);
}
if (typeof ta == "string") {
var tap = ta.replace(/(le|be)$/, '');
var endianness = null;
if (/le$/.test(ta)) {
endianness = DataStream.LITTLE_ENDIAN;
} else if (/be$/.test(ta)) {
endianness = DataStream.BIG_ENDIAN;
}
if (len == '*') {
length = null;
}
switch(tap) {
case 'uint8':
v = this.readUint8Array(length); break;
case 'uint16':
v = this.readUint16Array(length, endianness); break;
case 'uint32':
v = this.readUint32Array(length, endianness); break;
case 'int8':
v = this.readInt8Array(length); break;
case 'int16':
v = this.readInt16Array(length, endianness); break;
case 'int32':
v = this.readInt32Array(length, endianness); break;
case 'float32':
v = this.readFloat32Array(length, endianness); break;
case 'float64':
v = this.readFloat64Array(length, endianness); break;
case 'cstring':
case 'utf16string':
case 'string':
if (length == null) {
v = [];
while (!this.isEof()) {
u = this.readType(ta, struct);
if (u == null) break;
v.push(u);
}
} else {
v = new Array(length);
for (i=0; i<length; i++) {
v[i] = this.readType(ta, struct);
}
}
break;
}
} else {
if (len == '*') {
v = [];
var tmp_buffer = this.buffer;
while (true) {
var p = this.position;
try {
var o = this.readType(ta, struct);
if (o == null) {
this.position = p;
break;
}
v.push(o);
} catch(e) {
this.position = p;
break;
}
}
} else {
v = new Array(length);
for (i=0; i<length; i++) {
u = this.readType(ta, struct);
if (u == null) return null;
v[i] = u;
}
}
}
break;
}
}
if (lengthOverride != null) {
this.position = pos + lengthOverride;
}
return v;
};
/**
Writes a struct to the DataStream. Takes a structDefinition that gives the
types and a struct object that gives the values. Refer to readStruct for the
structure of structDefinition.
@param {Object} structDefinition Type definition of the struct.
@param {Object} struct The struct data object.
*/
DataStream.prototype.writeStruct = function(structDefinition, struct) {
for (var i = 0; i < structDefinition.length; i+=2) {
var t = structDefinition[i+1];
this.writeType(t, struct[structDefinition[i]], struct);
}
};
/**
Writes object v of type t to the DataStream.
@param {Object} t Type of data to write.
@param {Object} v Value of data to write.
@param {Object} struct Struct to pass to write callback functions.
*/
DataStream.prototype.writeType = function(t, v, struct) {
var tp;
if (typeof t == "function") {
return t(this, v);
} else if (typeof t == "object" && !(t instanceof Array)) {
return t.set(this, v, struct);
}
var lengthOverride = null;
var charset = "ASCII";
var pos = this.position;
if (typeof(t) == 'string' && /:/.test(t)) {
tp = t.split(":");
t = tp[0];
lengthOverride = parseInt(tp[1]);
}
if (typeof t == 'string' && /,/.test(t)) {
tp = t.split(",");
t = tp[0];
charset = parseInt(tp[1]);
}
switch(t) {
case 'uint8':
this.writeUint8(v);
break;
case 'int8':
this.writeInt8(v);
break;
case 'uint16':
this.writeUint16(v, this.endianness);
break;
case 'int16':
this.writeInt16(v, this.endianness);
break;
case 'uint32':
this.writeUint32(v, this.endianness);
break;
case 'int32':
this.writeInt32(v, this.endianness);
break;
case 'float32':
this.writeFloat32(v, this.endianness);
break;
case 'float64':
this.writeFloat64(v, this.endianness);
break;
case 'uint16be':
this.writeUint16(v, DataStream.BIG_ENDIAN);
break;
case 'int16be':
this.writeInt16(v, DataStream.BIG_ENDIAN);
break;
case 'uint32be':
this.writeUint32(v, DataStream.BIG_ENDIAN);
break;
case 'int32be':
this.writeInt32(v, DataStream.BIG_ENDIAN);
break;
case 'float32be':
this.writeFloat32(v, DataStream.BIG_ENDIAN);
break;
case 'float64be':
this.writeFloat64(v, DataStream.BIG_ENDIAN);
break;
case 'uint16le':
this.writeUint16(v, DataStream.LITTLE_ENDIAN);
break;
case 'int16le':
this.writeInt16(v, DataStream.LITTLE_ENDIAN);
break;
case 'uint32le':
this.writeUint32(v, DataStream.LITTLE_ENDIAN);
break;
case 'int32le':
this.writeInt32(v, DataStream.LITTLE_ENDIAN);
break;
case 'float32le':
this.writeFloat32(v, DataStream.LITTLE_ENDIAN);
break;
case 'float64le':
this.writeFloat64(v, DataStream.LITTLE_ENDIAN);
break;
case 'cstring':
this.writeCString(v, lengthOverride);
break;
case 'string':
this.writeString(v, charset, lengthOverride);
break;
case 'u16string':
this.writeUCS2String(v, this.endianness, lengthOverride);
break;
case 'u16stringle':
this.writeUCS2String(v, DataStream.LITTLE_ENDIAN, lengthOverride);
break;
case 'u16stringbe':
this.writeUCS2String(v, DataStream.BIG_ENDIAN, lengthOverride);
break;
default:
if (t.length == 3) {
var ta = t[1];
for (var i=0; i<v.length; i++) {
this.writeType(ta, v[i]);
}
break;
} else {
this.writeStruct(t, v);
break;
}
}
if (lengthOverride != null) {
this.position = pos;
this._realloc(lengthOverride);
this.position = pos + lengthOverride;
}
};
/*
TODO: fix endianness for 24/64-bit fields
TODO: check range/support for 64-bits numbers in JavaScript
*/
var MAX_SIZE = Math.pow(2, 32);
DataStream.prototype.readUint64 = function () {
return (this.readUint32()*MAX_SIZE)+this.readUint32();
}
DataStream.prototype.writeUint64 = function (v) {
var h = Math.floor(v / MAX_SIZE);
this.writeUint32(h);
this.writeUint32(v & 0xFFFFFFFF);
}
DataStream.prototype.readUint24 = function () {
return (this.readUint8()<<16)+(this.readUint8()<<8)+this.readUint8();
}
DataStream.prototype.writeUint24 = function (v) {
this.writeUint8((v & 0x00FF0000)>>16);
this.writeUint8((v & 0x0000FF00)>>8);
this.writeUint8((v & 0x000000FF));
}
DataStream.prototype.adjustUint32 = function(position, value) {
var pos = this.position;
this.seek(position);
this.writeUint32(value);
this.seek(pos);
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var BoxParser = {
ERR_NOT_ENOUGH_DATA : 0,
OK : 1,
boxCodes : [
"mdat",
"avcC", "ftyp",
"payl",
"vmhd", "smhd", "hmhd", "dref", "elst" // full boxes not yet parsed
],
fullBoxCodes : [ "mvhd", "tkhd", "mdhd", "hdlr", "smhd", "hmhd", "nhmd", "url ", "urn ",
"ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh",
"mehd", "trex", "mfhd", "tfhd", "trun", "tfdt",
"esds", "subs"
/* missing "stsd": special case full box and container */
],
containerBoxCodes : [
[ "moov", [ "trak" ] ],
[ "trak" ],
[ "edts" ],
[ "mdia" ],
[ "minf" ],
[ "dinf" ],
[ "stbl" ],
[ "mvex", [ "trex" ] ],
[ "moof", [ "traf" ] ],
[ "traf", [ "trun" ] ],
[ "vttc" ],
[ "tref" ]
],
sampleEntryCodes : [
/* 4CC as registered on http://mp4ra.org/codecs.html */
{ prefix: "Visual", types: [ "mp4v", "avc1", "avc2", "avc3", "avc4", "avcp", "drac", "encv", "mjp2", "mvc1", "mvc2", "resv", "s263", "svc1", "vc-1" ] },
{ prefix: "Audio", types: [ "mp4a", "ac-3", "alac", "dra1", "dtsc", "dtse", ,"dtsh", "dtsl", "ec-3", "enca", "g719", "g726", "m4ae", "mlpa", "raw ", "samr", "sawb", "sawp", "sevc", "sqcp", "ssmv", "twos" ] },
{ prefix: "Hint", types: [ "fdp ", "m2ts", "pm2t", "prtp", "rm2t", "rrtp", "rsrp", "rtp ", "sm2t", "srtp" ] },
{ prefix: "Metadata", types: [ "metx", "mett", "urim" ] },
{ prefix: "Subtitle", types: [ "stpp", "wvtt" ] }
],
trackReferenceTypes: [
"scal"
],
initialize: function() {
var i, j;
var length;
BoxParser.FullBox.prototype = new BoxParser.Box();
BoxParser.ContainerBox.prototype = new BoxParser.Box();
BoxParser.stsdBox.prototype = new BoxParser.FullBox();
BoxParser.SampleEntry.prototype = new BoxParser.FullBox();
BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
/* creating constructors for simple boxes */
length = BoxParser.boxCodes.length;
for (i=0; i<length; i++) {
BoxParser[BoxParser.boxCodes[i]+"Box"] = (function (j) { /* creating a closure around the iterating value of i */
return function(size) {
BoxParser.Box.call(this, BoxParser.boxCodes[j], size);
}
})(i);
BoxParser[BoxParser.boxCodes[i]+"Box"].prototype = new BoxParser.Box();
}
/* creating constructors for full boxes */
length = BoxParser.fullBoxCodes.length;
for (i=0; i<length; i++) {
BoxParser[BoxParser.fullBoxCodes[i]+"Box"] = (function (j) {
return function(size) {
BoxParser.FullBox.call(this, BoxParser.fullBoxCodes[j], size);
}
})(i);
BoxParser[BoxParser.fullBoxCodes[i]+"Box"].prototype = new BoxParser.FullBox();
}
/* creating constructors for container boxes */
length = BoxParser.containerBoxCodes.length;
for (i=0; i<length; i++) {
BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"] = (function (j, subBoxNames) {
return function(size) {
BoxParser.ContainerBox.call(this, BoxParser.containerBoxCodes[j][0], size);
if (subBoxNames) {
this.subBoxNames = subBoxNames;
var nbSubBoxes = subBoxNames.length;
for (var k = 0; k<nbSubBoxes; k++) {
this[subBoxNames[k]+"s"] = [];
}
}
}
})(i, BoxParser.containerBoxCodes[i][1]);
BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"].prototype = new BoxParser.ContainerBox();
}
/* creating constructors for stsd entries */
length = BoxParser.sampleEntryCodes.length;
for (j = 0; j < length; j++) {
var prefix = BoxParser.sampleEntryCodes[j].prefix;
var types = BoxParser.sampleEntryCodes[j].types;
var nb_types = types.length;
BoxParser[prefix+"SampleEntry"] = function(type, size) { BoxParser.SampleEntry.call(this, type, size); };
BoxParser[prefix+"SampleEntry"].prototype = new BoxParser.SampleEntry();
for (i=0; i<nb_types; i++) {
BoxParser[types[i]+"Box"] = (function (k, l) {
return function(size) {
BoxParser[BoxParser.sampleEntryCodes[k].prefix+"SampleEntry"].call(this, BoxParser.sampleEntryCodes[k].types[l], size);
}
})(j, i);
BoxParser[types[i]+"Box"].prototype = new BoxParser[prefix+"SampleEntry"]();
}
}
/* creating constructors for track reference type boxes */
length = BoxParser.trackReferenceTypes.length;
for (i=0; i<length; i++) {
BoxParser[BoxParser.trackReferenceTypes[i]+"Box"] = (function (j) {
return function(size) {
BoxParser.TrackReferenceTypeBox.call(this, BoxParser.trackReferenceTypes[j], size);
}
})(i);
BoxParser[BoxParser.trackReferenceTypes[i]+"Box"].prototype = new BoxParser.Box();
}
},
Box: function(_type, _size) {
this.type = _type;
this.size = _size;
},
FullBox: function(type, size) {
BoxParser.Box.call(this, type, size);
this.flags = 0;
this.version = 0;
},
ContainerBox: function(type, size) {
BoxParser.Box.call(this, type, size);
this.boxes = [];
},
SampleEntry: function(type, size) {
BoxParser.Box.call(this, type, size);
this.boxes = [];
},
TrackReferenceTypeBox: function(type, size) {
BoxParser.Box.call(this, type, size);
this.track_ids = [];
},
stsdBox: function(size) {
BoxParser.FullBox.call(this, "stsd", size);
this.entries = [];
},
parseOneBox: function(stream, isSampleEntry) {
var box;
var start = stream.position;
var hdr_size = 0;
if (stream.byteLength - stream.position < 8) {
Log.d("BoxParser", "Not enough data in stream to parse the type and size of the box");
return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
}
var size = stream.readUint32();
var type = stream.readString(4);
Log.d("BoxParser", "Found box of type "+type+" and size "+size+" at position "+start+" in the current buffer ("+(stream.buffer.fileStart+start)+" in the file)");
hdr_size = 8;
if (type == "uuid") {
uuid = stream.readString(16);
hdr_size += 16;
}
if (size == 1) {
if (stream.byteLength - stream.position < 8) {
stream.seek(start);
Log.w("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
}
size = stream.readUint64();
hdr_size += 8;
} else if (size === 0) {
/* box extends till the end of file */
throw "Unlimited box size not supported";
}
if (start + size > stream.byteLength ) {
stream.seek(start);
Log.w("BoxParser", "Not enough data in stream to parse the entire \""+type+"\" box");
return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size };
}
if (BoxParser[type+"Box"]) {
box = new BoxParser[type+"Box"](size - hdr_size);
} else {
if (isSampleEntry) {
box = new BoxParser.SampleEntry(type, size - hdr_size);
} else {
box = new BoxParser.Box(type, size - hdr_size);
}
}
/* recording the position of the box in the input stream */
box.hdr_size = hdr_size;
box.start = start;
box.fileStart = start + stream.buffer.fileStart;
box.parse(stream);
return { code: BoxParser.OK, box: box, size: size };
},
}
BoxParser.initialize();
BoxParser.Box.prototype.parse = function(stream) {
if (this.type != "mdat") {
this.data = stream.readUint8Array(this.size);
} else {
stream.seek(this.start+this.size+this.hdr_size);
}
}
BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
this.version = stream.readUint8();
this.flags = stream.readUint24();
this.size -= 4;
}
BoxParser.ContainerBox.prototype.parse = function(stream) {
var ret;
var box;
var start;
start = stream.position;
while (stream.position < start+this.size) {
ret = BoxParser.parseOneBox(stream);
box = ret.box;
/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
this.boxes.push(box);
if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
this[this.subBoxNames+"s"].push(box);
} else {
this[box.type] = box;
}
}
}
BoxParser.SampleEntry.prototype.isVideo = function() {
return false;
}
BoxParser.SampleEntry.prototype.isAudio = function() {
return false;
}
BoxParser.SampleEntry.prototype.isSubtitle = function() {
return false;
}
BoxParser.SampleEntry.prototype.isMetadata = function() {
return false;
}
BoxParser.SampleEntry.prototype.isHint = function() {
return false;
}
BoxParser.SampleEntry.prototype.getCodec = function() {
return this.type;
}
BoxParser.SampleEntry.prototype.getWidth = function() {
return "";
}
BoxParser.SampleEntry.prototype.getHeight = function() {
return "";
}
BoxParser.SampleEntry.prototype.getChannelCount = function() {
return "";
}
BoxParser.SampleEntry.prototype.getSampleRate = function() {
return "";
}
BoxParser.SampleEntry.prototype.getSampleSize = function() {
return "";
}
BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
this.start = stream.position;
stream.readUint8Array(6);
this.data_reference_index = stream.readUint16();
}
BoxParser.SampleEntry.prototype.parseFooter = function(stream) {
var ret;
var box;
while (stream.position < this.start+this.size) {
ret = BoxParser.parseOneBox(stream, true);
box = ret.box;
this.boxes.push(box);
this[box.type] = box;
}
}
BoxParser.SampleEntry.prototype.parse = function(stream) {
this.parseHeader(stream);
stream.seek(this.start+this.size);
}
BoxParser.VisualSampleEntry.prototype.parse = function(stream) {
this.parseHeader(stream);
stream.readUint16();
stream.readUint16();
stream.readUint32Array(3);
this.width = stream.readUint16();
this.height = stream.readUint16();
this.horizresolution = stream.readUint32();
this.vertresolution = stream.readUint32();
stream.readUint32();
this.frame_count = stream.readUint16();
this.compressorname = stream.readString(32);
this.depth = stream.readUint16();
stream.readUint16();
this.parseFooter(stream);
}
BoxParser.VisualSampleEntry.prototype.isVideo = function() {
return true;
}
BoxParser.VisualSampleEntry.prototype.getWidth = function() {
return this.width;
}
BoxParser.VisualSampleEntry.prototype.getHeight = function() {
return this.height;
}
BoxParser.AudioSampleEntry.prototype.parse = function(stream) {
this.parseHeader(stream);
stream.readUint32Array(2);
this.channel_count = stream.readUint16();
this.samplesize = stream.readUint16();
stream.readUint16();
stream.readUint16();
this.samplerate = (stream.readUint32()/(1<<16));
this.parseFooter(stream);
}
BoxParser.AudioSampleEntry.prototype.isAudio = function() {
return true;
}
BoxParser.AudioSampleEntry.prototype.getChannelCount = function() {
return this.channel_count;
}
BoxParser.AudioSampleEntry.prototype.getSampleRate = function() {
return this.samplerate;
}
BoxParser.AudioSampleEntry.prototype.getSampleSize = function() {
return this.samplesize;
}
BoxParser.SubtitleSampleEntry.prototype.isSubtitle = function() {
return true;
}
BoxParser.TrackReferenceTypeBox.prototype.parse = function(stream) {
this.track_ids = stream.readUint8Array(this.size);
}
BoxParser.ftypBox.prototype.parse = function(stream) {
this.major_brand = stream.readString(4);
this.minor_version = stream.readUint32();
this.size -= 8;
this.compatible_brands = [];
var i = 0;
while (this.size>=4) {
this.compatible_brands[i] = stream.readString(4);
this.size -= 4;
i++;
}
}
BoxParser.mvhdBox.prototype.parse = function(stream) {
this.flags = 0;
this.parseFullHeader(stream);
if (this.version == 1) {
this.creation_time = stream.readUint64();
this.modification_time = stream.readUint64();
this.timescale = stream.readUint32();
this.duration = stream.readUint64();
} else {
this.creation_time = stream.readUint32();
this.modification_time = stream.readUint32();
this.timescale = stream.readUint32();
this.duration = stream.readUint32();
}
this.rate = stream.readUint32();
this.volume = stream.readUint16()>>8;
stream.readUint16();
stream.readUint32Array(2);
this.matrix = stream.readUint32Array(9);
stream.readUint32Array(6);
this.next_track_id = stream.readUint32();
}
BoxParser.TKHD_FLAG_ENABLED = 0x000001;
BoxParser.TKHD_FLAG_IN_MOVIE = 0x000002;
BoxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;
BoxParser.tkhdBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
if (this.version == 1) {
this.creation_time = stream.readUint64();
this.modification_time = stream.readUint64();
this.track_id = stream.readUint32();
stream.readUint32();
this.duration = stream.readUint64();
} else {
this.creation_time = stream.readUint32();
this.modification_time = stream.readUint32();
this.track_id = stream.readUint32();
stream.readUint32();
this.duration = stream.readUint32();
}
stream.readUint32Array(2);
this.layer = stream.readInt16();
this.alternate_group = stream.readInt16();
this.volume = stream.readInt16()>>8;
stream.readUint16();
this.matrix = stream.readInt32Array(9);
this.width = stream.readUint32();
this.height = stream.readUint32();
}
BoxParser.mdhdBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
if (this.version == 1) {
this.creation_time = stream.readUint64();
this.modification_time = stream.readUint64();
this.timescale = stream.readUint32();
this.duration = stream.readUint64();
} else {
this.creation_time = stream.readUint32();
this.modification_time = stream.readUint32();
this.timescale = stream.readUint32();
this.duration = stream.readUint32();
}
this.language = stream.readUint16();
var chars = [];
chars[0] = (this.language>>10)&0x1F;
chars[1] = (this.language>>5)&0x1F;
chars[2] = (this.language)&0x1F;
this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
stream.readUint16();
}
BoxParser.hdlrBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
if (this.version === 0) {
stream.readUint32();
this.handler = stream.readString(4);
stream.readUint32Array(3);
this.name = stream.readCString();
} else {
this.data = stream.readUint8Array(size);
}
}
BoxParser.stsdBox.prototype.parse = function(stream) {
var ret;
var entryCount;
this.parseFullHeader(stream);
entryCount = stream.readUint32();
for (i = 1; i <= entryCount; i++) {
ret = BoxParser.parseOneBox(stream, true);
this.entries.push(ret.box);
}
}
BoxParser.avcCBox.prototype.parse = function(stream) {
var i;
var nb_nalus;
var length;
this.configurationVersion = stream.readUint8();
this.AVCProfileIndication = stream.readUint8();
this.profile_compatibility = stream.readUint8();
this.AVCLevelIndication = stream.readUint8();
this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
nb_nalus = (stream.readUint8() & 0x1F);
this.size -= 6;
this.SPS = new Array(nb_nalus);
for (i = 0; i < nb_nalus; i++) {
length = stream.readUint16();
this.SPS[i] = stream.readUint8Array(length);
this.size -= 2+length;
}
nb_nalus = stream.readUint8();
this.size--;
this.PPS = new Array(nb_nalus);
for (i = 0; i < nb_nalus; i++) {
length = stream.readUint16();
this.PPS[i] = stream.readUint8Array(length);
this.size -= 2+length;
}
if (this.size>0) {
this.ext = stream.readUint8Array(this.size);
}
}
function decimalToHex(d, padding) {
var hex = Number(d).toString(16);
padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
while (hex.length < padding) {
hex = "0" + hex;
}
return hex;
}
BoxParser.avc1Box.prototype.getCodec = function() {
var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
if (this.avcC) {
return baseCodec+"."+decimalToHex(this.avcC.AVCProfileIndication)+
""+decimalToHex(this.avcC.profile_compatibility)+
""+decimalToHex(this.avcC.AVCLevelIndication);
} else {
return baseCodec;
}
}
BoxParser.mp4aBox.prototype.getCodec = function() {
var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
if (this.esds && this.esds.esd) {
var oti = this.esds.esd.getOTI();
var dsi = this.esds.esd.getAudioConfig();
return baseCodec+"."+decimalToHex(oti)+(dsi ? "."+dsi: "");
} else {
return baseCodec;
}
}
BoxParser.esdsBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
this.data = stream.readUint8Array(this.size);
this.size = 0;
var esd_parser = new MPEG4DescriptorParser();
this.esd = esd_parser.parseOneDescriptor(new DataStream(this.data.buffer, 0, DataStream.BIG_ENDIAN));
}
BoxParser.cttsBox.prototype.parse = function(stream) {
var entry_count;
var i;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.sample_counts = [];
this.sample_offsets = [];
if (this.version === 0) {
for(i=0; i<entry_count; i++) {
this.sample_counts.push(stream.readUint32());
this.sample_offsets.push(stream.readUint32());
}
} else if (this.version == 1) {
for(i=0; i<entry_count; i++) {
this.sample_counts.push(stream.readUint32());
this.sample_offsets.push(stream.readInt32()); /* signed */
}
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.cttsBox.prototype.unpack = function(samples) {
var i, j, k;
k = 0;
for (i = 0; i < this.sample_counts.length; i++) {
for (j = 0; j < this.sample_counts[i]; j++) {
samples[k].pts = samples[k].dts + this.sample_offsets[i];
k++;
}
}
}
BoxParser.cslgBox.prototype.parse = function(stream) {
var entry_count;
this.parseFullHeader(stream);
if (this.version === 0) {
this.compositionToDTSShift = stream.readInt32(); /* signed */
this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
this.compositionStartTime = stream.readInt32(); /* signed */
this.compositionEndTime = stream.readInt32(); /* signed */
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.sttsBox.prototype.parse = function(stream) {
var entry_count;
var i;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.sample_counts = [];
this.sample_deltas = [];
if (this.version === 0) {
for(i=0; i<entry_count; i++) {
this.sample_counts.push(stream.readUint32());
this.sample_deltas.push(stream.readUint32());
}
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.sttsBox.prototype.unpack = function(samples) {
var i, j, k;
k = 0;
for (i = 0; i < this.sample_counts.length; i++) {
for (j = 0; j < this.sample_counts[i]; j++) {
if (k === 0) {
samples[k].dts = 0;
} else {
samples[k].dts = samples[k-1].dts + this.sample_deltas[i];
}
k++;
}
}
}
BoxParser.stssBox.prototype.parse = function(stream) {
var entry_count;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
if (this.version === 0) {
this.sample_numbers = stream.readUint32Array(entry_count);
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.stshBox.prototype.parse = function(stream) {
var entry_count;
var i;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.shadowed_sample_numbers = [];
this.sync_sample_numbers = [];
if (this.version === 0) {
for(i=0; i<entry_count; i++) {
this.shadowed_sample_numbers.push(stream.readUint32());
this.sync_sample_numbers.push(stream.readUint32());
}
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.stcoBox.prototype.parse = function(stream) {
var entry_count;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
if (this.version === 0) {
this.chunk_offsets = stream.readUint32Array(entry_count);
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.stcoBox.prototype.unpack = function(samples) {
var i;
for (i = 0; i < this.chunk_offsets.length; i++) {
samples[i].offset = this.chunk_offsets[i];
}
}
BoxParser.co64Box.prototype.parse = function(stream) {
var entry_count;
var i;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.chunk_offsets = [];
if (this.version === 0) {
for(i=0; i<entry_count; i++) {
this.chunk_offsets.push(stream.readUint64());
}
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.stscBox.prototype.parse = function(stream) {
var entry_count;
var i;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.first_chunk = [];
this.samples_per_chunk = [];
this.sample_description_index = [];
if (this.version === 0) {
for(i=0; i<entry_count; i++) {
this.first_chunk.push(stream.readUint32());
this.samples_per_chunk.push(stream.readUint32());
this.sample_description_index.push(stream.readUint32());
}
} else {
this.data = stream.readUint8Array(this.size-4);
}
}
BoxParser.stscBox.prototype.unpack = function(samples) {
var i, j, k, l, m;
l = 0;
m = 0;
for (i = 0; i < this.first_chunk.length; i++) {
for (j = 0; j < (i+1 < this.first_chunk.length ? this.first_chunk[i+1] : Infinity); j++) {
m++;
for (k = 0; k < this.samples_per_chunk[i]; k++) {
if (samples[l]) {
samples[l].description_index = this.sample_description_index[i];
samples[l].chunk_index = m;
} else {
return;
}
l++;
}
}
}
}
BoxParser.stszBox.prototype.parse = function(stream) {
var i;
var sample_size;
var sample_count;
this.parseFullHeader(stream);
this.sample_sizes = [];
if (this.version === 0) {
sample_size = stream.readUint32();
sample_count = stream.readUint32();
if (sample_size === 0) {
this.sample_sizes = stream.readUint32Array(sample_count);
} else {
this.sample_sizes = [];
for (i = 0; i < sample_count; i++) {
this.sample_sizes[i] = sample_size;
}
}
} else {
this.data = stream.readUint8Array(this.size);
}
}
BoxParser.stszBox.prototype.unpack = function(samples) {
var i;
for (i = 0; i < this.sample_sizes.length; i++) {
samples[i].size = this.sample_sizes[i];
}
}
BoxParser.mehdBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
if (this.version == 1) {
this.fragment_duration = stream.readUint64();
} else {
this.fragment_duration = stream.readUint32();
}
}
BoxParser.trexBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
this.track_id = stream.readUint32();
this.default_sample_description_index = stream.readUint32();
this.default_sample_duration = stream.readUint32();
this.default_sample_size = stream.readUint32();
this.default_sample_flags = stream.readUint32();
}
BoxParser.mfhdBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
this.sequence_number = stream.readUint32();
}
BoxParser.TFHD_FLAG_BASE_DATA_OFFSET	= 0x01;
BoxParser.TFHD_FLAG_SAMPLE_DESC	= 0x02;
BoxParser.TFHD_FLAG_SAMPLE_DUR	= 0x08;
BoxParser.TFHD_FLAG_SAMPLE_SIZE	= 0x10;
BoxParser.TFHD_FLAG_SAMPLE_FLAGS	= 0x20;
BoxParser.TFHD_FLAG_DUR_EMPTY	= 0x10000;
BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF	= 0x20000;
BoxParser.tfhdBox.prototype.parse = function(stream) {
var readBytes = 0;
this.parseFullHeader(stream);
this.track_id = stream.readUint32();
if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
this.base_data_offset = stream.readUint64();
readBytes += 8;
} else {
this.base_data_offset = 0;
}
if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC)) {
this.default_sample_description_index = stream.readUint32();
readBytes += 4;
} else {
this.default_sample_description_index = 0;
}
if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR)) {
this.default_sample_duration = stream.readUint32();
readBytes += 4;
} else {
this.default_sample_duration = 0;
}
if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE)) {
this.default_sample_size = stream.readUint32();
readBytes += 4;
} else {
this.default_sample_size = 0;
}
if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
this.default_sample_flags = stream.readUint32();
readBytes += 4;
} else {
this.default_sample_flags = 0;
}
}
BoxParser.TRUN_FLAGS_DATA_OFFSET	= 0x01;
BoxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
BoxParser.TRUN_FLAGS_DURATION	= 0x100;
BoxParser.TRUN_FLAGS_SIZE	= 0x200;
BoxParser.TRUN_FLAGS_FLAGS	= 0x400;
BoxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;
BoxParser.trunBox.prototype.parse = function(stream) {
var readBytes = 0;
this.parseFullHeader(stream);
this.sample_count = stream.readUint32();
readBytes+= 4;
if (this.size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ) {
this.data_offset = stream.readInt32(); //signed
readBytes += 4;
} else {
this.data_offset = 0;
}
if (this.size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) ) {
this.first_sample_flags = stream.readUint32();
readBytes += 4;
} else {
this.first_sample_flags = 0;
}
this.sample_duration = [];
this.sample_size = [];
this.sample_flags = [];
this.sample_composition_time_offset = [];
if (this.size > readBytes) {
for (var i = 0; i < this.sample_count; i++) {
if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
this.sample_duration[i] = stream.readUint32();
}
if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
this.sample_size[i] = stream.readUint32();
}
if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
this.sample_flags[i] = stream.readUint32();
}
if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
if (this.version === 0) {
this.sample_composition_time_offset[i] = stream.readUint32();
} else {
this.sample_composition_time_offset[i] = stream.readInt32(); //signed
}
}
}
}
}
BoxParser.tfdtBox.prototype.parse = function(stream) {
this.parseFullHeader(stream);
if (this.version == 1) {
this.baseMediaDecodeTime = stream.readUint64();
} else {
this.baseMediaDecodeTime = stream.readUint32();
}
}
BoxParser.paylBox.prototype.parse = function(stream) {
this.text = stream.readString(this.size);
}
BoxParser.subsBox.prototype.parse = function(stream) {
var i,j;
var entry_count;
var subsample_count;
this.parseFullHeader(stream);
entry_count = stream.readUint32();
this.samples = [];
for (i = 0; i < entry_count; i++) {
var sampleInfo = {};
this.samples[i] = sampleInfo;
sampleInfo.sample_delta = stream.readUint32();
sampleInfo.subsamples = [];
subsample_count = stream.readUint16();
if (subsample_count>0) {
for (j = 0; j < subsample_count; j++) {
var subsample = {};
sampleInfo.subsamples.push(subsample);
if (this.version == 1) {
subsample.size = stream.readUint32();
} else {
subsample.size = stream.readUint16();
}
subsample.priority = stream.readUint8();
subsample.discardable = stream.readUint8();
subsample.reserved = stream.readUint32();
}
}
}
}
BoxParser.Box.prototype.writeHeader = function(stream, msg) {
this.size += 8;
if (this.size > MAX_SIZE) {
this.size += 8;
}
Log.d("BoxWriter", "Writing box "+this.type+" of size: "+this.size+" at position "+stream.position+(msg || ""));
if (this.size > MAX_SIZE) {
stream.writeUint32(1);
} else {
this.sizePosition = stream.position;
stream.writeUint32(this.size);
}
stream.writeString(this.type, null, 4);
if (this.size > MAX_SIZE) {
stream.writeUint64(this.size);
}
}
BoxParser.FullBox.prototype.writeHeader = function(stream) {
this.size += 4;
BoxParser.Box.prototype.writeHeader.call(this, stream, " v="+this.version+" f="+this.flags);
stream.writeUint8(this.version);
stream.writeUint24(this.flags);
}
BoxParser.Box.prototype.write = function(stream) {
if (this.type === "mdat") {
/* TODO: fix this */
if (this.data) {
this.size = this.data.length;
this.writeHeader(stream);
stream.writeUint8Array(this.data);
}
} else {
this.size = this.data.length;
this.writeHeader(stream);
stream.writeUint8Array(this.data);
}
}
BoxParser.ContainerBox.prototype.write = function(stream) {
this.size = 0;
this.writeHeader(stream);
for (var i=0; i<this.boxes.length; i++) {
if (this.boxes[i]) {
this.boxes[i].write(stream);
this.size += this.boxes[i].size;
}
}
/* adjusting the size, now that all sub-boxes are known */
Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
stream.adjustUint32(this.sizePosition, this.size);
}
BoxParser.TrackReferenceTypeBox.prototype.write = function(stream) {
this.size = this.track_ids.length*4;
this.writeHeader(stream);
stream.writeUint32Array(this.track_ids);
}
BoxParser.ftypBox.prototype.write = function(stream) {
this.size = 8+4*this.compatible_brands.length;
this.writeHeader(stream);
stream.writeString(this.major_brand, null, 4);
stream.writeUint32(this.minor_version);
for (var i = 0; i < this.compatible_brands.length; i++) {
stream.writeString(this.compatible_brands[i], null, 4);
}
}
BoxParser.mvhdBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 23*4+2*2;
this.writeHeader(stream);
stream.writeUint32(this.creation_time);
stream.writeUint32(this.modification_time);
stream.writeUint32(this.timescale);
stream.writeUint32(this.duration);
stream.writeUint32(this.rate);
stream.writeUint16(this.volume<<8);
stream.writeUint16(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32Array(this.matrix);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(this.next_track_id);
}
BoxParser.tkhdBox.prototype.write = function(stream) {
this.version = 0;
//this.flags = 0;
this.size = 4*18+2*4;
this.writeHeader(stream);
stream.writeUint32(this.creation_time);
stream.writeUint32(this.modification_time);
stream.writeUint32(this.track_id);
stream.writeUint32(0);
stream.writeUint32(this.duration);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeInt16(this.layer);
stream.writeInt16(this.alternate_group);
stream.writeInt16(this.volume<<8);
stream.writeUint16(0);
stream.writeInt32Array(this.matrix);
stream.writeUint32(this.width);
stream.writeUint32(this.height);
}
BoxParser.mdhdBox.prototype.write = function(stream) {
this.size = 4*4+2*2;
this.flags = 0;
this.version = 0;
this.writeHeader(stream);
stream.writeUint32(this.creation_time);
stream.writeUint32(this.modification_time);
stream.writeUint32(this.timescale);
stream.writeUint32(this.duration);
stream.writeUint16(this.language);
stream.writeUint16(0);
}
BoxParser.hdlrBox.prototype.write = function(stream) {
this.size = 5*4+this.name.length+1;
this.version = 0;
this.flags = 0;
this.writeHeader(stream);
stream.writeUint32(0);
stream.writeString(this.handler, null, 4);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeCString(this.name);
}
BoxParser.stsdBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 0;
this.writeHeader(stream);
stream.writeUint32(this.entries.length);
this.size += 4;
for (i = 0; i < this.entries.length; i++) {
this.entries[i].write(stream);
this.size += this.entries[i].size;
}
/* adjusting the size, now that all sub-boxes are known */
Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
stream.adjustUint32(this.sizePosition, this.size);
}
BoxParser.SampleEntry.prototype.writeHeader = function(stream) {
this.size = 8;
BoxParser.Box.prototype.writeHeader.call(this, stream);
stream.writeUint8(0);
stream.writeUint8(0);
stream.writeUint8(0);
stream.writeUint8(0);
stream.writeUint8(0);
stream.writeUint8(0);
stream.writeUint16(this.data_reference_index);
}
BoxParser.SampleEntry.prototype.writeFooter = function(stream) {
for (var i=0; i<this.boxes.length; i++) {
this.boxes[i].write(stream);
this.size += this.boxes[i].size;
}
Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
stream.adjustUint32(this.sizePosition, this.size);
}
BoxParser.SampleEntry.prototype.write = function(stream) {
this.writeHeader(stream);
this.writeFooter(stream);
}
BoxParser.VisualSampleEntry.prototype.write = function(stream) {
this.writeHeader(stream);
this.size += 2*7+6*4+32;
stream.writeUint16(0);
stream.writeUint16(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint16(this.width);
stream.writeUint16(this.height);
stream.writeUint32(this.horizresolution);
stream.writeUint32(this.vertresolution);
stream.writeUint32(0);
stream.writeUint16(this.frame_count);
stream.writeString(this.compressorname, null, 32);
stream.writeUint16(this.depth);
stream.writeInt16(-1);
this.writeFooter(stream);
}
BoxParser.AudioSampleEntry.prototype.write = function(stream) {
this.writeHeader(stream);
this.size += 2*4+3*4;
stream.writeUint32(0);
stream.writeUint32(0);
stream.writeUint16(this.channel_count);
stream.writeUint16(this.samplesize);
stream.writeUint16(0);
stream.writeUint16(0);
stream.writeUint32(this.samplerate<<16);
this.writeFooter(stream);
}
BoxParser.avcCBox.prototype.write = function(stream) {
var i;
this.size = 7;
for (i = 0; i < this.SPS.length; i++) {
this.size += 2+this.SPS[i].length;
}
for (i = 0; i < this.PPS.length; i++) {
this.size += 2+this.PPS[i].length;
}
if (this.ext) {
this.size += this.ext.length;
}
this.writeHeader(stream);
stream.writeUint8(this.configurationVersion);
stream.writeUint8(this.AVCProfileIndication);
stream.writeUint8(this.profile_compatibility);
stream.writeUint8(this.AVCLevelIndication);
stream.writeUint8(this.lengthSizeMinusOne + (63<<2));
stream.writeUint8(this.SPS.length + (7<<5));
for (i = 0; i < this.SPS.length; i++) {
stream.writeUint16(this.SPS[i].length);
stream.writeUint8Array(this.SPS[i]);
}
stream.writeUint8(this.PPS.length);
for (i = 0; i < this.PPS.length; i++) {
stream.writeUint16(this.PPS[i].length);
stream.writeUint8Array(this.PPS[i]);
}
if (this.ext) {
stream.writeUint8Array(this.ext);
}
}
BoxParser.cttsBox.prototype.write = function(stream) {
var i;
this.version = 1;
this.flags = 0;
this.size = 4+8*this.sample_counts.length;
this.writeHeader(stream);
stream.writeUint32(this.sample_counts.length);
for(i=0; i<this.sample_counts.length; i++) {
stream.writeUint32(this.sample_counts[i]);
stream.writeInt32(this.sample_offsets[i]); /* signed */
}
}
BoxParser.cslgBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 4*5;
this.writeHeader(stream);
stream.writeInt32(this.compositionToDTSShift);
stream.writeInt32(this.leastDecodeToDisplayDelta);
stream.writeInt32(this.greatestDecodeToDisplayDelta);
stream.writeInt32(this.compositionStartTime);
stream.writeInt32(this.compositionEndTime);
}
BoxParser.sttsBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 4+8*this.sample_counts.length;
this.writeHeader(stream);
stream.writeUint32(this.sample_counts.length);
for(i=0; i<this.sample_counts.length; i++) {
stream.writeUint32(this.sample_counts[i]);
stream.writeUint32(this.sample_deltas[i]);
}
}
BoxParser.stssBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4+4*this.sample_numbers.length;
this.writeHeader(stream);
stream.writeUint32(this.sample_numbers.length);
stream.writeUint32Array(this.sample_numbers);
}
BoxParser.stshBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 4+8*this.shadowed_sample_numbers.length;
this.writeHeader(stream);
stream.writeUint32(this.shadowed_sample_numbers.length);
for(i=0; i<this.shadowed_sample_numbers.length; i++) {
stream.writeUint32(this.shadowed_sample_numbers[i]);
stream.writeUint32(this.sync_sample_numbers[i]);
}
}
BoxParser.stcoBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4+4*this.chunk_offsets.length;
this.writeHeader(stream);
stream.writeUint32(this.chunk_offsets.length);
stream.writeUint32Array(this.chunk_offsets);
}
BoxParser.co64Box.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 4+8*this.chunk_offsets.length;
this.writeHeader(stream);
stream.writeUint32(this.chunk_offsets.length);
for(i=0; i<this.chunk_offsets.length; i++) {
stream.writeUint64(this.chunk_offsets[i]);
}
}
BoxParser.stscBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 4+12*this.first_chunk.length;
this.writeHeader(stream);
stream.writeUint32(this.first_chunk.length);
for(i=0; i<this.first_chunk.length; i++) {
stream.writeUint32(this.first_chunk[i]);
stream.writeUint32(this.samples_per_chunk[i]);
stream.writeUint32(this.sample_description_index[i]);
}
}
BoxParser.stszBox.prototype.write = function(stream) {
var i;
this.version = 0;
this.flags = 0;
this.size = 8+12*this.sample_sizes.length;
this.writeHeader(stream);
stream.writeUint32(0);
stream.writeUint32(this.sample_sizes.length);
stream.writeUint32Array(this.sample_sizes);
}
BoxParser.mehdBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4;
this.writeHeader(stream);
stream.writeUint32(this.fragment_duration);
}
BoxParser.trexBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4*5;
this.writeHeader(stream);
stream.writeUint32(this.track_id);
stream.writeUint32(this.default_sample_description_index);
stream.writeUint32(this.default_sample_duration);
stream.writeUint32(this.default_sample_size);
stream.writeUint32(this.default_sample_flags);
}
BoxParser.mfhdBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4;
this.writeHeader(stream);
stream.writeUint32(this.sequence_number);
}
BoxParser.tfhdBox.prototype.write = function(stream) {
this.version = 0;
this.size = 4;
if (this.flags & BoxParser.TFHD_FLAG_BASE_OFFSET) {
this.size += 8;
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
this.size += 4;
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
this.size += 4;
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
this.size += 4;
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
this.size += 4;
}
this.writeHeader(stream);
stream.writeUint32(this.track_id);
if (this.flags & BoxParser.TFHD_FLAG_BASE_OFFSET) {
stream.writeUint64(this.base_data_offset);
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
stream.writeUint32(this.default_sample_description_index);
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
stream.writeUint32(this.default_sample_duration);
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
stream.writeUint32(this.default_sample_size);
}
if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
stream.writeUint32(this.default_sample_flags);
}
}
BoxParser.trunBox.prototype.write = function(stream) {
this.version = 0;
this.size = 4;
if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
this.size += 4;
}
if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
this.size += 4;
}
if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
this.size += 4*this.sample_duration.length;
}
if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
this.size += 4*this.sample_size.length;
}
if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
this.size += 4*this.sample_flags.length;
}
if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
this.size += 4*this.sample_composition_time_offset.length;
}
this.writeHeader(stream);
stream.writeUint32(this.sample_count);
if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
this.data_offset_position = stream.position;
stream.writeInt32(this.data_offset); //signed
}
if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
stream.writeUint32(this.first_sample_flags);
}
for (var i = 0; i < this.sample_count; i++) {
if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
stream.writeUint32(this.sample_duration[i]);
}
if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
stream.writeUint32(this.sample_size[i]);
}
if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
stream.writeUint32(this.sample_flags[i]);
}
if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
if (this.version === 0) {
stream.writeUint32(this.sample_composition_time_offset[i]);
} else {
stream.writeInt32(this.sample_composition_time_offset[i]); //signed
}
}
}
}
BoxParser.tfdtBox.prototype.write = function(stream) {
this.version = 0;
this.flags = 0;
this.size = 4;
this.writeHeader(stream);
if (this.version == 1) {
stream.writeUint64(this.baseMediaDecodeTime);
} else {
stream.writeUint32(this.baseMediaDecodeTime);
}
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var MPEG4DescriptorParser = function () {
var ES_DescrTag = 0x03;
var DecoderConfigDescrTag = 0x04;
var DecSpecificInfoTag = 0x05;
var SLConfigDescrTag = 0x06;
var descTagToName = [];
descTagToName[ES_DescrTag] = "ES_Descriptor";
descTagToName[DecoderConfigDescrTag] = "DecoderConfigDescriptor";
descTagToName[DecSpecificInfoTag] = "DecoderSpecificInfo";
descTagToName[SLConfigDescrTag] = "SLConfigDescriptor";
var that = this;
var classes = {};
this.parseOneDescriptor = function (stream) {
var hdrSize = 0;
var size = 0;
var tag;
var desc;
var byteRead;
tag = stream.readUint8();
hdrSize++;
byteRead = stream.readUint8();
hdrSize++;
while (byteRead & 0x80) {
size = (byteRead & 0x7F)<<7;
byteRead = stream.readUint8();
hdrSize++;
}
size += byteRead & 0x7F;
Log.d("MPEG4DescriptorParser", "Found "+(descTagToName[tag] | "Descriptor "+tag)+", size "+size+" at position "+stream.position);
if (descTagToName[tag]) {
desc = new classes[descTagToName[tag]](size);
} else {
desc = new classes.Descriptor(size);
}
desc.parse(stream);
return desc;
}
classes.Descriptor = function(_tag, _size) {
this.tag = _tag;
this.size = _size;
this.descs = [];
}
classes.Descriptor.prototype.parse = function (stream) {
this.data = stream.readUint8Array(this.size);
}
classes.Descriptor.prototype.findDescriptor = function (tag) {
for (var i = 0; i < this.descs.length; i++) {
if (this.descs[i].tag == tag) {
return this.descs[i];
}
}
return null;
}
classes.Descriptor.prototype.parseRemainingDescriptors = function (stream) {
var start = stream.position;
while (stream.position < start+this.size) {
var desc = that.parseOneDescriptor(stream);
this.descs.push(desc);
}
}
classes.ES_Descriptor = function (size) {
classes.Descriptor.call(this, ES_DescrTag, size);
}
classes.ES_Descriptor.prototype = new classes.Descriptor();
classes.ES_Descriptor.prototype.parse = function(stream) {
this.ES_ID = stream.readUint16();
this.flags = stream.readUint8();
this.size -= 3;
if (this.flags & 0x80) {
this.dependsOn_ES_ID = stream.readUint16();
this.size -= 2;
} else {
this.dependsOn_ES_ID = 0;
}
if (this.flags & 0x40) {
var l = stream.readUint8();
this.URL = stream.readString(l);
this.size -= l+1;
} else {
this.URL = null;
}
if (this.flags & 0x20) {
this.OCR_ES_ID = stream.readUint16();
this.size -= 2;
} else {
this.OCR_ES_ID = 0;
}
this.parseRemainingDescriptors(stream);
}
classes.ES_Descriptor.prototype.getOTI = function(stream) {
var dcd = this.findDescriptor(DecoderConfigDescrTag);
if (dcd) {
return dcd.oti;
} else {
return 0;
}
}
classes.ES_Descriptor.prototype.getAudioConfig = function(stream) {
var dcd = this.findDescriptor(DecoderConfigDescrTag);
if (!dcd) return null;
var dsi = dcd.findDescriptor(DecSpecificInfoTag);
if (dsi && dsi.data) {
return (dsi.data[0]& 0xF8) >> 3;
} else {
return null;
}
}
classes.DecoderConfigDescriptor = function (size) {
classes.Descriptor.call(this, DecoderConfigDescrTag, size);
}
classes.DecoderConfigDescriptor.prototype = new classes.Descriptor();
classes.DecoderConfigDescriptor.prototype.parse = function(stream) {
this.oti = stream.readUint8();
this.streamType = stream.readUint8();
this.bufferSize = stream.readUint24();
this.maxBitrate = stream.readUint32();
this.avgBitrate = stream.readUint32();
this.size -= 13;
this.parseRemainingDescriptors(stream);
}
classes.DecoderSpecificInfo = function (size) {
classes.Descriptor.call(this, DecSpecificInfoTag, size);
}
classes.DecoderSpecificInfo.prototype = new classes.Descriptor();
classes.SLConfigDescriptor = function (size) {
classes.Descriptor.call(this, SLConfigDescrTag, size);
}
classes.SLConfigDescriptor.prototype = new classes.Descriptor();
return this;
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var ISOFile = function (stream) {
this.stream = stream;
/* Array of all boxes (in order) found in the file */
this.boxes = [];
/* Array of all mdats */
this.mdats = [];
/* Array of all moofs */
this.moofs = [];
/* Boolean indicating if the file is compatible with progressive parsing (moov first) */
this.isProgressive = false;
/* Index of the last moof box received */
this.lastMoofIndex = 0;
/* position in the current buffer of the beginning of the last box parsed */
this.lastPosition = 0;
/* indicator if the parsing is stuck in the middle of an mdat box */
this.parsingMdat = false;
/* to fire moov start event */
this.moovStartFound = false;
/* size of the buffers allocated for samples */
this.samplesDataSize = 0;
/* next file position that the parser needs */
this.nextParsePosition = 0;
}
ISOFile.prototype.repositionAtMdatEnd = function(box, size) {
var i;
/* check which existing buffers contain data for this mdat, if any */
for (i = this.stream.bufferIndex; i < this.stream.nextBuffers.length; i++) {
var buf = this.stream.nextBuffers[i];
if (box.fileStart + size >= buf.fileStart) {
if (box.fileStart + size <= buf.fileStart + buf.byteLength) {
/* we've found the end of the mdat */
this.parsingMdat = false;
this.stream.buffer = buf;
this.stream.bufferIndex = i;
this.stream.position = box.fileStart + size - buf.fileStart;
Log.d("ISOFile", "Found 'mdat' end in buffer #"+this.stream.bufferIndex+" at position "+this.lastPosition);
return true;
} else {
/* this mdat box extends after that buffer, record that the mdat will need it */
box.buffers.push(buf);
}
}
}
return false;
}
ISOFile.prototype.findEndContiguousBuf = function() {
var i;
var currentBuf;
var nextBuf;
if (this.nextSeekPosition) {
/* find the buffer with the largest position smaller than the seek position
the seek can be in the past, we need to check from the beginning */
for (i = 0; i < this.stream.nextBuffers.length; i++) {
nextBuf = this.stream.nextBuffers[i];
if (nextBuf.fileStart <= this.nextSeekPosition) {
currentBuf = this.stream.nextBuffers[i];
this.stream.bufferIndex = i;
} else {
break;
}
}
} else {
currentBuf = this.stream.nextBuffers[this.stream.bufferIndex];
}
/* find the end of the contiguous range of data */
if (this.stream.nextBuffers.length > this.stream.bufferIndex) {
for (i = this.stream.bufferIndex+1; i < this.stream.nextBuffers.length; i++) {
nextBuf = this.stream.nextBuffers[i];
if (nextBuf.fileStart === currentBuf.fileStart + currentBuf.byteLength) {
currentBuf = nextBuf;
this.stream.bufferIndex = i;
} else {
break;
}
}
}
if (currentBuf.fileStart + currentBuf.byteLength >= this.nextSeekPosition) {
/* no need to seek anymore, the seek position is in the buffer */
delete this.nextSeekPosition;
}
return currentBuf.fileStart + currentBuf.byteLength;
}
ISOFile.prototype.parse = function() {
var found;
var ret;
var box;
Log.d("ISOFile","Starting parsing with buffer #"+this.stream.bufferIndex+" from position "+this.lastPosition+" ("+(this.stream.buffer.fileStart+this.lastPosition)+" in the file)");
this.stream.seek(this.lastPosition);
while (true) {
/* check if we are in the parsing of an incomplete mdat box */
if (this.parsingMdat) {
/* the current mdat is the latest one having been parsed */
box = this.mdats[this.mdats.length - 1];
found = this.repositionAtMdatEnd(box, box.size+box.hdr_size);
if (found) {
/* the end of the mdat has been found, let's see if we can parse more in this buffer */
continue;
} else {
/* let's wait for more buffer to come */
this.nextParsePosition = this.findEndContiguousBuf();
return;
}
} else {
/* remember the position of the box start in case we need to roll back */
this.lastPosition = this.stream.position;
ret = BoxParser.parseOneBox(this.stream);
if (ret.code == BoxParser.ERR_NOT_ENOUGH_DATA) {
/* we did not have enough bytes in the current buffer to parse the entire box */
if (ret.type === "mdat") {
/* we had enough bytes to get its type and size */
/* special handling for mdat boxes, since we don't actually need to parse it linearly */
this.parsingMdat = true;
box = new BoxParser[ret.type+"Box"](ret.size-ret.hdr_size);
this.mdats.push(box);
box.fileStart = this.stream.buffer.fileStart + this.stream.position;
box.hdr_size = ret.hdr_size;
box.buffers = [];
box.buffers[0] = this.stream.buffer;
this.stream.buffer.usedBytes += ret.hdr_size;
/* let's see if we have the end of the box in the other buffers */
found = this.repositionAtMdatEnd(box, box.size+box.hdr_size);
if (found) {
/* let's see if we can parse more in this buffer */
continue;
} else {
/* determine the next position */
if (this.moovStartFound) {
/* let's wait for more buffer to come */
this.nextParsePosition = this.findEndContiguousBuf();
} else {
/* moov not find yet, skip this box */
this.nextParsePosition = box.fileStart + box.size+box.hdr_size;
}
return;
}
} else {
if (ret.type === "moov") {
this.moovStartFound = true;
}
/* either it's not an mdat box (and we need to parse it, we cannot skip it)
or we did not have enough data to parse the type and size of the box,
we try to concatenate the current buffer with the next buffer to restart parsing */
if (this.stream.bufferIndex < this.stream.nextBuffers.length - 1) {
var next_buffer = this.stream.nextBuffers[this.stream.bufferIndex+1];
if (next_buffer.fileStart === this.stream.buffer.fileStart + this.stream.buffer.byteLength) {
var oldLength = this.stream.buffer.byteLength;
var oldUsedBytes = this.stream.buffer.usedBytes;
var oldFileStart = this.stream.buffer.fileStart;
this.stream.nextBuffers[this.stream.bufferIndex] = ArrayBuffer.concat(this.stream.buffer, next_buffer);
this.stream.buffer = this.stream.nextBuffers[this.stream.bufferIndex];
this.stream.nextBuffers.splice(this.stream.bufferIndex+1, 1);
this.stream.buffer.usedBytes = oldUsedBytes;
this.stream.buffer.fileStart = oldFileStart;
/* The next best position to parse is at the end of this new buffer */
this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
Log.d("ISOFile", "Concatenating buffer for box parsing (length: "+oldLength+"->"+this.stream.buffer.byteLength+")");
continue;
} else {
/* we cannot concatenate because the buffers are not contiguous */
/* The next best position to parse is at the end of this old buffer */
this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
return;
}
} else {
/* not enough buffers received, wait */
if (!ret.type) {
/* There were not enough bytes in the buffer to parse the box type and length,
the next fetch should retrieve those missing bytes, i.e. the next bytes after this buffer */
this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
} else {
/* we had enough bytes to parse size and type of the incomplete box
if we haven't found yet the moov box, skip this one and try the next one
if we have found the moov box, let's continue linear parsing */
if (this.moovStartFound) {
this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
} else {
this.nextParsePosition = this.stream.buffer.fileStart + this.stream.position + ret.size;
}
}
return;
}
}
} else {
/* the box is entirely parsed */
box = ret.box;
/* store the box in the 'boxes' array to preserve box order (for offset)
but also store box in a property for more direct access */
this.boxes.push(box);
switch (box.type) {
case "mdat":
this.mdats.push(box);
box.fileStart = this.stream.buffer.fileStart + box.start;
box.buffers = [ this.stream.buffer ];
this.stream.buffer.usedBytes += box.hdr_size;
break;
case "moof":
this.moofs.push(box);
this.stream.buffer.usedBytes += ret.size;
break;
case "moov":
this.moovStartFound = true;
if (this.mdats.length === 0) {
this.isProgressive = true;
}
this[box.type] = box;
this.stream.buffer.usedBytes += ret.size;
break;
default:
this[box.type] = box;
this.stream.buffer.usedBytes += ret.size;
break;
}
}
}
}
}
ISOFile.prototype.write = function(outstream) {
for (var i=0; i<this.boxes.length; i++) {
this.boxes[i].write(outstream);
}
}
ISOFile.prototype.writeInitializationSegment = function(outstream) {
var i;
Log.d("ISOFile", "Generating initialization segment");
this.ftyp.write(outstream);
if (this.moov.mvex) {
var index;
this.initial_duration = this.moov.mvex.fragment_duration;
for (i = 0; i < this.moov.boxes.length; i++) {
var box = this.moov.boxes[i];
if (box == this.moov.mvex) {
index = i;
}
}
if (index > -1) {
this.moov.boxes.splice(index, 1);
}
}
var mvex = new BoxParser.mvexBox();
this.moov.boxes.push(mvex);
var mehd = new BoxParser.mehdBox();
mvex.boxes.push(mehd);
mehd.fragment_duration = this.initial_duration;
for (i = 0; i < this.moov.traks.length; i++) {
var trex = new BoxParser.trexBox();
mvex.boxes.push(trex);
trex.track_id = this.moov.traks[i].tkhd.track_id;
trex.default_sample_description_index = 1;
trex.default_sample_duration = (this.moov.traks[i].samples.length>0 ? this.moov.traks[i].samples[0].duration: 0);
trex.default_sample_size = 0;
trex.default_sample_flags = 1<<16;
}
this.moov.write(outstream);
}
ISOFile.prototype.resetTables = function () {
var i;
var trak, stco, stsc, stsz, stts, ctts, stss;
this.initial_duration = this.moov.mvhd.duration;
this.moov.mvhd.duration = 0;
for (i = 0; i < this.moov.traks.length; i++) {
trak = this.moov.traks[i];
trak.tkhd.duration = 0;
trak.mdia.mdhd.duration = 0;
stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
stco.chunk_offsets = [];
stsc = trak.mdia.minf.stbl.stsc;
stsc.first_chunk = [];
stsc.samples_per_chunk = [];
stsc.sample_description_index = [];
stsz = trak.mdia.minf.stbl.stsz;
stsz.sample_sizes = [];
stts = trak.mdia.minf.stbl.stts;
stts.sample_counts = [];
stts.sample_deltas = [];
ctts = trak.mdia.minf.stbl.ctts;
if (ctts) {
ctts.sample_counts = [];
ctts.sample_offsets = [];
}
stss = trak.mdia.minf.stbl.stss;
var k = trak.mdia.minf.stbl.boxes.indexOf(stss);
if (k != -1) trak.mdia.minf.stbl.boxes[k] = null;
}
}
ISOFile.prototype.buildSampleLists = function() {
var i, j, k;
var trak, stco, stsc, stsz, stts, ctts, stss, stsd, subs;
var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index, last_subs_index;
for (i = 0; i < this.moov.traks.length; i++) {
trak = this.moov.traks[i];
trak.samples = [];
stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
stsc = trak.mdia.minf.stbl.stsc;
stsz = trak.mdia.minf.stbl.stsz;
stts = trak.mdia.minf.stbl.stts;
ctts = trak.mdia.minf.stbl.ctts;
stss = trak.mdia.minf.stbl.stss;
stsd = trak.mdia.minf.stbl.stsd;
subs = trak.mdia.minf.stbl.subs;
chunk_index = -1;
chunk_run_index = -1;
last_chunk_in_run = -1;
offset_in_chunk = 0;
last_sample_in_chunk = 0;
last_sample_in_stts_run = -1;
stts_run_index = -1;
last_sample_in_ctts_run = -1;
ctts_run_index = -1;
last_stss_index = 0;
subs_entry_index = 0;
last_subs_sample_index = 0;
/* we build the samples one by one and compute their properties */
for (j = 0; j < stsz.sample_sizes.length; j++) {
var sample = {};
sample.track_id = trak.tkhd.track_id;
sample.timescale = trak.mdia.mdhd.timescale;
trak.samples[j] = sample;
/* size can be known directly */
sample.size = stsz.sample_sizes[j];
/* computing chunk-based properties (offset, sample description index)*/
if (j < last_sample_in_chunk) {
/* the new sample is in the same chunk, the indexes did not change */
sample.chunk_index = chunk_index;
sample.chunk_run_index = chunk_run_index;
} else {
/* the new sample is not in this chunk */
offset_in_chunk = 0;
chunk_index++;
sample.chunk_index = chunk_index;
if (chunk_index < last_chunk_in_run) {
/* this new chunk in the same run of chunks */
sample.chunk_run_index = chunk_run_index;
} else {
/* this chunk starts a new run */
if (chunk_run_index < stsc.first_chunk.length - 2) {
/* the last chunk in this new run is the beginning of the next one */
chunk_run_index++;
last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; // chunk number are 1-based
} else {
/* the last chunk run in indefinitely long */
last_chunk_in_run = Infinity;
}
}
last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
sample.chunk_run_index = chunk_run_index;
}
sample.description = stsd.entries[stsc.sample_description_index[sample.chunk_run_index]-1];
sample.offset = stco.chunk_offsets[sample.chunk_index] + offset_in_chunk;
offset_in_chunk += sample.size;
/* setting dts, cts, duration and rap flags */
if (j >= last_sample_in_stts_run) {
stts_run_index++;
if (last_sample_in_stts_run < 0) {
last_sample_in_stts_run = 0;
}
last_sample_in_stts_run += stts.sample_counts[stts_run_index];
}
if (j > 0) {
sample.dts = trak.samples[j-1].dts + stts.sample_deltas[stts_run_index];
trak.samples[j-1].duration = sample.dts - trak.samples[j-1].dts;
} else {
sample.dts = 0;
}
if (ctts) {
if (j >= last_sample_in_ctts_run) {
ctts_run_index++;
if (last_sample_in_ctts_run < 0) {
last_sample_in_ctts_run = 0;
}
last_sample_in_ctts_run += ctts.sample_counts[ctts_run_index];
}
sample.cts = trak.samples[j].dts + ctts.sample_offsets[ctts_run_index];
} else {
sample.cts = sample.dts;
}
if (stss) {
if (j == stss.sample_numbers[last_stss_index] - 1) { // sample numbers are 1-based
sample.is_rap = true;
last_stss_index++;
} else {
sample.is_rap = false;
}
} else {
sample.is_rap = true;
}
if (subs) {
if (subs.samples[subs_entry_index].sample_delta + last_subs_sample_index == j) {
sample.subsamples = subs.samples[subs_entry_index].subsamples;
last_subs_sample_index += subs.samples[subs_entry_index].sample_delta;
}
}
}
if (j>0) trak.samples[j-1].duration = trak.mdia.mdhd.duration - trak.samples[j-1].dts;
}
}
ISOFile.prototype.getTrexById = function(id) {
var i;
if (!this.moov || !this.moov.mvex) return null;
for (i = 0; i < this.moov.mvex.trexs.length; i++) {
var trex = this.moov.mvex.trexs[i];
if (trex.track_id == id) return trex;
}
return null;
}
ISOFile.prototype.updateSampleLists = function() {
var i, j, k;
var default_sample_description_index, default_sample_duration, default_sample_size, default_sample_flags;
var last_run_position;
var box, moof, traf, trak, trex;
var sample;
while (this.lastMoofIndex < this.moofs.length) {
box = this.moofs[this.lastMoofIndex];
this.lastMoofIndex++;
if (box.type == "moof") {
moof = box;
for (i = 0; i < moof.trafs.length; i++) {
traf = moof.trafs[i];
trak = this.getTrackById(traf.tfhd.track_id);
trex = this.getTrexById(traf.tfhd.track_id);
if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
default_sample_description_index = traf.tfhd.default_sample_description_index;
} else {
default_sample_description_index = trex.default_sample_description_index;
}
if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
default_sample_duration = traf.tfhd.default_sample_duration;
} else {
default_sample_duration = trex.default_sample_duration;
}
if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
default_sample_size = traf.tfhd.default_sample_size;
} else {
default_sample_size = trex.default_sample_size;
}
if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
default_sample_flags = traf.tfhd.default_sample_flags;
} else {
default_sample_flags = trex.default_sample_flags;
}
for (j = 0; j < traf.truns.length; j++) {
var trun = traf.truns[j];
for (k = 0; k < trun.sample_count; k++) {
sample = {};
traf.first_sample_index = trak.samples.length;
trak.samples.push(sample);
sample.track_id = trak.tkhd.track_id;
sample.timescale = trak.mdia.mdhd.timescale;
sample.description = trak.mdia.minf.stbl.stsd.entries[default_sample_description_index-1];
sample.size = default_sample_size;
if (trun.flags & BoxParser.TRUN_FLAGS_SIZE) {
sample.size = trun.sample_size[k];
}
sample.duration = default_sample_duration;
if (trun.flags & BoxParser.TRUN_FLAGS_DURATION) {
sample.duration = trun.sample_duration[k];
}
if (trak.first_traf_merged || k > 0) {
sample.dts = trak.samples[trak.samples.length-2].dts+trak.samples[trak.samples.length-2].duration;
} else {
if (traf.tfdt) {
sample.dts = traf.tfdt.baseMediaDecodeTime;
} else {
sample.dts = 0;
}
trak.first_traf_merged = true;
}
sample.cts = sample.dts;
if (trun.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
sample.cts = sample.dts + trun.sample_composition_time_offset[k];
}
sample_flags = default_sample_flags;
if (trun.flags & BoxParser.TRUN_FLAGS_FLAGS) {
sample_flags = trun.sample_flags[k];
} else if (k === 0 && (trun.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG)) {
sample_flags = trun.first_sample_flags;
}
sample.is_rap = ((sample_flags >> 16 & 0x1) ? false : true);
var bdop = (traf.tfhd.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) ? true : false;
var dbim = (traf.tfhd.flags & BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF) ? true : false;
var dop = (trun.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ? true : false;
var bdo = 0;
if (!bdop) {
if (!dbim) {
if (j === 0) { // the first track in the movie fragment
bdo = moof.fileStart; // the position of the first byte of the enclosing Movie Fragment Box
} else {
bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
}
} else {
bdo = moof.fileStart;
}
} else {
bdo = traf.tfhd.base_data_offset;
}
if (j === 0 && k === 0) {
if (dop) {
sample.offset = bdo + trun.data_offset; // If the data-offset is present, it is relative to the base-data-offset established in the track fragment header
} else {
sample.offset = bdo; // the data for this run starts the base-data-offset defined by the track fragment header
}
} else {
sample.offset = last_run_position; // this run starts immediately after the data of the previous run
}
last_run_position = sample.offset + sample.size;
}
}
if (traf.subs) {
var sample_index = traf.first_sample_index;
for (j = 0; j < traf.subs.samples.length; j++) {
sample_index += traf.subs.samples[j].sample_delta;
sample = trak.samples[sample_index-1];
sample.subsamples = traf.subs.samples[j].subsamples;
}
}
}
}
}
}
ISOFile.prototype.getCodecs = function() {
var i;
var codecs = "";
for (i = 0; i < this.moov.traks.length; i++) {
var trak = this.moov.traks[i];
if (i>0) {
codecs+=",";
}
codecs += trak.mdia.minf.stbl.stsd.entries[0].getCodec();
}
return codecs;
}
ISOFile.prototype.getTrackById = function(id) {
for (var j = 0; j < this.moov.traks.length; j++) {
var trak = this.moov.traks[j];
if (trak.tkhd.track_id == id) return trak;
}
return null;
}
ISOFile.prototype.getSample = function(trak, sampleNum) {
var mdat;
var buffer;
var i, j;
var sample = trak.samples[sampleNum];
if (!sample.data) {
sample.data = new Uint8Array(sample.size);
sample.alreadyRead = 0;
this.samplesDataSize += sample.size;
Log.d("ISOFile", "Allocating sample #"+sampleNum+" on track #"+trak.tkhd.track_id+" of size "+sample.size+" (total: "+this.samplesDataSize+")");
} else if (sample.alreadyRead == sample.size) {
return sample;
}
for (i = 0; i < this.mdats.length; i++) {
mdat = this.mdats[i];
for (j = 0; j < mdat.buffers.length; j++) {
buffer = mdat.buffers[j];
if (sample.offset + sample.alreadyRead >= buffer.fileStart &&
sample.offset + sample.alreadyRead < buffer.fileStart + buffer.byteLength) {
/* The sample starts in this buffer */
var lengthAfterStart = buffer.byteLength - (sample.offset + sample.alreadyRead - buffer.fileStart);
if (sample.size - sample.alreadyRead <= lengthAfterStart) {
/* the sample is entirely contained in this buffer */
Log.d("ISOFile","Getting sample #"+sampleNum+" data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+(sample.size - sample.alreadyRead)+")");
DataStream.memcpy(sample.data.buffer, sample.alreadyRead,
buffer, sample.offset+sample.alreadyRead - buffer.fileStart, sample.size - sample.alreadyRead);
buffer.usedBytes += sample.size - sample.alreadyRead;
sample.alreadyRead = sample.size;
if (buffer.usedBytes == buffer.byteLength) {
mdat.buffers.splice(j, 1);
Log.d("ISOFile","Removing buffer for mdat ("+mdat.buffers.length+" buffers left)");
j--;
}
return sample;
} else {
/* the sample does not end in this buffer */
Log.d("ISOFile","Getting sample data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+lengthAfterStart+")");
DataStream.memcpy(sample.data.buffer, sample.alreadyRead,
buffer, sample.offset+sample.alreadyRead - buffer.fileStart, lengthAfterStart);
buffer.usedBytes += lengthAfterStart;
if (buffer.usedBytes == buffer.byteLength) {
mdat.buffers.splice(j, 1);
Log.d("ISOFile","Removing buffer for mdat ("+mdat.buffers.length+" buffers left)");
j--;
}
sample.alreadyRead += lengthAfterStart;
}
}
}
if (mdat.buffers.length === 0 && this.mdats.length > 1) {
this.mdats.splice(i, 1);
i--;
}
}
return null;
}
ISOFile.prototype.releaseSample = function(trak, sampleNum) {
var sample = trak.samples[sampleNum];
sample.data = null;
this.samplesDataSize -= sample.size;
return sample.size;
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var Log = (function (){
var start = new Date();
var LOG_LEVEL_ERROR = 4;
var LOG_LEVEL_WARNING = 3;
var LOG_LEVEL_INFO = 2;
var LOG_LEVEL_DEBUG	= 1;
//modif to remove
var log_level = (typeof document!=='undefined')?((document.location.href.indexOf('mp4box')!==-1)?LOG_LEVEL_DEBUG:LOG_LEVEL_ERROR):LOG_LEVEL_ERROR;
var logObject = {
setLogLevel : function(level) {
if (level == this.d) log_level = LOG_LEVEL_DEBUG;
else if (level == this.i) log_level = LOG_LEVEL_INFO;
else if (level == this.w) log_level = LOG_LEVEL_WARNING;
else if (level == this.e) log_level = LOG_LEVEL_ERROR;
else log_level = LOG_LEVEL_ERROR;
},
d : function(module, msg) {
if (LOG_LEVEL_DEBUG >= log_level) {
console.debug("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
}
},
i : function(module, msg) {
if (LOG_LEVEL_INFO >= log_level) {
console.info("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
}
},
w : function(module, msg) {
if (LOG_LEVEL_WARNING >= log_level) {
console.warn("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
}
},
e : function(module, msg) {
if (LOG_LEVEL_ERROR >= log_level) {
console.error("["+Log.getDurationString(new Date()-start,1000)+"]","["+module+"]",msg);
}
}
};
return logObject;
})();
/* Helper function to print a duration value in the form H:MM:SS.MS */
Log.getDurationString = function(duration, _timescale) {
/* Helper function to print a number on a fixed number of digits */
function pad(number, length) {
var str = '' + number;
var a = str.split('.');
while (a[0].length < length) {
a[0] = '0' + a[0];
}
return a.join('.');
}
var timescale = _timescale || 1;
var duration_sec = duration/timescale;
var hours = Math.floor(duration_sec/3600);
duration_sec -= hours * 3600;
var minutes = Math.floor(duration_sec/60);
duration_sec -= minutes * 60;
var msec = duration_sec*1000;
duration_sec = Math.floor(duration_sec);
msec -= duration_sec*1000;
msec = Math.floor(msec);
return ""+hours+":"+pad(minutes,2)+":"+pad(duration_sec,2)+"."+pad(msec,3);
}
/* Helper function to stringify HTML5 TimeRanges objects */
Log.printRanges = function(ranges) {
var length = ranges.length;
if (length > 0) {
var str = "";
for (var i = 0; i < length; i++) {
if (i > 0) str += ",";
str += "["+Log.getDurationString(ranges.start(i))+ ","+Log.getDurationString(ranges.end(i))+"]";
}
return str;
} else {
return "(empty)";
}
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var MP4Box = function () {
/* DataStream object used to parse the boxes */
this.inputStream = null;
/* List of ArrayBuffers, with a fileStart property, sorted in order and non overlapping */
this.nextBuffers = [];
/* ISOFile object containing the parsed boxes */
this.inputIsoFile = null;
/* Callback called when the moov parsing starts */
this.onMoovStart = null;
/* Boolean keeping track of the call to onMoovStart, to avoid double calls */
this.moovStartSent = false;
/* Callback called when the moov is entirely parsed */
this.onReady = null;
/* Boolean keeping track of the call to onReady, to avoid double calls */
this.readySent = false;
/* Callback to call when segments are ready */
this.onSegment = null;
/* Callback to call when samples are ready */
this.onSamples = null;
/* Callback to call when there is an error in the parsing or processing of samples */
this.onError = null;
/* Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
this.sampleListBuilt = false;
this.fragmentedTracks = [];
this.extractedTracks = [];
this.isFragmentationStarted = false;
this.nextMoofNumber = 0;
}
MP4Box.prototype.setSegmentOptions = function(id, user, options) {
var trak = this.inputIsoFile.getTrackById(id);
if (trak) {
var fragTrack = {};
this.fragmentedTracks.push(fragTrack);
fragTrack.id = id;
fragTrack.user = user;
fragTrack.trak = trak;
trak.nextSample = 0;
fragTrack.segmentStream = null;
fragTrack.nb_samples = 1000;
fragTrack.rapAlignement = true;
if (options) {
if (options.nbSamples) fragTrack.nb_samples = options.nbSamples;
if (options.rapAlignement) fragTrack.rapAlignement = options.rapAlignement;
}
}
}
MP4Box.prototype.unsetSegmentOptions = function(id) {
var index = -1;
for (var i = 0; i < this.fragmentedTracks.length; i++) {
var fragTrack = this.fragmentedTracks[i];
if (fragTrack.id == id) {
index = i;
}
}
if (index > -1) {
this.fragmentedTracks.splice(index, 1);
}
}
MP4Box.prototype.setExtractionOptions = function(id, user, options) {
var trak = this.inputIsoFile.getTrackById(id);
if (trak) {
var extractTrack = {};
this.extractedTracks.push(extractTrack);
extractTrack.id = id;
extractTrack.user = user;
extractTrack.trak = trak;
trak.nextSample = 0;
extractTrack.nb_samples = 1000;
extractTrack.samples = [];
if (options) {
if (options.nbSamples) extractTrack.nb_samples = options.nbSamples;
}
}
}
MP4Box.prototype.unsetExtractionOptions = function(id) {
var index = -1;
for (var i = 0; i < this.extractedTracks.length; i++) {
var extractTrack = this.extractedTracks[i];
if (extractTrack.id == id) {
index = i;
}
}
if (index > -1) {
this.extractedTracks.splice(index, 1);
}
}
MP4Box.prototype.createSingleSampleMoof = function(sample) {
var moof = new BoxParser.moofBox();
var mfhd = new BoxParser.mfhdBox();
mfhd.sequence_number = this.nextMoofNumber;
this.nextMoofNumber++;
moof.boxes.push(mfhd);
var traf = new BoxParser.trafBox();
moof.boxes.push(traf);
var tfhd = new BoxParser.tfhdBox();
traf.boxes.push(tfhd);
tfhd.track_id = sample.track_id;
tfhd.flags = BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF;
var tfdt = new BoxParser.tfdtBox();
traf.boxes.push(tfdt);
tfdt.baseMediaDecodeTime = sample.dts;
var trun = new BoxParser.trunBox();
traf.boxes.push(trun);
moof.trun = trun;
trun.flags = BoxParser.TRUN_FLAGS_DATA_OFFSET | BoxParser.TRUN_FLAGS_DURATION |
BoxParser.TRUN_FLAGS_SIZE | BoxParser.TRUN_FLAGS_FLAGS |
BoxParser.TRUN_FLAGS_CTS_OFFSET;
trun.data_offset = 0;
trun.first_sample_flags = 0;
trun.sample_count = 1;
trun.sample_duration = [];
trun.sample_duration[0] = sample.duration;
trun.sample_size = [];
trun.sample_size[0] = sample.size;
trun.sample_flags = [];
trun.sample_flags[0] = 0;
trun.sample_composition_time_offset = [];
trun.sample_composition_time_offset[0] = sample.cts - sample.dts;
return moof;
}
MP4Box.prototype.createFragment = function(input, track_id, sampleNumber, stream_) {
var trak = this.inputIsoFile.getTrackById(track_id);
var sample = this.inputIsoFile.getSample(trak, sampleNumber);
if (sample == null) {
return null;
}
var stream = stream_ || new DataStream();
stream.endianness = DataStream.BIG_ENDIAN;
var moof = this.createSingleSampleMoof(sample);
moof.write(stream);
/* adjusting the data_offset now that the moof size is known*/
moof.trun.data_offset = moof.size+8; //8 is mdat header
Log.d("BoxWriter", "Adjusting data_offset with new value "+moof.trun.data_offset);
stream.adjustUint32(moof.trun.data_offset_position, moof.trun.data_offset);
var mdat = new BoxParser.mdatBox();
mdat.data = sample.data;
mdat.write(stream);
return stream;
}
/* helper functions to enable calling "open" with additional buffers */
ArrayBuffer.concat = function(buffer1, buffer2) {
Log.d("ArrayBuffer", "Trying to create a new buffer of size: "+(buffer1.byteLength + buffer2.byteLength));
var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
tmp.set(new Uint8Array(buffer1), 0);
tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
return tmp.buffer;
};
MP4Box.prototype.insertBuffer = function(ab) {
var smallB;
var to_add = true;
/* insert the new buffer in the sorted list of buffers, making sure, it is not overlapping with existing ones */
for (var i = 0; i < this.nextBuffers.length; i++) {
var b = this.nextBuffers[i];
if (ab.fileStart <= b.fileStart) {
/* the insertion position is found */
if (ab.fileStart === b.fileStart) {
/* The new buffer overlaps with an existing buffer */
if (ab.byteLength > b.byteLength) {
/* the new buffer is bigger than the existing one
remove the existing buffer and try again to insert
the new buffer to check overlap with the next ones */
this.nextBuffers.splice(i, 1);
i--;
continue;
} else {
/* the new buffer is smaller than the existing one, just drop it */
Log.w("MP4Box", "Buffer already appended, ignoring");
}
} else {
/* The beginning of the new buffer is not overlapping with an existing buffer
let's check the end of it */
if (ab.fileStart + ab.byteLength <= b.fileStart) {
/* no overlap, we can add it as is */
Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
this.nextBuffers.splice(i, 0, ab);
if (i === 0 && this.inputStream != null) {
this.inputStream.buffer = ab;
}
} else {
/* There is some overlap, cut the new buffer short, and add it*/
smallB = new Uint8Array(b.fileStart - ab.fileStart);
smallB.set(new Uint8Array(ab, 0, b.fileStart - ab.fileStart));
smallB.fileStart = ab.fileStart;
ab = smallB;
ab.usedBytes = 0;
Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
this.nextBuffers.splice(i, 0, ab);
if (i === 0 && this.inputStream != null) {
this.inputStream.buffer = ab;
}
}
}
to_add = false;
break;
} else if (ab.fileStart < b.fileStart + b.byteLength) {
/* the new buffer overlaps its end with the current buffer */
var offset = b.fileStart + b.byteLength - ab.fileStart;
var newLength = ab.byteLength - offset;
smallB = new Uint8Array(newLength);
smallB.set(new Uint8Array(ab, offset, newLength));
smallB.buffer.fileStart = ab.fileStart+offset;
ab = smallB.buffer;
ab.usedBytes = 0;
}
}
if (to_add) {
Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
this.nextBuffers.push(ab);
if (i === 0 && this.inputStream != null) {
this.inputStream.buffer = ab;
}
}
}
MP4Box.prototype.open = function() {
if (!this.inputStream) { /* We create the DataStream object only when we have the first bytes of the file */
if (this.nextBuffers.length > 0) {
var firstBuffer = this.nextBuffers[0];
if (firstBuffer.fileStart === 0) {
this.inputStream = new DataStream(firstBuffer, 0, DataStream.BIG_ENDIAN);
this.inputStream.nextBuffers = this.nextBuffers;
this.inputStream.bufferIndex = 0;
} else {
Log.w("MP4Box", "The first buffer should have a fileStart of 0");
return false;
}
} else {
Log.w("MP4Box", "No buffer to start parsing from");
return false;
}
}
/* Initialize the ISOFile object if not yet created */
if (!this.inputIsoFile) {
this.inputIsoFile = new ISOFile(this.inputStream);
}
/* Parse whatever is already in the buffer */
this.inputIsoFile.parse();
if (this.inputIsoFile.moovStartFound && !this.moovStartSent) {
this.moovStartSent = true;
if (this.onMoovStart) this.onMoovStart();
}
if (!this.inputIsoFile.moov) {
/* The parsing has not yet found a moov, not much can be done */
return false;
} else {
/* A moov box has been found */
/* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
if (!this.sampleListBuilt) {
this.inputIsoFile.buildSampleLists();
this.sampleListBuilt = true;
}
/* We update the sample information if there are any new moof boxes */
this.inputIsoFile.updateSampleLists();
/* If the application needs to be informed that the 'moov' has been found,
we create the information object and callback the application */
if (this.onReady && !this.readySent) {
var info = this.getInfo();
this.readySent = true;
this.onReady(info);
}
return true;
}
}
MP4Box.prototype.processSamples = function() {
var i;
var trak;
/* For each track marked for fragmentation,
check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded)
and create a fragment with it */
if (this.isFragmentationStarted && this.onSegment !== null) {
for (i = 0; i < this.fragmentedTracks.length; i++) {
var fragTrak = this.fragmentedTracks[i];
trak = fragTrak.trak;
while (trak.nextSample < trak.samples.length) {
/* The sample information is there (either because the file is not fragmented and this is not the last sample,
or because the file is fragmented and the moof for that sample has been received */
Log.d("MP4Box", "Creating media fragment on track #"+fragTrak.id +" for sample "+trak.nextSample);
var result = this.createFragment(this.inputIsoFile, fragTrak.id, trak.nextSample, fragTrak.segmentStream);
if (result) {
fragTrak.segmentStream = result;
trak.nextSample++;
} else {
/* The fragment could not be created because the media data is not there (not downloaded), wait for it */
break;
}
/* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
if (trak.nextSample % fragTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
Log.i("MP4Box", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+(trak.nextSample-fragTrak.nb_samples)+","+(trak.nextSample-1)+"]");
if (this.onSegment) {
this.onSegment(fragTrak.id, fragTrak.user, fragTrak.segmentStream.buffer, trak.nextSample);
}
/* force the creation of a new buffer */
fragTrak.segmentStream = null;
if (fragTrak !== this.fragmentedTracks[i]) {
/* make sure we can stop fragmentation if needed */
break;
}
}
}
}
}
if (this.onSamples !== null) {
/* For each track marked for data export,
check if the next sample is there (i.e. has been downloaded) and send it */
for (i = 0; i < this.extractedTracks.length; i++) {
var extractTrak = this.extractedTracks[i];
trak = extractTrak.trak;
while (trak.nextSample < trak.samples.length) {
Log.i("MP4Box", "Exporting on track #"+extractTrak.id +" sample "+trak.nextSample);
var sample = this.inputIsoFile.getSample(trak, trak.nextSample);
if (sample) {
trak.nextSample++;
extractTrak.samples.push(sample);
} else {
return;
}
if (trak.nextSample % extractTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
Log.i("MP4Box", "Sending samples on track #"+extractTrak.id+" for sample "+trak.nextSample);
if (this.onSamples) {
this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
}
extractTrak.samples = [];
if (extractTrak !== this.extractedTracks[i]) {
/* check if the extraction needs to be stopped */
break;
}
}
}
}
}
}
MP4Box.prototype.appendBuffer = function(ab) {
var is_open;
if (ab === null || ab === undefined) {
throw("Buffer must be defined and non empty");
}
if (ab.fileStart === undefined) {
throw("Buffer must have a fileStart property");
}
if (ab.byteLength === 0) {
Log.w("MP4Box", "Ignoring empty buffer");
return;
}
/* mark the bytes in the buffer as not being used yet */
ab.usedBytes = 0;
this.insertBuffer(ab);
is_open = this.open();
if (is_open) {
this.processSamples();
/* Inform about the best range to fetch next */
Log.i("MP4Box", "Next buffer to fetch should have a fileStart position of "+this.inputIsoFile.nextParsePosition);
return this.inputIsoFile.nextParsePosition;
} else {
if (this.inputIsoFile !== null) {
/* moov has not been parsed but the first buffer was received,
the next fetch should probably be the next box start */
return this.inputIsoFile.nextParsePosition;
} else {
/* No valid buffer has been parsed yet, we cannot know what to parse next */
return 0;
}
}
}
MP4Box.prototype.getInfo = function() {
var movie = {};
movie.duration = this.inputIsoFile.moov.mvhd.duration;
movie.timescale = this.inputIsoFile.moov.mvhd.timescale;
movie.isFragmented = (this.inputIsoFile.moov.mvex != null);
if (movie.isFragmented && this.inputIsoFile.moov.mvex.mehd) {
movie.fragment_duration = this.inputIsoFile.moov.mvex.mehd.fragment_duration;
}
movie.isProgressive = this.inputIsoFile.isProgressive;
movie.hasIOD = (this.inputIsoFile.moov.iods != null);
movie.brands = [];
movie.brands.push(this.inputIsoFile.ftyp.major_brand);
movie.brands = movie.brands.concat(this.inputIsoFile.ftyp.compatible_brands);
var _1904 = (new Date(4, 0, 1, 0, 0, 0, 0).getTime());
movie.created = new Date(_1904+this.inputIsoFile.moov.mvhd.creation_time*1000);
movie.modified = new Date(_1904+this.inputIsoFile.moov.mvhd.modification_time*1000);
movie.tracks = [];
movie.audioTracks = [];
movie.videoTracks = [];
movie.subtitleTracks = [];
movie.metadataTracks = [];
movie.hintTracks = [];
movie.otherTracks = [];
for (i = 0; i < this.inputIsoFile.moov.traks.length; i++) {
var trak = this.inputIsoFile.moov.traks[i];
var sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
var track = {};
movie.tracks.push(track);
track.id = trak.tkhd.track_id;
track.references = [];
if (trak.tref) {
for (j = 0; j < trak.tref.boxes.length; j++) {
var ref = {};
track.references.push(ref);
ref.type = trak.tref.boxes[j].type;
ref.track_ids = trak.tref.boxes[j].track_ids;
}
}
track.created = new Date(_1904+trak.tkhd.creation_time*1000);
track.modified = new Date(_1904+trak.tkhd.modification_time*1000);
track.movie_duration = trak.tkhd.duration;
track.layer = trak.tkhd.layer;
track.alternate_group = trak.tkhd.alternate_group;
track.volume = trak.tkhd.volume;
track.matrix = trak.tkhd.matrix;
track.track_width = trak.tkhd.width/(1<<16);
track.track_height = trak.tkhd.height/(1<<16);
track.timescale = trak.mdia.mdhd.timescale;
track.duration = trak.mdia.mdhd.duration;
track.codec = sample_desc.getCodec();
track.language = trak.mdia.mdhd.languageString;
track.nb_samples = trak.samples.length;
if (sample_desc.isAudio()) {
movie.audioTracks.push(track);
track.audio = {};
track.audio.sample_rate = sample_desc.getSampleRate();
track.audio.channel_count = sample_desc.getChannelCount();
track.audio.sample_size = sample_desc.getSampleSize();
} else if (sample_desc.isVideo()) {
movie.videoTracks.push(track);
track.video = {};
track.video.width = sample_desc.getWidth();
track.video.height = sample_desc.getHeight();
} else if (sample_desc.isSubtitle()) {
movie.subtitleTracks.push(track);
} else if (sample_desc.isHint()) {
movie.hintTracks.push(track);
} else if (sample_desc.isMetadata()) {
movie.metadataTracks.push(track);
} else {
movie.otherTracks.push(track);
}
}
return movie;
}
MP4Box.prototype.getInitializationSegment = function() {
var stream = new DataStream();
stream.endianness = DataStream.BIG_ENDIAN;
this.inputIsoFile.writeInitializationSegment(stream);
return stream.buffer;
}
MP4Box.prototype.writeFile = function() {
var stream = new DataStream();
stream.endianness = DataStream.BIG_ENDIAN;
this.inputIsoFile.write(stream);
return stream.buffer;
}
MP4Box.prototype.initializeSegmentation = function() {
var j;
var box;
if (this.onSegment === null) {
Log.w("MP4Box", "No segmentation callback set!");
}
if (!this.isFragmentationStarted) {
this.isFragmentationStarted = true;
this.nextMoofNumber = 0;
this.inputIsoFile.resetTables();
}
var initSegs = [];
for (var i = 0; i < this.fragmentedTracks.length; i++) {
/* removing all tracks to create initialization segments with only one track */
for (j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
box = this.inputIsoFile.moov.boxes[j];
if (box.type == "trak") {
this.inputIsoFile.moov.boxes[j] = null;
}
}
/* adding only the needed track */
var trak = this.inputIsoFile.getTrackById(this.fragmentedTracks[i].id);
for (j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
box = this.inputIsoFile.moov.boxes[j];
if (box == null) {
this.inputIsoFile.moov.boxes[j] = trak;
}
}
seg = {};
seg.id = trak.tkhd.track_id;
seg.user = this.fragmentedTracks[i].user;
seg.buffer = this.getInitializationSegment();
initSegs.push(seg);
}
return initSegs;
}
/* Called by the application to release the resources associated to samples already forwarded to the application */
MP4Box.prototype.releaseUsedSamples = function (id, sampleNum) {
var size = 0;
var trak = this.inputIsoFile.getTrackById(id);
if (!trak.lastValidSample) trak.lastValidSample = 0;
for (var i = trak.lastValidSample; i < sampleNum; i++) {
size+=this.inputIsoFile.releaseSample(trak, i);
}
Log.d("MP4Box", "Track #"+id+" released samples up to "+sampleNum+" (total size: "+size+", remaining: "+this.inputIsoFile.samplesDataSize+")");
trak.lastValidSample = sampleNum;
}
/* Called by the application to flush the remaining samples, once the download is finished */
MP4Box.prototype.flush = function() {
Log.i("MP4Box", "Flushing remaining samples");
this.inputIsoFile.updateSampleLists();
this.processSamples();
}
MP4Box.prototype.seekTrack = function(time, useRap, trak) {
var j;
var sample;
var rap_offset = Infinity;
var rap_time = 0;
var seek_offset = Infinity;
var rap_seek_sample_num = 0;
var seek_sample_num = 0;
var timescale;
for (j = 0; j < trak.samples.length; j++) {
sample = trak.samples[j];
if (useRap && sample.is_rap) {
rap_offset = sample.offset;
rap_time = sample.cts;
rap_seek_sample_num = j;
}
if (j === 0) {
seek_offset = sample.offset;
seek_sample_num = 0;
timescale = sample.timescale;
} else if (sample.cts > time * sample.timescale) {
seek_offset = trak.samples[j-1].offset;
seek_sample_num = j-1;
break;
}
}
if (useRap) {
trak.nextSample = rap_seek_sample_num;
Log.i("MP4Box", "Seeking to RAP sample "+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(rap_time, timescale) +" and offset: "+rap_offset);
return { offset: rap_offset, time: rap_time };
} else {
trak.nextSample = seek_sample_num;
Log.i("MP4Box", "Seeking to sample "+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(time)+" and offset: "+rap_offset);
return { offset: seek_offset, time: time };
}
}
MP4Box.prototype.seek = function(time, useRap) {
var moov = this.inputIsoFile.moov;
var trak;
var trak_seek_info;
var i;
var seek_info = { offset: Infinity, time: Infinity };
if (!this.inputIsoFile.moov) {
throw "Cannot seek: moov not received!";
} else {
for (i = 0; i<moov.traks.length; i++) {
trak = moov.traks[i];
trak_seek_info = this.seekTrack(time, useRap, trak);
if (trak_seek_info.offset < seek_info.offset) {
seek_info.offset = trak_seek_info.offset;
}
if (trak_seek_info.time < seek_info.time) {
seek_info.time = trak_seek_info.time;
}
}
if (seek_info.offset === Infinity) {
/* No sample info, in all tracks, cannot seek */
return { offset: this.inputIsoFile.nextParsePosition, time: 0 };
} else {
this.inputIsoFile.nextSeekPosition = seek_info.offset;
return seek_info;
}
}
}

/*
* Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
* License: BSD-3-Clause (see LICENSE file)
*/
var VTTin4Parser = function() {
}
VTTin4Parser.prototype.parseSample = function(data) {
var cues, cue;
var stream = new DataStream(data, 0, DataStream.BIG_ENDIAN);
cues = [];
while (!stream.isEof()) {
cue = BoxParser.parseOneBox(stream);
if (cue.code === BoxParser.OK && cue.box.type === "vttc") {
cues.push(cue.box);
}
}
return cues;
}
var XMLSubtitlein4Parser = function() {
}
XMLSubtitlein4Parser.prototype.parseSample = function(sample) {
var res = {};
var documentString;
res.resources = [];
var stream = new DataStream(sample.data, 0, DataStream.BIG_ENDIAN);
if (sample.subsamples.length === 0) {
documentString = stream.readString(sample.data.length);
} else {
documentString = stream.readString(sample.subsamples[0].size);
if (sample.subsamples.length > 1) {
for (i = 1; i < sample.subsamples.length; i++) {
res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
}
}
}
res.document = (new DOMParser()).parseFromString(documentString, "application/xml");
return res;
}



//end mp4box