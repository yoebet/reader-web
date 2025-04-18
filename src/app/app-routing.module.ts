import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {BookListComponent} from './book-list/book-list.component';
import {BookComponent} from './book/book.component';
import {ChapComponent} from './chap/chap.component';
import {LatestBookListComponent} from './book-list/latest-book-list.component';

const routes: Routes = [
  {path: 'books', component: BookListComponent},
  {path: 'books/latest', component: LatestBookListComponent},
  {path: 'books/cat/:cat', component: BookListComponent},
  {path: 'books/:id', component: BookComponent},
  {path: 'chaps/:id', component: ChapComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // enableTracing: true,
    // useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
