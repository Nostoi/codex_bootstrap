export declare class CreateProjectDto {
    name: string;
    description?: string;
    ownerId: string;
}
declare const UpdateProjectDto_base: import("@nestjs/common").Type<Partial<CreateProjectDto>>;
export declare class UpdateProjectDto extends UpdateProjectDto_base {
}
export {};
