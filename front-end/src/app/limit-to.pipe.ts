import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'limitTo' })
export class LimitToPipe {
  transform(value: string, args: number) : string {
    let limit = args ? args : 500;
    let trail = '...';

    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
