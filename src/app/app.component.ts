import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { doc_template } from './app.constants';
import { catchError } from 'rxjs';
import * as forge from 'node-forge';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'HiveOnboardingDoc';
  loggedIn: boolean = false;

  constructor(private http: HttpClient) {}

  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  userMenuVisible = false;

  urlImgPrefix = 'data:image/png;base64,';
  urlImg = '';
  klikket = false;
  showSchemaInfo = false;
  showCompanyInfo = true;

  new_user = {
    name: '',
    email: '',
    pass: '',
    qrcode: '',
  };

  host = 'http://localhost:8778';
  getDocUrl = '/HiveOnboardingDoc/GetDoc';
  saveDocUrl = '/HiveOnboardingDoc/SaveDoc';
  updateCompanyUrl = '/HiveOnboardingDoc/UpdateCompany';
  rsaKeyApp = '/HiveOnboardingDoc/rsapubkey';
  webAppComp = '/HiveOnboardingDoc/GetCompanies';
  loginApp = '/HiveOnboardingDoc/login';
  newUserApp = '/HiveOnboardingDoc/newuser';

  rounds = 2000;
  pass = 'qazxswedc';
  pubKey: forge.pki.rsa.PublicKey | any;
  validChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  makeRamdomPassPhrase(): string {
    const pwlen = 300;
    const pwchars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const limit = 256 - (256 % pwchars.length);

    let passwd = '';
    let randval;
    for (let i = 0; i < pwlen; i++) {
      do {
        randval = window.crypto.getRandomValues(new Uint8Array(1))[0];
      } while (randval >= limit);
      passwd += pwchars[randval % pwchars.length];
    }
    return '#' + passwd;
  }

  getAESParams(): any {
    const salt = forge.random.getBytesSync(32);
    const pass = this.makeRamdomPassPhrase();
    const cryptpass = this.pubKey.encrypt(pass);
    const iv = forge.random.getBytesSync(16);
    return { salt: salt, pass: pass, cryptpass: cryptpass, iv: iv };
  }

  getAESParEncoded(params: any): any {
    return {
      salt: btoa(params.salt),
      pass: btoa(params.pass),
      cryptpass: btoa(params.cryptpass),
      iv: btoa(params.iv),
    };
  }

  doCrypt(encrypt: boolean, data: string, aesparams?: any): any {
    if (!aesparams) {
      aesparams = this.getAESParams();
    }
    const saltB64 = btoa(aesparams.salt); // lager tilfeldig salt verdi som base64 tekst
    const md = forge.md.sha256.create();
    const aesKey = forge.pkcs5.pbkdf2(
      aesparams.pass,
      aesparams.salt,
      this.rounds,
      32,
      md
    );

    const aesCipher = encrypt
      ? forge.cipher.createCipher('AES-OFB', aesKey)
      : forge.cipher.createDecipher('AES-OFB', aesKey);
    aesCipher.start({ iv: aesparams.iv });

    const buff = encrypt
      ? forge.util.createBuffer(data, 'utf8')
      : forge.util.createBuffer(forge.util.decode64(data));

    aesCipher.update(buff);
    aesCipher.finish();
    const processed = aesCipher.output;
    if (encrypt)
      return {
        encrypted: btoa(processed.data),
        iv: btoa(aesparams.iv),
        salt: saltB64,
        cryptpass: btoa(aesparams.cryptpass),
      };
    else {
      const t = processed.toString();
      return JSON.parse(t);
    }
  }

  saveNewCompany() {
    if (
      this.new_company.trim() === '!!Feil!!' ||
      this.new_company.trim() === '' ||
      this.new_orgnr.trim().length !== 9
    ) {
      this.new_orgnr = this.selectedCompanyId;
    }

    const body = {
      orgnr: this.new_orgnr,
      companyName: this.new_company,
      infoJSON: this.new_info_json,
      cryptData: {},
    };
    body.cryptData = this.doCrypt(true, JSON.stringify(this.selectedCompany));
    this.klikket = true;
    console.log(body);
    

    this.http
      .post(this.host + this.updateCompanyUrl + this.getRandomUrl(), body, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((result: any) => {
        console.log(result);

        if (result && result[0].login && result[0].login !== 'yes') {
          this.loggedIn = false;
          return;
        }
        this.getCompanies(this.new_orgnr);
        this.new_company = '';
        this.new_orgnr = '';
        this.new_info_json = {};
        this.klikket = true;
      });
  }

  getCompanies(orgnr?: string): void {
    const aesparams = this.getAESParams();
    const body = {
      companyId: orgnr,
      ...this.getAESParEncoded(aesparams),
    };
    this.klikket = true;
    this.http
      .post(this.host + this.webAppComp + this.getRandomUrl(), body, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((res: any) => {
        console.log(res);

        const result = this.doCrypt(false, res, aesparams);
        console.log(result);

        if (
          result &&
          result[0] &&
          result[0].login &&
          result[0].login !== 'yes'
        ) {
          this.loggedIn = false;
          this.klikket = false;
          return;
        }

        this.company_list = result;
        if (orgnr) {
          this.selectedCompany = this.company_list.find(
            (c) => c.orgnr === orgnr
          );
          this.selectedCompanyId = orgnr;
        }
        this.getDocs(this.selectedCompanyId);
      });
  }

  getDocs(compId?: string): void {
    const aesparams = this.getAESParams();
    const body = {
      companyId: compId,
      ...this.getAESParEncoded(aesparams),
    };

    const urlen = this.host + this.getDocUrl + this.getRandomUrl();
    this.klikket = true;
    eval(
      'window.alert = () => {}; window.confirm = () => {}; window.prompt = () => {};'
    );
    this.http
      .post(urlen, body, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((res: any) => {
        let result: any = false;
        if (res && res.length > 10)
          result = this.doCrypt(false, res, aesparams);
        if (
          result &&
          result.length > 0 &&
          result[0].login &&
          result[0].login !== 'yes'
        ) {
          this.loggedIn = false;
          this.klikket = false;
          return;
        }
        this.doc_list = result;
        if (this.doc_list.length < 1) {
          this.doc_list.push(JSON.parse(JSON.stringify(doc_template)));
          this.doc_list[0].companyId = compId;
        }
        this.setDoc();
      });
  }

  ngOnInit(): void {
    this.http
      .get(this.host + this.rsaKeyApp + this.getRandomUrl(), {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((result: any) => {
        if (!result) {
          return;
        }

        this.pubKey = forge.pki.publicKeyFromPem(result.rsapubkey);
      });
  }

  result: string = '';
  cmdXMLTags: string = '';
  rtwXMLTags: string = '';

  showUserMenu(event: { shiftKey: any }) {
    if (event.shiftKey) {
      this.userMenuVisible = !this.userMenuVisible;
    }
  }

  saveUser(): void {
    if (this.new_user.pass.length < 8) return;
    if (this.new_user.name.length < 4) return;
    if (this.new_user.email.length < 7) return;
    this.klikket = true;
    this.http
      .post(this.host + this.newUserApp + this.getRandomUrl(), this.new_user, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((result: any) => {
        this.urlImg = this.urlImgPrefix + result;
        this.new_user.qrcode = result;
        this.klikket = false;
      });
  }

  makeUrls(doc: any): void {
    const domain = doc.domain + '.' + doc.rootDomain;
    doc.domainUrl = 'https://' + domain;
    doc.hostUrl = domain + ':443';
    doc.websocketUrl = 'wss://' + domain + '/ws-c';
    doc.serviceUrl = 'https://' + domain + '/' + doc.serviceName;
    doc.xml = this.makeXml('rtw', this.rtwXMLTags);
    doc.cmdxml = this.makeXml('cmd', this.cmdXMLTags);
  }

  login: any = {
    email: 'stigottar@nornir.io',
    pass: 'filip213',
    code: '',
  };

  textarea_content = '';
  the_doc: any = {};
  the_doc_text: string = '';
  doc_keys: any[] = [];
  doc_list: any[] = [];
  company_list: any[] = [];
  domainIndex = 0;
  treeMenu!: Map<string, Map<string, any[]>>;
  chosenItem: string = '';
  new_company: string = '';
  new_orgnr: string = '';

  chosen(root: string, domain: string, service: string): boolean {
    return this.chosenItem === root + '_' + domain + '_' + service;
  }

  makeXml(mainTags: string, values: string) {
    if (!values) return '';
    const valList = values.split(',');
    const mainList = mainTags.split(',');
    let end = '';
    let start = '';
    mainList.forEach((s) => {
      const t = s.trim();
      start += '<' + t + '>';
      end += '</' + t + '>';
    });
    valList.forEach((s) => {
      const t = s.trim();
      start += '<' + t + '>' + '</' + t + '>';
    });
    return start + end;
  }

  copyContent = async () => {
    try {
      await navigator.clipboard.writeText(this.the_doc_text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  setDoc(root?: string, domain?: string, service?: string): void {
    let i = 0;
    if (!this.doc_list || this.doc_list.length < 1) {
      const jt = JSON.stringify(doc_template);
      this.domainIndex = 0;
      if (!this.doc_list) this.doc_list = [];
      this.doc_list.push(JSON.parse(jt));
    }
    if (domain) {
      this.chosenItem = root + '_' + domain + '_' + service;
      i = this.doc_list.findIndex(
        (element) =>
          root === element.rootDomain &&
          domain === element.domain &&
          service === element.serviceName
      );
    } else {
      i = 0;
      this.chosenItem =
        this.doc_list[0].rootDomain +
        '_' +
        this.doc_list[0].domain +
        '_' +
        this.doc_list[0].serviceName;
    }
    this.the_doc = this.doc_list[i];
    this.textarea_content = this.the_doc.webjs;
    this.the_doc_text = JSON.stringify(this.the_doc, null, 4);
    this.makeUrls(this.the_doc);
    this.doc_keys = Object.keys(this.the_doc);
    this.doc_list.sort((a, b) => {
      if (a.rootDomain > b.rootDomain) return 1;
      if (a.rootDomain < b.rootDomain) return -1;
      if (a.domain > b.domain) return 1;
      if (a.domain < b.domain) return -1;
      if (a.serviceName > b.serviceName) return 1;
      if (a.serviceName < b.serviceName) return -1;
      return 0;
    });
    this.cmdXMLTags = this.getXMLTags(this.the_doc.cmdxml);
    this.rtwXMLTags = this.getXMLTags(this.the_doc.xml);
    Object.keys(this.scriptFields).forEach((sfStr) => this.testScript(sfStr));
    this.editField = 'webjs';
    this.treeMenu = this.makeTreeMenuList();
    this.klikket = false;
  }

  makeTreeMenuList(): Map<string, Map<string, any[]>> | any {
    if (
      !this.doc_list ||
      this.doc_list.length < 1 ||
      this.doc_list[0].rootDomain.length < 3
    )
      return null;
    const M = new Map<string, Map<string, any[]>>();
    this.doc_list.forEach((element: any) => {
      let m = M.get(element.rootDomain);
      if (!m) {
        m = new Map<string, any[]>();
        M.set(element.rootDomain, m);
      }
      let snList = m.get(element.domain);
      if (!snList) {
        const sl = [element.serviceName];
        m.set(element.domain, sl);
      } else {
        snList.push(element.serviceName);
      }
    });
    return M;
  }

  changed = false;
  editField: string | undefined;

  scriptFields: any = {
    webjs: { func: undefined, error: false },
    masterScript: { func: undefined, error: false },
    preMasterScript: { func: undefined, error: false },
  };

  sfArr = Object.keys(this.scriptFields);

  testScript(sfStr?: string | any): void {
    if (!sfStr) sfStr = '' + this.editField;
    if (!this.sfArr.includes(sfStr)) return;
    try {
      const func = new Function(this.the_doc[sfStr]);
      this.scriptError = '';
      this.scriptFields[sfStr].error = false;
      this.scriptFields[sfStr].func = func;
    } catch (err: any) {
      this.scriptError = err;
      this.scriptFields[sfStr].error = true;
      this.scriptFields[sfStr].func = undefined;
    }
  }

  input_changed(event: any): void {
    this.makeUrls(this.the_doc);
    this.changed =
      this.the_doc.rootDomain !== '' &&
      this.the_doc.domain !== '' &&
      this.the_doc.serviceName !== '';
    if (this.editField) {
      this.textarea_content = this.the_doc[this.editField];
      this.testScript();
    } else this.textarea_content = '';
  }

  readonlyItems(item: string): boolean {
    return (
      item.includes('Url') || item.includes('xml') || item.includes('link')
    );
  }

  scriptError: string = '';

  editTextArea(e: any) {
    if (e instanceof KeyboardEvent) {
      if (this.editField) {
        this.the_doc[this.editField] = this.textarea_content;
        this.changed = true;
      }
    } else {
      this.editField = '' + e;
      this.textarea_content = this.the_doc[this.editField];
    }
    this.testScript();
  }

  doLogin(event: any): void {
    this.login.sqlserver = 'p';
    if (!this.login.code || !this.login.email || !this.login.pass) return;
    if (this.login.code.length !== 6) return;
    if (this.login.pass.length < 8) return;
    if (this.login.email.length < 7) return;
    this.klikket = true;
    const aesparams = this.getAESParams();
    const encrypted = this.doCrypt(true, JSON.stringify(this.login), aesparams);

    this.http
      .post(this.host + this.loginApp + this.getRandomUrl(), encrypted, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((result: any) => {
        this.login.code = '';
        if (result && result.ok === 'yes') {
          this.loggedIn = true;
          this.getCompanies();
        } else {
          this.loggedIn = false;
          this.klikket = false;
        }
        this.changed = false;
      });
  }

  timeOutHandle: any;
  session_timeout_ms = 600 * 1000;

  sessionTimeout(): void {
    if (this.timeOutHandle) clearTimeout(this.timeOutHandle);
    this.timeOutHandle = setTimeout(
      () => (this.loggedIn = false),
      this.session_timeout_ms
    );
  }

  getXMLTags(xml: string): string {
    const node = new DOMParser().parseFromString(
      xml,
      'text/xml'
    ).documentElement;

    const tags: string[] = [];
    node?.childNodes.forEach((child) => tags.push(child.nodeName));

    return tags.toString();
  }

  selectedCompanyId: string = '';
  selectedCompany: any = {
    contactName: 'Snurre Sprett',
    contactMobil: '98765432',
    contactEmail: 'snurre@sprett.net',
    infoText: 'skriv noe fornuftig her',
  };
  companyInfoEdit = false;

  onCompChange(event: any) {
    this.selectedCompany = this.company_list.find(
      (e) => e.orgnr === this.selectedCompanyId
    );
    this.getDocs(this.selectedCompanyId);
  }

  isScriptError(): boolean {
    const sf = Object.keys(this.scriptFields);
    let err = false;
    for (var i = 0; i < sf.length; i++) {
      err = err || this.scriptFields[sf[i]].error;
    }
    return err;
  }

  save(): void {
    if (!this.changed) return;
    if (this.isScriptError()) return;
    if (!this.the_doc.companyId || this.the_doc.companyId.length !== 9)
      this.the_doc.companyId = this.selectedCompanyId;
    this.klikket = true;
    const sendData = {
      serviceUrl: this.the_doc.serviceUrl,
      companyId: this.the_doc.companyId,
      cryptData: {},
    };
    sendData.cryptData = this.doCrypt(true, JSON.stringify(this.the_doc));

    this.http
      .post(this.host + this.saveDocUrl + this.getRandomUrl(), sendData, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: true,
      })
      .subscribe((result: any) => {
        this.changed = false;
        this.klikket = false;
        if (result && result[0].login && result[0].login !== 'yes') {
          this.loggedIn = false;
          return;
        }
        this.getDocs(this.selectedCompanyId);
      });
  }

  brregUrl = 'https://data.brreg.no/enhetsregisteret/api/enheter/';

  new_info_json: any = {};

  orgNrChange(): void {
    if (this.new_orgnr.length === 9) {
      this.klikket = true;
      this.http
        .get(this.brregUrl + this.new_orgnr, {
          headers: this.httpHeaders,
          responseType: 'json',
          observe: 'body',
          withCredentials: false,
        })
        .pipe(catchError((err) => (this.new_company = '!!Feil!!')))
        .subscribe((result: any) => {
          if (result.navn) this.new_company = result.navn;
          this.new_info_json = result;
          this.klikket = false;
        });
    } else {
      this.new_company = '';
    }
  }

  getRandomUrl(): string {
    let s = '/';
    for (let i = 0; i < 17; i++) {
      const t = Math.floor(Math.random() * 26) + 97;
      s += String.fromCharCode(t);
    }
    return s;
  }

  saveJSON2File(): void {
    const link = document.createElement('a');
    const file = new Blob([this.the_doc_text], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = 'hive_onboarding.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  saveQRCode(): void {
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.setAttribute('download', 'image');
    link.href = this.urlImg;
    link.download = 'hive_onboarding_user.png';
    link.click();
    link.remove();
  }
}
