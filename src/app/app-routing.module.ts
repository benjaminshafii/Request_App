import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: './invoices/invoices.module#InvoicesModule',
    data: { preload: true }
  },
  // { pathMatch: 'full', path: '**', redirectTo: '/' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // , { useHash: true }
  exports: [RouterModule]
})
export class AppRoutingModule {}
