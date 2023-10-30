import type { PipeTransform } from '@nestjs/common'

export class JsonApiPipe implements PipeTransform {
  public transform(value: unknown) {
    return value
  }
}
