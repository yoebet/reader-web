import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SuiModule} from 'ng2-semantic-ui';

import {AppRoutingModule} from './app-routing.module';

import {AppService} from './services/app.service';
import {BookService} from './services/book.service';
import {ChapService} from './services/chap.service';
import {ParaService} from './services/para.service';
import {DictService} from './services/dict.service';
import {DictZhService} from './services/dict-zh.service';
import {SessionService} from './services/session.service';
import {WxAuthService} from './services/wx-auth.service';
import {UserBookService} from './services/user-book.service';
import {UserWordService} from './services/user-word.service';
import {WordCategoryService} from './services/word-category.service';
import {UserVocabularyService} from './services/user-vocabulary.service';
import {UserPreferenceService} from './services/user-preference.service';
import {AnnotationsService} from './services/annotations.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';
import {PriceLabelPipe} from './pipes/price-label.pipe';
import {FileSizePipe} from './pipes/file-size.pipe';
import {ApproximateNumberPipe} from './pipes/approximate-number.pipe';
import {WordFamiliarityPipe} from './pipes/word-familiarity.pipe';

import {AppComponent} from './app.component';
import {AppFooterComponent} from './app-footer.component';
import {BookListComponent} from './book/book-list.component';
import {BookComponent} from './book/book.component';
import {BookInfoComponent} from './book/book-info.component';
import {ChapComponent} from './chap/chap.component';
import {ParaContentComponent} from './content/para-content.component';
import {ParaCommentsComponent} from './content/para-comments.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictSimpleComponent} from './dict/dict-simple.component';
import {WordTagsComponent} from './dict/word-tags.component';
import {WordTextComponent} from './dict/word-text.component';
import {UserWordComponent} from './dict/user-word.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {DictZhEntryComponent} from './dict-zh/dict-zh-entry.component';
import {DictZhEntrySmiComponent} from './dict-zh/dict-zh-entry-smi.component';
import {LoginPopupComponent} from './account/login-popup.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SuiModule
  ],
  declarations: [
    AppComponent,
    AppFooterComponent,
    BookListComponent,
    BookComponent,
    BookInfoComponent,
    ChapComponent,
    ParaContentComponent,
    ParaCommentsComponent,
    WordAnnosComponent,
    DictEntryComponent,
    DictZhEntryComponent,
    DictZhEntrySmiComponent,
    CreatedDatePipe,
    CreatedDateStringPipe,
    PriceLabelPipe,
    FileSizePipe,
    ApproximateNumberPipe,
    WordFamiliarityPipe,
    DictSimpleComponent,
    WordTagsComponent,
    WordTextComponent,
    UserWordComponent,
    LoginPopupComponent
  ],
  providers: [
    AppService,
    BookService,
    ChapService,
    ParaService,
    DictService,
    DictZhService,
    SessionService,
    WxAuthService,
    UserBookService,
    UserWordService,
    WordCategoryService,
    UserVocabularyService,
    UserPreferenceService,
    AnnotationsService,
    PriceLabelPipe
  ],
  entryComponents: [
    BookInfoComponent,
    WordAnnosComponent,
    DictSimpleComponent,
    LoginPopupComponent,
    ParaCommentsComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
