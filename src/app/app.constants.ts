// ng build --base-href=/hiveonboarding/

export const doc_template = {
    companyId: '',
    rootDomain: '',
    hostUrl: '',
    serviceUrl: '',
    userName: '',
    domainName: '',
    domain: '',
    serviceName: '',
    active: '',
    DataSkjema: '',
    xml: '',
    KommandoSkjema: '',
    cmdxml: '',
    webjs: '',
    timeForChannelRequest: '',
    desc: '',
    masterScript: '',
    preMasterScript: '',
    searchTerms: '',
    quantity: '',
  };

  const company_template = {
    id: 1234,
    name: 'IBM',
    orgnr: 999888777,
    contact_person: 'Reodor Felgen',
    email: 'olebrum@hundremeterskogen.am',
    telephone: '19283746',
  };

  // doCrypt(data:string):string {
  //   const rand = forge.random.getBytesSync(350);
  //   console.log(btoa(rand));
    
    
  //  // const utf8rand = forge.util.encodeUtf8(rand);
  //   const c = this.pubKey.encrypt(rand);
  //   this.rsaKem = btoa(c); 
  //   this.aesIV = forge.random.getBytesSync(16);
  //   // const sha2 = forge.md.sha256.create();
  //   // sha2.update(rand);
  //   // const aesKey = sha2.digest();
  //   let utf8Encode = new TextEncoder();
  //   const arr = utf8Encode.encode(this.login.email+this.login.pass);
  //   const sha2 = forge.md.sha256.create();
  //   sha2.update(this.login.email+this.login.pass);
  //   const aesKey = sha2.digest();
    
  //   this.aesCipher = forge.cipher.createCipher('AES-CBC', aesKey);
  //   this.aesCipher.start({iv: this.aesIV});
  //   this.aesCipher.update(forge.util.createBuffer(data));
  //   this.aesCipher.finish();
  //   const encrypted = this.aesCipher.output;
  //   console.log(btoa(forge.util.encodeUtf8(aesKey)));
    
  //   return btoa(encrypted.data);
  // }