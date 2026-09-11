import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, name: string, color: string) {
    return this.prisma.department.create({
      data: { tenantId, name, color },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        users: {
          include: { user: true }
        }
      }
    });
  }

  async addUserToDepartment(tenantId: string, departmentId: string, userId: string) {
    // Verify department belongs to tenant
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, tenantId }
    });
    if (!dept) throw new NotFoundException('Department not found');

    return this.prisma.userDepartment.create({
      data: { userId, departmentId }
    });
  }

  async removeUserFromDepartment(tenantId: string, departmentId: string, userId: string) {
    // Verify department belongs to tenant
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, tenantId }
    });
    if (!dept) throw new NotFoundException('Department not found');

    return this.prisma.userDepartment.delete({
      where: {
        userId_departmentId: { userId, departmentId }
      }
    });
  }

  async update(tenantId: string, id: string, data: { name?: string, color?: string }) {
    return this.prisma.department.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    // First, delete all UserDepartment relations
    await this.prisma.userDepartment.deleteMany({
      where: { departmentId: id }
    });

    // Also update all conversations that were in this department to have null department
    await this.prisma.conversation.updateMany({
      where: { departmentId: id, tenantId },
      data: { departmentId: null }
    });

    // Finally delete the department
    return this.prisma.department.delete({
      where: { id, tenantId }
    });
  }
}
