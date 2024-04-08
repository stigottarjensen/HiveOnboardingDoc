import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'HiveOnboardingDoc';

  constructor(private http: HttpClient) { }

  httpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  doc_template = {
    domainUrl: 'https://faciliate.nornirhive.com',
    hostUrl: 'faciliate.nornirhive.com:443',
    websocketUrl: 'wss://faciliate.nornirhive.com/ws-c',
    serviceUrl: 'https://faciliate.nornirhive.com/swg2',
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

  the_doc: any = {};
  doc_keys: any[] = [];

  ngOnInit(): void {
    this.the_doc = JSON.parse(JSON.stringify(this.doc_template));
    this.doc_keys = Object.keys(this.the_doc);
  }

  input_changed(event: any): void {
    this.the_doc.namespace =
      this.the_doc.sub_domain +
      '.' +
      this.the_doc.hive_root_domain +
      '/' +
      this.the_doc.service_name;
  }

  host = 'http://localhost:8778';
  webApp = '/HiveOnboardingDoc/GetSaveDoc';
  result:string = '';

  save(): void {
    this.http
    .post(this.host + this.webApp + this.getRandomUrl(), this.the_doc, {
      headers: this.httpHeaders,
      responseType: 'json',
      observe: 'body',
      withCredentials: false,
    })
    .subscribe((result: any) => {
      this.result = JSON.stringify(result);
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
