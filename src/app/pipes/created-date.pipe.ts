import {Pipe, PipeTransform} from '@angular/core';

import {Model} from '../models/model';

@Pipe({name: 'createdDate'})
export class CreatedDatePipe implements PipeTransform {
  transform(model: Model): Date {
    return Model.timestampOfObjectId(model._id);
  }
}
