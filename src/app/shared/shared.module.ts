import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
// import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
// import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
// import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AccountComponent } from './account/account.component';
import { RouterModule } from '@angular/router';
import { BlockiesModule } from 'angular-blockies';



@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    BlockiesModule,

    MatButtonModule,
    MatCardModule,
    // MatCheckboxModule,
    // MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    // MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    // MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    // MatTabsModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  declarations: [
    AccountComponent
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    BlockiesModule,

    AccountComponent,
    MatButtonModule,
    MatCardModule,
    // MatCheckboxModule,
    // MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    // MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    // MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    // MatTabsModule,
    MatToolbarModule,
    MatTooltipModule
  ]
})
export class SharedModule {}
