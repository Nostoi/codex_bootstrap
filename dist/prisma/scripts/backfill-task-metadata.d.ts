#!/usr/bin/env ts-node
declare class TaskMetadataBackfillMigration {
    private stats;
    private isDryRun;
    private isRollback;
    constructor();
    execute(): Promise<void>;
    private preFlightCheck;
    private backfillMetadata;
    private rollbackMetadata;
    private postFlightCheck;
    private printSummary;
}
export { TaskMetadataBackfillMigration };
