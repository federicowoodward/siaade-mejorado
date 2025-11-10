import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { PasswordResetToken } from "@/entities/users/password-reset-token.entity";

@Injectable()
export class PasswordResetCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetCleanupService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly prtRepo: Repository<PasswordResetToken>
  ) {}

  onModuleInit() {
    const intervalMs = Number(process.env.RESET_TOKEN_CLEANUP_MS ?? 60 * 60 * 1000); // 1h
    this.logger.log(`Starting cleanup timer: every ${intervalMs}ms`);
    this.timer = setInterval(() => {
      this.cleanup().catch((e) => this.logger.error("Cleanup failed", e.stack));
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async cleanup() {
    const now = new Date();
    const result = await this.prtRepo.delete({ expiresAt: LessThan(now) });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleanup removed ${result.affected} expired reset tokens`);
    }
  }
}
