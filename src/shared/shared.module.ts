import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';



@NgModule({
  declarations: [
    FileUploaderComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FileUploaderComponent
  ]
})
export class SharedModule { }
