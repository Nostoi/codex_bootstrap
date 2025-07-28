export declare class CreateDocumentDto {
    title: string;
    content?: string;
    ownerId: string;
}
declare const UpdateDocumentDto_base: import("@nestjs/common").Type<Partial<CreateDocumentDto>>;
export declare class UpdateDocumentDto extends UpdateDocumentDto_base {
}
export {};
