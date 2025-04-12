import {Component, Input} from '@angular/core';
import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'dict-phonetics',
  templateUrl: './dict-phonetics.component.html'
})
export class DictPhoneticsComponent {
  @Input() entry: DictEntry;

  constructor(private dictService: DictService) {
  }
}
