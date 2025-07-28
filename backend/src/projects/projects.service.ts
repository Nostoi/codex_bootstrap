import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import { Project } from "@prisma/client";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Project> {
    return this.prisma.project.delete({ where: { id } });
  }
}
