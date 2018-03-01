import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from './../shared/shared.module';
import { InvoicesRoutingModule } from './invoices-routing.module';

import { InvoicesComponent } from './invoices.component';

import { HomeComponent } from './home/home.component';
import { RequestComponent } from './request/request.component';
import { SearchComponent } from './search/search.component';
import { ContactComponent } from './contact/contact.component';
import { SearchBarComponent } from './search-bar/search-bar.component';

import { ClipboardModule } from 'ngx-clipboard';
import { PopoverModule } from 'ngx-popover';

@NgModule({
  imports: [
    SharedModule,

    ClipboardModule,
    PopoverModule,

    InvoicesRoutingModule
  ],
  declarations: [
    InvoicesComponent,
    HomeComponent,
    RequestComponent,
    SearchComponent,
    ContactComponent,
    SearchBarComponent
  ]
})
export class InvoicesModule {}
