import {Pipe, PipeTransform} from '@angular/core';

import {Model} from '../models/model'

@Pipe({name: 'createdDateString'})
export class CreatedDateStringPipe implements PipeTransform {
  transform(model: Model, format?: string): string {
    return Model.createdTimeString(model, format);
  }
}
