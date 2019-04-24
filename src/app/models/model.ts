import * as moment from 'moment';

export class Model {
  _id: string;
  createdAt: string;
  updatedAt: string;
  version: number;


  static sequenceNo(_id: string, bytes: number = 3): number {
    if (!_id) {
      return parseInt('' + (1 << bytes * 8) * Math.random());
    }
    let hexChars = bytes * 2;
    return parseInt(_id.substr(_id.length - hexChars, hexChars), 16);
  }

  static timestampOfObjectId(_id: string): Date {
    if (!_id) {
      return null;
    }
    let seconds = parseInt(_id.substr(0, 8), 16);
    return new Date(seconds * 1000);
  }

  static createdTime(model: Model): Date {
    if (!model) {
      return null;
    }
    if (model.createdAt) {
      return new Date(model.createdAt);
    }
    return Model.timestampOfObjectId(model._id);
  }

  static createdTimeString(model: Model, precise: string = 'date'): string {
    let ct = Model.createdTime(model);
    if (!ct) {
      return '';
    }
    return Model.timeString(ct, precise);
  }

  static updatedTimeString(model: Model, precise: string = 'date'): string {
    if (!model) {
      return '';
    }
    return Model.timeString(model.updatedAt, precise);
  }

  static timeString(date: Date | string, precise: string = 'date'): string {
    if (!date) {
      return '';
    }
    let format = 'YYYY-M-D';
    if (precise === 'minute' || precise === 'time') {
      format += ' kk:mm';
    } else if (precise === 'second') {
      format += ' kk:mm:ss';
    }
    let dz = moment(date);
    // dz.utcOffset(8);
    return dz.format(format);
  }

}
