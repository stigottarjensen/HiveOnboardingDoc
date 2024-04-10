import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'HiveOnboardingDoc';

  constructor(private http: HttpClient) {}

  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  makeUrls(doc: any): void {
    const domain = doc.domain + '.' + doc.rootDomain;
    doc.domainUrl = 'https://' + domain;
    doc.hostUrl = domain + ':443';
    doc.websocketUrl = 'wss://' + domain + '/ws-c';
    doc.serviceUrl = 'https://' + domain + '/' + doc.serviceName;
  }

  doc_template = {
    companyId: 1234,
    rootDomain: 'norhive.com',
    domainUrl: '',
    hostUrl: '',
    websocketUrl: '',
    serviceUrl: '',
    authToken: 'lk34jroi2jdvllASLDKJF2sfSDFH2jloijr2o3ndf',
    userName: 'faciliate@synxdns.com',
    domainName: 'faciliate',
    domain: 'faciliate',
    serviceName: 'swg2',
    password: 'passwordFaciliate24',
    feature: 'd',
    active: 'true',
    xml: '<rtw><timestamp></timestamp><sender></sender><receiver></receiver><topic></topic><refid></refid><payload></payload></rtw>',
    cmdxml: '<cmd><action></action><param1></param1></cmd>',
    webjs: '',
    timeForChannelRequest: '86000',
    desc: 'test swg2',
    masterScript: '',
    preMasterScript: '',
    searchTerms: '',
    instance: '3',
    mapID: '',
    objectID: '2',
    refobjectID: '',
    refDomain: '',
    refService: '',
    links:
      '<xml><links><link><uri>gateway/dash7</uri><active>true</active></link></links></xml>',
    newUserName: '',
    quantity: '5',
    transactiontimeout: '24',
    sendGhost: '1',
    receiveGhost: '3',
  };

  company_template = {
    id: 1234,
    name: 'IBM',
    orgnr: 999888777,
    contact_person: 'Reodor Felgen',
    email: 'olebrum@hundremeterskogen.am',
    telephone: '19283746',
  };

  the_doc: any = {};
  the_doc_text: string = '';
  doc_keys: any[] = [];
  doc_list: any[] = [];
  domainIndex = 0;

  setDoc(i: number): void {
    this.domainIndex = i;
    if (this.doc_list.length < 1) {
      const jt = JSON.stringify(this.doc_template);
      this.domainIndex = i = 0;
      this.doc_list.push(JSON.parse(jt));
    }
    this.the_doc_text = JSON.stringify(this.doc_list[i]);
    this.the_doc = JSON.parse(this.the_doc_text);
    this.makeUrls(this.the_doc);
    this.doc_keys = Object.keys(this.the_doc);
    this.doc_list.sort((a, b) => {
      if (a.domain > b.domain) return 1;
      if (a.domain < b.domain) return -1;
      if (a.domain === b.domain) {
        if (a.serviceName > b.serviceName) return 1;
        if (a.serviceName < b.serviceName) return -1;
      }
      return 0;
    });
  }

  makeTreeMenuList():Map<string,[]>{
    const m = new Map<string,[]>();
    this.doc_list.forEach((element:any) => {

    });
    return m;
  }

  ngOnInit(): void {
    this.getDocs();
  }

  input_changed(event: any): void {
    this.makeUrls(this.the_doc);
  }

  _input_changed(event: any): void {
    this.the_doc.namespace =
      this.the_doc.sub_domain +
      '.' +
      this.the_doc.hive_root_domain +
      '/' +
      this.the_doc.service_name;
  }

  host = 'http://localhost:8778';
  webApp = '/HiveOnboardingDoc/GetSaveDoc';
  result: string = '';

  getDocs(): void {
    this.http
      .get(this.host + this.webApp + this.getRandomUrl(), {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.doc_list = result;
        this.setDoc(0);
      });
  }

  save(): void {
    this.http
      .post(this.host + this.webApp + this.getRandomUrl(), this.the_doc, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.result = result;
      });
  }

  getRandomUrl(): string {
    let s = '/';
    for (let i = 0; i < 17; i++) {
      const t = Math.floor(Math.random() * 26) + 97;
      s += String.fromCharCode(t);
    }
    return '';
  }
}

// doc_template = {
//   hive_root_domain:"zzz.com",
//   user_name:"user",
//   password:"pass",
//   sub_domain:"sub",
//   contact_root:"qaz",
//   contact_service:"wsx",
//   service_name:"service",
//   service_description:"jada",
//   namespace:"sub.zzz.com/service",
//   connection_type:"driver",
//   number_of_allocated_ghost:10,
//   data_schema: {},
//   command_schema: {},
//   pre_inline_script:"no",
//   post_inline_script:"no",
//   access_token:"Keycloack",
//   is_active:true,
//   keycloack_url: ""
// };

// rootDomain:'norhive.com',
// domainUrl: 'https://faciliate.nornirhive.com',
// hostUrl: 'faciliate.nornirhive.com:443',
// websocketUrl: 'wss://faciliate.nornirhive.com/ws-c',
// serviceUrl: 'https://faciliate.nornirhive.com/swg2',
// authToken: 'lk34jroi2jdvllASLDKJF2sfSDFH2jloijr2o3ndf',
// userName: 'faciliate@synxdns.com',
// domainName: 'faciliate',
// domain: 'faciliate',
// serviceName: 'swg2',
// password: 'passwordFaciliate24',
// feature: 'd',
