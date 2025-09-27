import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notice } from '../../entities/notice.entity';
import { Role } from '../../entities/roles.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly repo: Repository<Notice>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) { }

  async create(dto: CreateNoticeDto, createdByUserId?: string) {
    let visibleRoleId: number | null = null;
    if (dto.visibleFor === 'teacher') visibleRoleId = 2;
    else if (dto.visibleFor === 'student') visibleRoleId = 4;
    else visibleRoleId = null;

    const notice = this.repo.create({
      title: dto.title,
      content: dto.content,
      visibleRoleId,
      createdByUserId: createdByUserId ?? null,
    });
    const saved = await this.repo.save(notice);
    return {
      id: saved.id,
      title: saved.title,
      content: saved.content,
      visibleFor: saved.visibleRoleId === 2 ? 'teacher' : saved.visibleRoleId === 4 ? 'student' : 'all',
      createdBy: 'Secretaría',
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    } as any;
  }

  async update(id: number, dto: UpdateNoticeDto) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Notice not found');
    Object.assign(existing, dto);
    return this.repo.save(existing);
  }

  async remove(id: number) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return { id, affected: 0 } as any;
    await this.repo.delete(id);
    return { id, affected: 1 } as any;
  }

  async findAllByAudience(audience?: 'student' | 'teacher' | 'all') {
    let rows: Notice[] = [];
    if (!audience || audience === 'all') {
      rows = await this.repo.find({ where: { visibleRoleId: IsNull() }, order: { createdAt: 'DESC' } });
    } else {
      const roleId = await this.resolveRoleId(audience);
      rows = await this.repo
        .createQueryBuilder('n')
        .where('n.visible_role_id IS NULL OR n.visible_role_id = :roleId', { roleId })
        .orderBy('n.created_at', 'DESC')
        .getMany();
    }
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      visibleFor: r.visibleRoleId === 2 ? 'teacher' : r.visibleRoleId === 4 ? 'student' : 'all',
      createdBy: 'Secretaría',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  private async resolveRoleId(audience: 'student' | 'teacher'): Promise<number> {
    const names = audience === 'student'
      ? ['alumno', 'student']
      : ['docente', 'teacher', 'profesor'];

    const role = await this.rolesRepo
      .createQueryBuilder('r')
      .where('LOWER(r.name) IN (:...names)', { names })
      .getOne();
    if (!role) {
      throw new NotFoundException(`Role for '${audience}' not found`);
    }
    return role.id;
  }
}
