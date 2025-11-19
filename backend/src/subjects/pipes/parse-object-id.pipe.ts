import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { isUUID } from "class-validator";

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, _metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new BadRequestException("Invalid UUID provided");
    }
    return value;
  }
}
