import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { doc_template } from './app.constants';

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
    doc.xml = this.makeXml('rtw', doc.DataSkjema);
    doc.cmdxml = this.makeXml('cmd', doc.KommandoSkjema);
  }

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
      console.log('Content copied to clipboard');
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
    this.treeMenu = this.makeTreeMenuList();
  }

  makeTreeMenuList(): Map<string, Map<string, any[]>> {
    const M = new Map<string, Map<string, any[]>>();
    this.doc_list.forEach((element: any) => {
      console.log(element.rootDomain, element.domain, element.serviceName);

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
    console.log(M);

    return M;
  }

  ngOnInit(): void {
    this.getCompanies();
  }

  changed = false;

  input_changed(event: any): void {
    this.makeUrls(this.the_doc);
    this.changed = true;
  }

  readonlyItems(item: string): boolean {
    return (
      item.includes('Url') || item.includes('xml') || item.includes('link')
    );
  }

  host = 'http://localhost:8778';
  webApp = '/HiveOnboardingDoc/GetSaveDoc';
  webAppComp = '/HiveOnboardingDoc/GetCompanies';
  result: string = '';

  getDocs(compId?: string): void {
    const urlen =
      this.host + this.webApp + this.getRandomUrl() + `?companyId=${compId}`;

    this.http
      .get(urlen, {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.doc_list = result;
        if (this.doc_list.length < 1) {
          this.doc_list.push(JSON.parse(JSON.stringify(doc_template)));
          this.doc_list[0].companyId = compId;
        }
        this.setDoc();
      });
  }

  selectedCompany: string = '';

  onCompChange(event: any) {
    this.getDocs(this.selectedCompany);
  }

  getCompanies(): void {
    this.http
      .get(this.host + this.webAppComp + this.getRandomUrl(), {
        headers: this.httpHeaders,
        responseType: 'json',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.company_list = result;
        this.selectedCompany = this.company_list[0].orgnr;
        this.getDocs(this.selectedCompany);
      });
  }

  save(): void {
    if (!this.changed) return;
    if (!this.the_doc.companyId || this.the_doc.companyId.length !== 9)
      this.the_doc.companyId = this.selectedCompany;
    console.log(this.the_doc);

    this.http
      .post(this.host + this.webApp + this.getRandomUrl(), this.the_doc, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.getDocs(this.selectedCompany);
        this.changed = false;
      });
  }

  saveCompany() {
    if (this.new_company.trim() === '' && this.new_orgnr.trim().length !== 9)
      return;

    const body = { orgNr: this.new_orgnr, companyName: this.new_company };
    this.http
      .post(this.host + this.webApp + this.getRandomUrl(), body, {
        headers: this.httpHeaders,
        responseType: 'text',
        observe: 'body',
        withCredentials: false,
      })
      .subscribe((result: any) => {
        this.getCompanies();
        this.new_company = '';
        this.new_orgnr = '';
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

  saveJSON2File(): void {
    const link = document.createElement('a');
    const file = new Blob([this.the_doc_text], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = 'hive_onboarding.json'; 
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

