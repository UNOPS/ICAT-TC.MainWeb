
import { LazyLoadEvent, ConfirmationService, MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import {
  DocumentControllerServiceProxy,
  Documents,
  DocumentsDocumentOwner,
} from '../../../shared/service-proxies/service-proxies';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { GlobalArrayService } from '../global-documents/global-documents.service';
import { openAuthenticatedDocumentById } from '../authenticated-download.util';

@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css'],
})
export class DocumentUploadComponent implements OnInit, OnChanges {
  @Input() doucmentList: Documents[] = [];
  @Input() documentOwner: DocumentsDocumentOwner;
  @Input() documentOwnerId: number;
  @Input() isNew: boolean;
  @Input() showDeleteButton: boolean = true;
  @Input() showUpload: boolean = true;
  @Input() id: number = 0;
  @Output() valueClicked = new EventEmitter<any>();

  loading: boolean;
  uploadedFiles: any[] = [];
  SERVER_URL1 = environment.baseUrlAPI;
  SERVER_URL = environment.baseUrlAPI + '/document/upload2';
  SERVER_URL_ANONYMOUS = environment.baseUrlAPI + '/document/upload2';
  uploadURL: string;
  token: string;
  constructor(
    private docService: DocumentControllerServiceProxy,
    private httpClient: HttpClient,
    private confirmationService: ConfirmationService,
    private docArrayforSave:GlobalArrayService,
    private messageService: MessageService,
  ) {
    this.token = localStorage.getItem('ACCESS_TOKEN')!;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.documentOwner) {
      this.uploadURL =
        (this.token ? this.SERVER_URL : this.SERVER_URL_ANONYMOUS) +
        '/' +
        this.documentOwnerId +
        '/' +
        this.documentOwner.toString();
    }
    this.load();
  }

  ngOnInit(): void {

    if (this.documentOwner) {
      this.uploadURL =
        (this.token ? this.SERVER_URL : this.SERVER_URL_ANONYMOUS) +
        '/' +
        this.documentOwnerId +
        '/' +
        this.documentOwner.toString();
    }
  }

  loadDocments(event: LazyLoadEvent) {
    
    this.load();
  }

  async load() {
    if (!this.isNew) {
      this.loading = true;

      if (this.token) {
        await this.docService
          .getDocuments(this.documentOwnerId, this.documentOwner)
          .subscribe(
            (res) => {

              this.doucmentList = res;
              this.loading = false;
              let ids=res.map(item=>{return item.id})
            
                this.docArrayforSave.addItem(ids)
              
              this.docArrayforSave.getArray();
              
             
            },
            
          );
      } else {
     
        await this.docService
          .getDocuments(this.documentOwnerId, this.documentOwner)
          .subscribe(
            (res) => {
              this.valueClicked.emit({ data: res, res})
              this.doucmentList = res;
              this.loading = false;
            },
          );
      }
    }
  }

  onUploadComplete(event: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: 'Document  has been uploaded successfully ',
      closable: true,
    });
    setTimeout(() => {
      this.load();
    }, 1500);
    
  }

  async myUploader(event: any) {
    this.loading = true;
    if (this.doucmentList === undefined || this.doucmentList === null) {
      this.doucmentList = new Array();
    }

    for (let file of event.files) {
      this.loading = true;
      file.documentOwner = this.documentOwner;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentOwner', this.documentOwner.toString());
      let fullUrl =
        this.SERVER_URL +
        '/' +
        this.documentOwnerId +
        '/' +
        this.documentOwner.toString();

      
      this.httpClient.post<any>(fullUrl, formData).subscribe(
        (res) => {
          this.valueClicked.emit({ data: res, fullUrl})
          
          this.load();
        },
        (err) => {
          this.loading = false;
        }
      );
    }
    
  }

  async deleteConfirm(doc: Documents) {
    this.confirmationService.confirm({
      message: `Do you want to delete ${(doc.fileName)} ?`,
      header: 'Delete confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        if (this.token) {
          this.docService.deleteDoc(doc.id).subscribe(
            (res: any) => {
             
              this.docArrayforSave.removeItem(doc.id);
              this.docArrayforSave.getArray();
              this.messageService.add({
                severity: 'info',
                summary: 'Success',
                detail: 'Document  has been deleted successfully ',
                closable: true,
              });
              setTimeout(() => {
                this.load();
              }, 1500);
            },
          );
        } else {
          this.docService.deleteDoc(doc.id).subscribe(
            (res: any) => {
              this.load();
            },
            
          );
        }
      },
      reject: () => {
      },
    });
  }

  async downloadDocument(doc: Documents): Promise<void> {
    try {
      await openAuthenticatedDocumentById(this.httpClient, this.SERVER_URL1, doc.id);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download document',
        closable: true,
      });
    }
  }

  base64ToArrayBuffer(base64: any) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  onUpload(event: any) {
    alert('test');
  }
}
