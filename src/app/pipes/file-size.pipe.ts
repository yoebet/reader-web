import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'fileSize'})
export class FileSizePipe implements PipeTransform {
  transform(size: number): string {
    if (isNaN(size)) {
      return '';
    }
    if (size < 512) {
      return size + ' B';
    }
    size = size / 1024;
    if (size < 1024) {
      return `${size.toFixed(1)} K`;
    }
    size = size / 1024;
    return `${size.toFixed(1)} M`;
  }
}
