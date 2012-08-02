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

using namespace v8;
using namespace node;


class PEM_: node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    PEM_();

  protected:
    static Handle<Value> New(const Arguments &args);
    static Handle<Value> PEMtoModulus(const Arguments &args);
  private:
    ~PEM_();
};


class AES: node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    AES();

  protected:
    static Handle<Value> New(const Arguments &args);
    static Handle<Value> AESEncrypt(const Arguments &args);
    static Handle<Value> AESDecrypt(const Arguments &args);
  private:
    ~AES();
};

class RSA_: node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);

    RSA_();

  protected:
    static Handle<Value> New(const Arguments &args);
    static Handle<Value> RSAEncrypt(const Arguments &args);
    static Handle<Value> RSADecrypt(const Arguments &args);
  private:
    ~RSA_();
};

class Hash: node::ObjectWrap {	
  public:
	EVP_MD_CTX mdctx; /* coverity[member_decl] */
	const EVP_MD *md; /* coverity[member_decl] */
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
	bool HashInit(const char* hashType);
	int HashUpdate(char* data, int len);

    Hash();

  protected:
    static Handle<Value> New(const Arguments &args);
    static Handle<Value> HashUpdate(const Arguments &args);
    static Handle<Value> HashDigest(const Arguments &args);
	
  private:
    ~Hash();
};