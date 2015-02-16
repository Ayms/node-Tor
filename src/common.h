//modified from dekz/dcrypt

#ifndef __NODE_DCRYPT_COMMON_H__
#define __NODE_DCRYPT_COMMON_H__
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <string.h>
#include <stdlib.h>

#include <errno.h>
#include <v8.h>
#include <node.h>

using namespace v8;
using namespace node;


#define ASSERT_IS_STRING_OR_BUFFER(val) \
if (!val->IsString() && !Buffer::HasInstance(val)) { \
return NanThrowTypeError("Not a string or buffer"); \
}

#define hex2i(c) ((c) <= '9' ? ((c) - '0') : (c) <= 'Z' ? ((c) - 'A' + 10) : ((c) - 'a' + 10))


void base64(unsigned char *input, int length, char** buf64, int* buf64_len);
void HexEncode(unsigned char *md_value,
                      int md_len,
                      char** md_hexdigest,
                      int* md_hex_len);

void HexDecode(unsigned char *input,
                      int length,
                      char** buf64,
                      int* buf64_len);

void unbase64(unsigned char *input,
               int length,
               char** buffer,
               int* buffer_len);

int LengthWithoutIncompleteUtf8(char *buffer, int len);

#endif