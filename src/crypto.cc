//Copyright 2012 jCore Aymeric Vitte (+ some parts of node.js crypto code)
//No C++ extensive knowledge, please forgive potential curious things in the code

#include "crypto.h"

static char* LoadBuf (Handle<Value> buf) {
	Local<Object> buffer_obj = buf->ToObject();
	size_t buffer_length = Buffer::Length(buffer_obj);
	char *buffer_data= Buffer::Data(buffer_obj);
	char *s;
	s=new char[buffer_length+1];
	memcpy(s, buffer_data, buffer_length);
	s[buffer_length] = 0;
	return s;
}

static BIO* LoadBIO (Handle<Value> v) {
	BIO *bio = BIO_new(BIO_s_mem());
	if (!bio) return NULL;

	HandleScope scope;

	int r = -1;

	if (v->IsString()) {
		String::Utf8Value s(v->ToString());
		r = BIO_write(bio, *s, s.length());
	} else if (Buffer::HasInstance(v)) {
		Local<Object> buffer_obj = v->ToObject();
		char *buffer_data = Buffer::Data(buffer_obj);
		size_t buffer_length = Buffer::Length(buffer_obj);
		r = BIO_write(bio, buffer_data, buffer_length);
	}

	if (r <= 0) {
		BIO_free(bio);
		return NULL;
	}

	return bio;
}

Persistent<FunctionTemplate> AES::constructor;

void AES::Initialize(Handle<Object> target) {
	HandleScope scope;

	constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(AES::New));
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(String::NewSymbol("AES"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "encrypt", AESEncrypt);
	NODE_SET_PROTOTYPE_METHOD(constructor, "decrypt", AESDecrypt);

	Local<ObjectTemplate> proto = constructor->PrototypeTemplate();
	target->Set(String::NewSymbol("AES"), constructor->GetFunction());
}

Handle<Value> AES::New(const Arguments &args) {
	HandleScope scope;
	AES *d = new AES();
	d->Wrap(args.This());
	return args.This();
}

Handle<Value> AES::AESEncrypt(const Arguments& args) {
}
 
Handle<Value> AES::AESDecrypt(const Arguments& args) {
}

Persistent<FunctionTemplate> RSA_::constructor;

void RSA_::Initialize(Handle<Object> target) {
	HandleScope scope;

	constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(RSA_::New));
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(String::NewSymbol("Rsa"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "encrypt", RSAEncrypt);
	NODE_SET_PROTOTYPE_METHOD(constructor, "decrypt", RSADecrypt);

	Local<ObjectTemplate> proto = constructor->PrototypeTemplate();
	target->Set(String::NewSymbol("Rsa"), constructor->GetFunction());
}


Handle<Value> RSA_::New(const Arguments &args) {
	HandleScope scope;
	RSA_ *d = new RSA_();
	d->Wrap(args.This());
	return args.This();
}

Handle<Value> RSA_::RSAEncrypt(const Arguments& args) {

	HandleScope scope;
	
	RSA *rsa_pub = RSA_new();
	unsigned char pad;

	enum encoding enc = BINARY;
	
	char *n = LoadBuf(args[0]);
	
	char *e = LoadBuf(args[1]);

	BN_hex2bn(&rsa_pub->n,n);	
	BN_hex2bn(&rsa_pub->e,e);
	
	char *msg = LoadBuf(args[2]);
	size_t msg_len = DecodeBytes(args[2], BINARY);
	
	String::Utf8Value padding_type(args[3]->ToString());
	pad = RSA_PKCS1_PADDING;
	if (strcasecmp(*padding_type, "RSA_NO_PADDING") == 0) {
		pad = RSA_NO_PADDING;
	} else if (strcasecmp(*padding_type, "RSA_PKCS1_OAEP_PADDING") == 0) {
		pad = RSA_PKCS1_OAEP_PADDING;
	} else if (strcasecmp(*padding_type, "RSA_SSLV23_PADDING") == 0) {
		pad = RSA_SSLV23_PADDING;
	}

	//TODO : check the length of msg according to padding

	int keysize = RSA_size(rsa_pub);
	
	unsigned char *encrypted = new unsigned char[keysize];

	int written = RSA_public_encrypt(msg_len, (unsigned char*) msg, encrypted, rsa_pub, pad);

	delete [] msg;

	Local<Value> outString;
	String::Utf8Value encoding(args[4]->ToString());

	if (written == 0) {
		outString = String::New("");
	} else if (strcasecmp(*encoding, "hex") == 0) {
		char *out_hex;
		int out_hex_len;
		
		HexEncode(encrypted, written, &out_hex, &out_hex_len);
		outString = Encode(out_hex, out_hex_len, BINARY);
		delete [] out_hex;
	} else if (strcasecmp(*encoding, "base64") == 0) {
		char *out;
		int out_len;
		base64(encrypted, written, &out, &out_len);
		outString = Encode(out, out_len, BINARY);
		delete [] out;
	} else {
		outString = Encode(encrypted, written, BINARY);
	}
	
	delete [] encrypted;
	delete [] n;
	delete [] e;
	RSA_free(rsa_pub);
	return scope.Close(outString);
}

Handle<Value> RSA_::RSADecrypt(const Arguments &args) {

	HandleScope scope;
	
	RSA *rsa_priv = RSA_new();
	
	enum encoding enc = BINARY;
	
	char *n = LoadBuf(args[0]);

	char *e = LoadBuf(args[1]);

	char *d = LoadBuf(args[2]);
	
	char *p = LoadBuf(args[3]);
	
	char *q = LoadBuf(args[4]);
	
	char *dmp1 = LoadBuf(args[5]);
	
	char *dmq1 = LoadBuf(args[6]);
	
	char *iqmp = LoadBuf(args[7]);
	
	BN_hex2bn(&rsa_priv->n,n);
	BN_hex2bn(&rsa_priv->e,e);
	BN_hex2bn(&rsa_priv->d,d);
	BN_hex2bn(&rsa_priv->p,p);
	BN_hex2bn(&rsa_priv->q,q);
	BN_hex2bn(&rsa_priv->dmp1,dmp1);
	BN_hex2bn(&rsa_priv->dmq1,dmq1);
	BN_hex2bn(&rsa_priv->iqmp,iqmp);
	
	char *ct_buf;
	int ct_len;
	ssize_t len = DecodeBytes(args[8], BINARY);
	String::Utf8Value encoding(args[10]->ToString());
	if (Buffer::HasInstance(args[8])) {
	} else {
		ct_buf = new char[len];
		ct_len = DecodeWrite(ct_buf, len, args[8], BINARY);
		assert(ct_len == len);
	}

	char *ciphertext;
	int ciphertext_len;
	if (strcasecmp(*encoding, "hex") == 0) {
		HexDecode((unsigned char*) ct_buf, ct_len, (char **)&ciphertext, &ciphertext_len);
		ct_buf = ciphertext;
		ct_len = ciphertext_len;
	} else if (strcasecmp(*encoding, "base64") == 0) {
		unbase64((unsigned char*) ct_buf, ct_len, (char **)&ciphertext, &ciphertext_len);
		ct_buf = ciphertext;
		ct_len = ciphertext_len;
	} else {
		//binary
	}

	unsigned char pad;
	String::Utf8Value padding_type(args[9]->ToString());
	pad = RSA_PKCS1_PADDING;
	if (strcasecmp(*padding_type, "RSA_NO_PADDING") == 0) {
		pad = RSA_NO_PADDING;
	} else if (strcasecmp(*padding_type, "RSA_PKCS1_OAEP_PADDING") == 0) {
		pad = RSA_PKCS1_OAEP_PADDING;
	} else if (strcasecmp(*padding_type, "RSA_SSLV23_PADDING") == 0) {
		pad = RSA_SSLV23_PADDING;
	}
	
	int keysize = RSA_size(rsa_priv);
	unsigned char *out_buf = new unsigned char[keysize];

	int written = RSA_private_decrypt(ct_len, (unsigned char*)ct_buf, out_buf, rsa_priv, pad);
	
	if (written < 0) {
		return ThrowException(Exception::Error(String::New("Problem Decrypting Message")));
	}

	delete [] ciphertext;
	delete [] n;
	delete [] e;
	delete [] d;
	delete [] p;
	delete [] q;
	delete [] dmp1;
	delete [] dmq1;
	delete [] iqmp;
	
	RSA_free(rsa_priv);
	
	Local<Value> outString;
	char *out_hex;
	int out_hex_len;
	HexEncode(out_buf, written, &out_hex, &out_hex_len);
	outString = Encode(out_hex, out_hex_len, BINARY);

	return scope.Close(outString);
}

Persistent<FunctionTemplate> PEM_::constructor;

void PEM_::Initialize(Handle<Object> target) {
	HandleScope scope;

	constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(PEM_::New));
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(String::NewSymbol("PEM"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "modulus", PEMtoModulus);

	Local<ObjectTemplate> proto = constructor->PrototypeTemplate();
	target->Set(String::NewSymbol("PEM"), constructor->GetFunction());
}

Handle<Value> PEM_::New(const Arguments &args) {
	HandleScope scope;
	PEM_ *d = new PEM_();
	d->Wrap(args.This());
	return args.This();
}

Handle<Value> PEM_::PEMtoModulus(const Arguments &args) {

	HandleScope scope;
	
	int len = 256;
	char *m[len];
	RSA* rsa;
	BIO *bio = LoadBIO(args[0]);

	rsa = PEM_read_bio_RSAPublicKey(bio, NULL, NULL, NULL);

	memcpy(m,BN_bn2hex(rsa->n),len);

	BIO_free(bio);
	
	Local<Value> outString;
	outString = Encode(m,len,BINARY);

	return scope.Close(outString);

};

Persistent<FunctionTemplate> Hash::constructor;

void Hash::Initialize(Handle<Object> target) {
	HandleScope scope;

	constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Hash::New));
	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(String::NewSymbol("Hash"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "update", HashUpdate);
	NODE_SET_PROTOTYPE_METHOD(constructor, "digest", HashDigest);

	Local<ObjectTemplate> proto = constructor->PrototypeTemplate();
	target->Set(String::NewSymbol("Hash"), constructor->GetFunction());
}

bool Hash::HashInit (const char* hashType) {
	md = EVP_get_digestbyname(hashType);
	if(!md) return false;
	EVP_MD_CTX_init(&mdctx);
	EVP_DigestInit_ex(&mdctx, md, NULL);
    //initialised_ = true;
	return true;
}

int Hash::HashUpdate(char* data, int len) {
	//if (!initialised_) return 0;
	EVP_DigestUpdate(&mdctx, data, len);
	return 1;
}

Handle<Value> Hash::New(const Arguments &args) {

	HandleScope scope;

	if (args.Length() == 0 || !args[0]->IsString()) {
		return ThrowException(Exception::Error(String::New(
		"Must give hashtype string as argument")));
	}

	String::Utf8Value hashType(args[0]);
	
	Hash *hash = new Hash();
	if (!hash->HashInit(*hashType)) {
	delete hash;
	return ThrowException(Exception::Error(String::New(
		"Digest method not supported")));
	}
	hash->Wrap(args.This());
	return args.This();
}

Handle<Value> Hash::HashUpdate(const Arguments& args) {

	HandleScope scope;
	
	Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

	ASSERT_IS_STRING_OR_BUFFER(args[0]);
	enum encoding enc = ParseEncoding(args[1]);
	ssize_t len = DecodeBytes(args[0], enc);

	if (len < 0) {
		Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
		return ThrowException(exception);
	}

	int r;

	if (Buffer::HasInstance(args[0])) {
		Local<Object> buffer_obj = args[0]->ToObject();
		char *buffer_data = Buffer::Data(buffer_obj);
		size_t buffer_length = Buffer::Length(buffer_obj);
		r = hash->HashUpdate(buffer_data, buffer_length);
	} else {
		char* buf = new char[len];
		ssize_t written = DecodeWrite(buf, len, args[0], enc);
		assert(written == len);
		r = hash->HashUpdate(buf, len);
		delete[] buf;
		}

	if (!r) {
		Local<Value> exception = Exception::TypeError(String::New("HashUpdate fail"));
		return ThrowException(exception);
	}

	return args.This();
}

Handle<Value> Hash::HashDigest(const Arguments& args) {
	HandleScope scope;
	
	Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

	//if (!hash->initialised_) {
	//	return ThrowException(Exception::Error(String::New("Not initialized")));
	//}

	unsigned char md_value[EVP_MAX_MD_SIZE];
	unsigned int md_len;
	EVP_MD_CTX tmpmdctx;
	
	EVP_MD_CTX_copy(&tmpmdctx,&hash->mdctx);
	
	EVP_DigestFinal_ex(&tmpmdctx, md_value, &md_len);
	
	EVP_MD_CTX_cleanup(&tmpmdctx);
	//EVP_MD_CTX_cleanup(&hash->mdctx);
	//hash->initialised_ = false;

	if (md_len == 0) {
		return scope.Close(String::New(""));
	}

	Local<Value> outString;

	enum encoding enc = ParseEncoding(args[0], BINARY);
	if (enc == HEX) {
		char* md_hexdigest;
		int md_hex_len;
		HexEncode(md_value, md_len, &md_hexdigest, &md_hex_len);
		outString = Encode(md_hexdigest, md_hex_len, BINARY);
		delete [] md_hexdigest;
	} else if (enc == BASE64) {
		char* md_hexdigest;
		int md_hex_len;
		base64(md_value, md_len, &md_hexdigest, &md_hex_len);
		outString = Encode(md_hexdigest, md_hex_len, BINARY);
		delete [] md_hexdigest;
	} else if (enc == BINARY) {
		outString = Encode(md_value, md_len, BINARY);
	} else {
		fprintf(stderr, "node-crypto : Hash .digest encoding "
                      "can be binary, hex or base64\n");
	}
	return scope.Close(outString);
}

Hash::Hash () : ObjectWrap () {
    //initialised_ = false;
}

Hash::~Hash () {
//    if (initialised_) {
//      EVP_MD_CTX_cleanup(&mdctx);
//    }
}

RSA_::RSA_() : ObjectWrap() {
}

RSA_::~RSA_() {
}

AES::AES() : ObjectWrap() {
}

AES::~AES() {
}

PEM_::PEM_() : ObjectWrap() {
}

PEM_::~PEM_() {
}

extern "C" void init(Handle<Object> target) {
    AES::Initialize(target);
	RSA_::Initialize(target);
	PEM_::Initialize(target);
	Hash::Initialize(target);
}