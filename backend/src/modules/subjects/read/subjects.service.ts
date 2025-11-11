import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject } from "@/entities/subjects/subject.entity";

@Injectable()
export class SubjectsReadService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async getAll(): Promise<Array<{ id: number; subjectName: string }>> {
    const rows = await this.subjectRepo.find({
      select: { id: true, subjectName: true },
      order: { subjectName: "ASC" },
    });
    return rows.map((s) => ({ id: s.id, subjectName: s.subjectName }));
  }

  async getOne(id: number): Promise<{ id: number; subjectName: string } | null> {
    const found = await this.subjectRepo.findOne({
      where: { id },
      select: { id: true, subjectName: true },
    });
    return found ? { id: found.id, subjectName: found.subjectName } : null;
  }
}
