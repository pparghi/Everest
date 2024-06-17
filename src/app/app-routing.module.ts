import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainContentComponent } from './components/main-content/main-content.component';
import { MembersComponent } from './components/members/members.component';
import { TableOverviewExampleComponent } from './components/table-overview-example/table-overview-example.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full'},
  { path: 'home', component: MainContentComponent },
  // { path: '**', redirectTo: '/home' }
  
  { path: 'members', component: MembersComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
