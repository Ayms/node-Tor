#include <v8.h>

#include <node.h>
#include <node_object_wrap.h>
#include <node_buffer.h>

#include <openssl/bn.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/err.h>
#include <openssl/rsa.h>
#include <openssl/bio.h>

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

#include "common.h"

#include <nan.h>

using namespace v8;
using namespace node;


class PEM_: public node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    PEM_();

  protected:
    static NAN_METHOD(New);
    static NAN_METHOD(PEMtoModulus);
  private:
    ~PEM_();
};


class AES: public node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    AES();

  protected:
    static NAN_METHOD(New);
    static NAN_METHOD(AESEncrypt);
    static NAN_METHOD(AESDecrypt);
  private:
    ~AES();
};

class RSA_: public node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    RSA_();

  protected:
    static NAN_METHOD(New);
    static NAN_METHOD(RSAEncrypt);
    static NAN_METHOD(RSADecrypt);
  private:
    ~RSA_();
};

class Hash: public node::ObjectWrap {	
  public:
	EVP_MD_CTX mdctx; /* coverity[member_decl] */
	const EVP_MD *md; /* coverity[member_decl] */
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
	bool HashInit(const char* hashType);
	int HashUpdate(char* data, int len);

    Hash();

  protected:
    static NAN_METHOD(New);
    static NAN_METHOD(HashUpdate);
    static NAN_METHOD(HashDigest);
	
  private:
    ~Hash();
};