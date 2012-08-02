//modified from dekz/dcrypt

#include "common.h"

void HexEncode(unsigned char *md_value,
                      int md_len,
                      char** md_hexdigest,
                      int* md_hex_len) {
  *md_hex_len = (2*(md_len));
  *md_hexdigest = new char[*md_hex_len + 1];
  for (int i = 0; i < md_len; i++) {
    snprintf((char *)(*md_hexdigest + (i*2)), 3, "%02x", md_value[i]);
  }
}

void HexDecode(unsigned char *input,
                      int length,
                      char** buf64,
                      int* buf64_len) {
  *buf64_len = (length/2);
  *buf64 = new char[length/2 + 1];
  char *b = *buf64;
  for(int i = 0; i < length-1; i+=2) {
    b[i/2] = (hex2i(input[i])<<4) | (hex2i(input[i+1]));
  }
}

void base64(unsigned char *input, int length, char** buf64, int* buf64_len) {
  BIO *b64 = BIO_new(BIO_f_base64());
  BIO *bmem = BIO_new(BIO_s_mem());
  b64 = BIO_push(b64, bmem);
  BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
  int len = BIO_write(b64, input, length);
  assert(len == length);
  int r = BIO_flush(b64);
  assert(r == 1);

  BUF_MEM *bptr;
  BIO_get_mem_ptr(b64, &bptr);

  *buf64_len = bptr->length;
  *buf64 = new char[*buf64_len+1];
  memcpy(*buf64, bptr->data, *buf64_len);
  char* b = *buf64;
  b[*buf64_len] = 0;

  BIO_free_all(b64);
}

void unbase64(unsigned char *input,
               int length,
               char** buffer,
               int* buffer_len) {
  BIO *b64, *bmem;
  *buffer = new char[length];
  memset(*buffer, 0, length);

  b64 = BIO_new(BIO_f_base64());
  BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
  bmem = BIO_new_mem_buf(input, length);
  bmem = BIO_push(b64, bmem);

  *buffer_len = BIO_read(bmem, *buffer, length);
  BIO_free_all(bmem);
}


// LengthWithoutIncompleteUtf8 from V8 d8-posix.cc
// see http://v8.googlecode.com/svn/trunk/src/d8-posix.cc
int LengthWithoutIncompleteUtf8(char* buffer, int len) {
  int answer = len;
  // 1-byte encoding.
  static const int kUtf8SingleByteMask = 0x80;
  static const int kUtf8SingleByteValue = 0x00;
  // 2-byte encoding.
  static const int kUtf8TwoByteMask = 0xe0;
  static const int kUtf8TwoByteValue = 0xc0;
  // 3-byte encoding.
  static const int kUtf8ThreeByteMask = 0xf0;
  static const int kUtf8ThreeByteValue = 0xe0;
  // 4-byte encoding.
  static const int kUtf8FourByteMask = 0xf8;
  static const int kUtf8FourByteValue = 0xf0;
  // Subsequent bytes of a multi-byte encoding.
  static const int kMultiByteMask = 0xc0;
  static const int kMultiByteValue = 0x80;
  int multi_byte_bytes_seen = 0;
  while (answer > 0) {
    int c = buffer[answer - 1];
    // Ends in valid single-byte sequence?
    if ((c & kUtf8SingleByteMask) == kUtf8SingleByteValue) return answer;
    // Ends in one or more subsequent bytes of a multi-byte value?
    if ((c & kMultiByteMask) == kMultiByteValue) {
      multi_byte_bytes_seen++;
      answer--;
    } else {
      if ((c & kUtf8TwoByteMask) == kUtf8TwoByteValue) {
        if (multi_byte_bytes_seen >= 1) {
          return answer + 2;
        }
        return answer - 1;
      } else if ((c & kUtf8ThreeByteMask) == kUtf8ThreeByteValue) {
        if (multi_byte_bytes_seen >= 2) {
          return answer + 3;
        }
        return answer - 1;
      } else if ((c & kUtf8FourByteMask) == kUtf8FourByteValue) {
        if (multi_byte_bytes_seen >= 3) {
          return answer + 4;
        }
        return answer - 1;
      } else {
        return answer; // Malformed UTF-8.
      }
    }
  }
  return 0;
}


