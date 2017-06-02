//Copyright 2012 jCore Aymeric Vitte (+ some parts of node.js crypto code)

#include <nan.h>
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

	NanScope();

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
	NanScope();

	Local<FunctionTemplate> constructor = NanNew<FunctionTemplate>(AES::New);

	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(NanNew("AES"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "encrypt", AESEncrypt);
	NODE_SET_PROTOTYPE_METHOD(constructor, "decrypt", AESDecrypt);

	target->Set(NanNew("AES"), constructor->GetFunction());
}

NAN_METHOD(AES::New) {
	NanScope();
	AES *d = new AES();
	d->Wrap(args.This());
}

NAN_METHOD(AES::AESEncrypt) {
}
 
NAN_METHOD(AES::AESDecrypt) {
}

Persistent<FunctionTemplate> RSA_::constructor;

void RSA_::Initialize(Handle<Object> target) {
	NanScope();

	Local<FunctionTemplate> constructor = NanNew<FunctionTemplate>(RSA_::New);

	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(NanNew("Rsa"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "encrypt", RSAEncrypt);
	NODE_SET_PROTOTYPE_METHOD(constructor, "decrypt", RSADecrypt);

	target->Set(NanNew("Rsa"), constructor->GetFunction());
}


NAN_METHOD(RSA_::New) {
	NanScope();
	RSA_ *d = new RSA_();
	d->Wrap(args.This());
}

NAN_METHOD(RSA_::RSAEncrypt) {

	NanScope();
	
	RSA *rsa_pub = RSA_new();
	unsigned char pad;
	
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
		outString = NanNew<String>("");
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
	NanReturnValue(outString);
}

NAN_METHOD(RSA_::RSADecrypt) {

	NanScope();
	
	RSA *rsa_priv = RSA_new();
	
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
		return NanThrowError("Problem Decrypting Message");
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

	NanReturnValue(outString);
}

Persistent<FunctionTemplate> PEM_::constructor;

void PEM_::Initialize(Handle<Object> target) {
	NanScope();

	Local<FunctionTemplate> constructor = NanNew<FunctionTemplate>(PEM_::New);

	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(NanNew("PEM"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "modulus", PEMtoModulus);

	target->Set(NanNew("PEM"), constructor->GetFunction());
}

NAN_METHOD(PEM_::New) {
	NanScope();
	PEM_ *d = new PEM_();
	d->Wrap(args.This());
}

NAN_METHOD(PEM_::PEMtoModulus) {

	NanScope();
	
	int len = 256;
	char *m[len];
	RSA* rsa;
	BIO *bio = LoadBIO(args[0]);

	rsa = PEM_read_bio_RSAPublicKey(bio, NULL, NULL, NULL);

	memcpy(m,BN_bn2hex(rsa->n),len);

	BIO_free(bio);
	
	Local<Value> outString;
	outString = Encode(m,len,BINARY);

	NanReturnValue(outString);

};

Persistent<FunctionTemplate> Hash::constructor;

void Hash::Initialize(Handle<Object> target) {
	NanScope();

	Local<FunctionTemplate> constructor = NanNew<FunctionTemplate>(Hash::New);

	constructor->InstanceTemplate()->SetInternalFieldCount(1);
	constructor->SetClassName(NanNew("Hash"));

	NODE_SET_PROTOTYPE_METHOD(constructor, "update", HashUpdate);
	NODE_SET_PROTOTYPE_METHOD(constructor, "digest", HashDigest);

	target->Set(NanNew("Hash"), constructor->GetFunction());
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

NAN_METHOD(Hash::New) {

	NanScope();

	if (args.Length() == 0 || !args[0]->IsString()) {
		return NanThrowError(NanNew<String>("Must give hashtype string as argument"));
	}

	String::Utf8Value hashType(args[0]);
	
	Hash *hash = new Hash();
	
	if (!hash->HashInit(*hashType)) {
		delete hash;
		return NanThrowError(NanNew<String>("Digest method not supported"));
	}
	
	hash->Wrap(args.This());
}

NAN_METHOD(Hash::HashUpdate) {

	NanScope();
	
	Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

	ASSERT_IS_STRING_OR_BUFFER(args[0]);
	enum encoding enc = ParseEncoding(args[1]);
	ssize_t len = DecodeBytes(args[0], enc);

	if (len < 0) {
		return NanThrowError(NanNew<String>("Bad argument"));
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
		return NanThrowError(NanNew<String>("HashUpdate fail"));
	}

}

NAN_METHOD(Hash::HashDigest) {
	NanScope();
	
	Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

	//if (!hash->initialised_) {
	//	return NanThrowError("Not initialized");
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
		NanReturnValue(NanNew<String>(""));
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
	NanReturnValue(outString);
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

void init(Handle<Object> target) {
    	AES::Initialize(target);
	RSA_::Initialize(target);
	PEM_::Initialize(target);
	Hash::Initialize(target);
}

NODE_MODULE(crypto,init)