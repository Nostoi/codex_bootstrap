import { ProjectsService } from "./projects.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(dto: CreateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
    }>;
    update(id: string, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        description: string | null;
    }>;
}
