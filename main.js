function encode(text) {
    var result = '';
    var num = -1;
    for(var i = 0; i < text.length; i++) {
        var character = text.charCodeAt(i);

        var bitArray = new cba(8, sl(character & 0xFF, ++num % 8));
        bitArray = bitArray.reverse();
        for (var j = 0; j < bitArray.getLength(); j += 2)
        {
            if (bitArray.getAt(j) && bitArray.getAt(j + 1))
            {
                result += 'a';
            }
            else if (bitArray.getAt(j) && !bitArray.getAt(j + 1))
            {
                result += 'w';
            }
            else if (!bitArray.getAt(j) && bitArray.getAt(j + 1))
            {
                result += 'f';
            }
            else if (!bitArray.getAt(j) && !bitArray.getAt(j + 1))
            {
                result += 'g';
            }
        }
    }
    return result;
}

function decode(text) {
    var result = '';
    for (var i = 0; i < text.length; i += 4)
    {
        var bitArray = new cba(8);
        for (var j = 0; j < 4; j++)
        {
            if (j + i > text.length - 1)
            {
                break;
            }
            var c = text[i + j];
                if (c != 'a')
            {
                switch (c)
                {
                case 'f':
                    bitArray.setAt(j * 2, false);
                    bitArray.setAt(j * 2 + 1, true);
                    break;
                case 'g':
                    bitArray.setAt(j * 2, false);
                    bitArray.setAt(j * 2 + 1, false);
                    break;
                default:
                    if (c == 'w')
                    {
                        bitArray.setAt(j * 2, true);
                        bitArray.setAt(j * 2 + 1, false);
                    }
                    break;
                }
            }
            else
            {
                bitArray.setAt(j * 2, true);
                bitArray.setAt(j * 2 + 1, true);
            }
        }
        bitArray = bitArray.reverse();
        result += String.fromCharCode(sr(parseInt(bitArray, 2), i / 4 % 8));
    }
    return result;
}

function sl (b, dist) {
    var result;
    if ((dist & 7) == 0)
    {
        result = b;
    }
    else
    {
        result = (b << dist | b >> 8 - dist) & 0xFF
    }
    return result;
}

function sr (b, dist) {
    var result;
    if ((dist & 7) == 0)
    {
        result = b;
    }
    else
    {
        result = (b >> dist | b << 8 - dist) & 0xFF;
    }
    return result;
}

// ==========================================================================================
/* BitArray DataType */

// Constructor
function cba(size, bits) {
    //console.log(bits.toString(2));
    // Private field - array for our bits
    this.m_bits = new Array();

    //.ctor - initialize as a copy of an array of true/false or from a numeric value
    if (bits && bits.length) {
        for (var i = 0; i < bits.length; i++)
            this.m_bits.push(bits[i] ? cba._ON : cba._OFF);
    } else if (!isNaN(bits)) {
        this.m_bits = cba.shred(bits).m_bits;
    }
    if (size && this.m_bits.length != size) {
        if (this.m_bits.length < size) {
            for (var i = this.m_bits.length; i < size; i++) {
                this.m_bits.unshift(cba._OFF); // Add to beginning of array, mimicking C#
            }
        } else {
            for(var i = size; i > this.m_bits.length; i--){
                this.m_bits.pop();
            }
        }
    }
}

/* BitArray PUBLIC INSTANCE METHODS */

cba.prototype.reverse = function () { m_bits = this.m_bits.reverse(); return this; }

// read-only property - number of bits
cba.prototype.getLength = function () { return this.m_bits.length; };

// accessor - get bit at index
cba.prototype.getAt = function (index) {
    if (index < this.m_bits.length) {
        return this.m_bits[index];
    }
    return null;
};
    // accessor - set bit at index
cba.prototype.setAt = function (index, value) {
    if (index < this.m_bits.length) {
        this.m_bits[index] = value ? cba._ON : cba._OFF;
    }
};

// resize the bit array (append new false/0 indexes)
cba.prototype.resize = function (newSize) {
    var tmp = new Array();
    for (var i = 0; i < newSize; i++) {
        if (i < this.m_bits.length) {
            tmp.push(this.m_bits[i]);
        } else {
            tmp.push(cba._OFF);
        }
    }
    this.m_bits = tmp;
};

// Get the complimentary bit array (i.e., 01 compliments 10)
cba.prototype.getCompliment = function () {
    var result = new cba(this.m_bits.length);
    for (var i = 0; i < this.m_bits.length; i++) {
        result.setAt(i, this.m_bits[i] ? cba._OFF : cba._ON);
    }
    return result;
};

// Get the string representation ("101010")
cba.prototype.toString = function () {
    var s = new String();
    for (var i = 0; i < this.m_bits.length; i++) {
        s = s.concat(this.m_bits[i] === cba._ON ? "1" : "0");
    }
    return s;
};

// Get the numeric value
cba.prototype.toNumber = function () {
    var pow = 0;
        var n = 0;
    for (var i = this.m_bits.length - 1; i >= 0; i--) {
        if (this.m_bits[i] === cba._ON) {
            n += Math.pow(2, pow);
        }
        pow++;
    }
    return n;
};

/* STATIC METHODS */

// Get the union of two bit arrays
cba.getUnion = function (bitArray1, bitArray2) {
    var len = cba._getLen(bitArray1, bitArray2, true);
    var result = new cba(len);
    for (var i = 0; i < len; i++) {
        result.setAt(i, cba._union(bitArray1.getAt(i), bitArray2.getAt(i)));
    }
    return result;
};

// Get the intersection of two bit arrays
cba.getIntersection = function (bitArray1, bitArray2) {
    var len = cba._getLen(bitArray1, bitArray2, true);
    var result = new cba(len);
    for (var i = 0; i < len; i++) {
        result.setAt(i, cba._intersect(bitArray1.getAt(i), bitArray2.getAt(i)));
    }
    return result;
};

// Get the difference between to bit arrays
cba.getDifference = function (bitArray1, bitArray2) {
    var len = cba._getLen(bitArray1, bitArray2, true);
    var result = new cba(len);
    for (var i = 0; i < len; i++) {
            result.setAt(i, cba._difference(bitArray1.getAt(i), bitArray2.getAt(i)));
    }
    return result;
};

// Convert a number into a bit array
cba.shred = function (number) {
    var bits = new Array();
    var q = number;
    do {
        bits.push(q % 2);
        q = Math.floor(q / 2);
    } while (q > 0);
    return new cba(bits.length, bits.reverse());
};

/* cba PRIVATE STATIC CONSTANTS */
cba._ON = 1;
cba._OFF = 0;

/* cba PRIVATE STATIC METHODS */

// Calculate the intersection of two bits
cba._intersect = function (bit1, bit2) {
    return bit1 === cba._ON && bit2 === cba._ON ? cba._ON : cba._OFF;
};

// Calculate the union of two bits
cba._union = function (bit1, bit2) {
    return bit1 === cba._ON || bit2 === cba._ON ? cba._ON : cba._OFF;
};

// Calculate the difference of two bits
cba._difference = function (bit1, bit2) {
    return bit1 === cba._ON && bit2 !== cba._ON ? cba._ON : cba._OFF;
};

// Get the longest or shortest (smallest) length of the two bit arrays 
cba._getLen = function (bitArray1, bitArray2, smallest) {
    var l1 = bitArray1.getLength();
    var l2 = bitArray2.getLength();

    return l1 > l2 ? smallest ? l2 : l1 : smallest ? l2 : l1;
};