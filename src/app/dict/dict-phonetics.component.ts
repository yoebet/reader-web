import {Component, Input, ViewChild, ViewContainerRef} from '@angular/core';
import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'dict-phonetics',
  templateUrl: './dict-phonetics.component.html'
})
export class DictPhoneticsComponent {
  @ViewChild('pronUk', {read: ViewContainerRef}) pronUk: ViewContainerRef;
  @ViewChild('pronUs', {read: ViewContainerRef}) pronUs: ViewContainerRef;
  @Input() entry: DictEntry;

  constructor(private dictService: DictService) {
  }
}
