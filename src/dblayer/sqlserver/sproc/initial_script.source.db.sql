-- ============================================================
-- NBL Source DB (neuralbyt) — Stored Procedures & TVP Types
-- Schema: dbo
-- ============================================================

USE staging_neuralbyt;
GO

-- ─── TVP Type ────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.types WHERE is_table_type = 1 AND name = N'SurveyIdList')
    CREATE TYPE dbo.SurveyIdList AS TABLE (SurveyId VARCHAR(64));
GO

-- ─── usp_GetEligibleSurveyCount ──────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_GetEligibleSurveyCount') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_GetEligibleSurveyCount AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_GetEligibleSurveyCount
    @DaysOld INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS TotalEligible
    FROM dbo.surveys
    WHERE CreatedAt < DATEADD(DAY, -@DaysOld, GETDATE());
END
GO

-- ─── usp_GetEligibleSurveyIds ────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_GetEligibleSurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_GetEligibleSurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_GetEligibleSurveyIds
    @DaysOld    INT,
    @ChunkSize  INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@ChunkSize) SurveyGUID AS SurveyId
    FROM dbo.surveys
    WHERE CreatedAt < DATEADD(DAY, -@DaysOld, GETDATE())
    ORDER BY CreatedAt ASC;
END
GO

-- ─── usp_MoveParticipantsBySurveyIds ─────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveParticipantsBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveParticipantsBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveParticipantsBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participants ON;
    INSERT INTO staging_neuralbyt_archive.dbo.participants ([Id], [SurveyId], [VendorId], [UID], [PanelId], [IpAddress], [PStatus], [ClientStatus], [StartAt], [EndAt], [UserLoi], [CreatedAt], [UpdatedAt], [IsRedirected], [SurveyLoi], [SurveyIr], [SurveyClientCost], [VendorCost], [ClientId], [CookieId], [PoNumber], [IsTestUser], [ClientS2SReceived], [ClientS2STime], [ClientSurveyId], [ClientSurveyLoi], [VendorSurveyId], [IsApiSurvey], [IsReconciled], [FinalStatus], [ReconciledAt], [SupplierId], [IsRouterUser], [RouterSurveyId], [ClientGrossCost], [IsAdjusted], [AskingCpi], [SSVendorGUID], [IsNewRouter], [SdkId], [TSPID], [VStatus])
    SELECT [Id], [SurveyId], [VendorId], [UID], [PanelId], [IpAddress], [PStatus], [ClientStatus], [StartAt], [EndAt], [UserLoi], [CreatedAt], [UpdatedAt], [IsRedirected], [SurveyLoi], [SurveyIr], [SurveyClientCost], [VendorCost], [ClientId], [CookieId], [PoNumber], [IsTestUser], [ClientS2SReceived], [ClientS2STime], [ClientSurveyId], [ClientSurveyLoi], [VendorSurveyId], [IsApiSurvey], [IsReconciled], [FinalStatus], [ReconciledAt], [SupplierId], [IsRouterUser], [RouterSurveyId], [ClientGrossCost], [IsAdjusted], [AskingCpi], [SSVendorGUID], [IsNewRouter], [SdkId], [TSPID], [VStatus] FROM dbo.participants
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participants OFF;
END
GO

-- ─── usp_DeleteParticipantsBySurveyIds ───────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteParticipantsBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteParticipantsBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteParticipantsBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.participants
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveParticipantsRedirectsBySurveyIds ────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveParticipantsRedirectsBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveParticipantsRedirectsBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveParticipantsRedirectsBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participantsredirects ON;
    INSERT INTO staging_neuralbyt_archive.dbo.participantsredirects ([Id], [Pid], [LandingUrl], [VendorUrl], [ClientUrl], [ClientReturnUrl], [CreatedAt], [UpdatedAt])
    SELECT pr.[Id], pr.[Pid], pr.[LandingUrl], pr.[VendorUrl], pr.[ClientUrl], pr.[ClientReturnUrl], pr.[CreatedAt], pr.[UpdatedAt]
    FROM dbo.participantsredirects AS pr
    INNER JOIN dbo.participants AS p ON pr.Pid = p.Id
    WHERE p.SurveyId IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participantsredirects OFF;
END
GO

-- ─── usp_DeleteParticipantsRedirectsBySurveyIds ──────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteParticipantsRedirectsBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteParticipantsRedirectsBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteParticipantsRedirectsBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE pr
    FROM dbo.participantsredirects AS pr
    INNER JOIN dbo.participants AS p ON pr.Pid = p.Id
    WHERE p.SurveyId IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveParticipantReplyBySurveyIds ─────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveParticipantReplyBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveParticipantReplyBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveParticipantReplyBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participantreply ON;
    INSERT INTO staging_neuralbyt_archive.dbo.participantreply ([Id], [SelectedData], [SID], [TID], [UID], [ParticipantId], [CreatedAt], [UpdatedAt], [QueryId], [QueryText], [OptionText], [IsCorrect], [LangCode], [CookieId], [IsZipValidate])
    SELECT [Id], [SelectedData], [SID], [TID], [UID], [ParticipantId], [CreatedAt], [UpdatedAt], [QueryId], [QueryText], [OptionText], [IsCorrect], [LangCode], [CookieId], [IsZipValidate] FROM dbo.participantreply
    WHERE SID IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.participantreply OFF;
END
GO

-- ─── usp_DeleteParticipantReplyBySurveyIds ───────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteParticipantReplyBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteParticipantReplyBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteParticipantReplyBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.participantreply
    WHERE SID IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveSurveyDemoMappingBySurveyIds ────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveSurveyDemoMappingBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveSurveyDemoMappingBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveSurveyDemoMappingBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.surveydemomapping ON;
    INSERT INTO staging_neuralbyt_archive.dbo.surveydemomapping ([Id], [SurveyId], [DemographicId], [QueryId], [LangCode], [IsActive], [CreatedAt], [CreatedBy], [UpdatedBy], [UpdatedAt], [AllText], [IsZipValidate], [isApiDemo], [AnswerIds], [SurveyId_Qual])
    SELECT [Id], [SurveyId], [DemographicId], [QueryId], [LangCode], [IsActive], [CreatedAt], [CreatedBy], [UpdatedBy], [UpdatedAt], [AllText], [IsZipValidate], [isApiDemo], [AnswerIds], [SurveyId_Qual] FROM dbo.surveydemomapping
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.surveydemomapping OFF;
END
GO

-- ─── usp_DeleteSurveyDemoMappingBySurveyIds ──────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteSurveyDemoMappingBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteSurveyDemoMappingBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteSurveyDemoMappingBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.surveydemomapping
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveDemoRangeMappingBySurveyIds ─────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveDemoRangeMappingBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveDemoRangeMappingBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveDemoRangeMappingBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.demorangemapping ON;
    INSERT INTO staging_neuralbyt_archive.dbo.demorangemapping ([SurveyId], [DemographicsId], [QueryId], [RangeFrom], [RangeTo], [CreatedBy], [UpdatedBy], [CreatedAt], [UpdatedAt], [LangCode], [Id], [IsActive], [IsApiDemo], [SurveyId_Qual])
    SELECT [SurveyId], [DemographicsId], [QueryId], [RangeFrom], [RangeTo], [CreatedBy], [UpdatedBy], [CreatedAt], [UpdatedAt], [LangCode], [Id], [IsActive], [IsApiDemo], [SurveyId_Qual] FROM dbo.demorangemapping
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.demorangemapping OFF;
END
GO

-- ─── usp_DeleteDemoRangeMappingBySurveyIds ───────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteDemoRangeMappingBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteDemoRangeMappingBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteDemoRangeMappingBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.demorangemapping
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveAllocatedVendorBySurveyIds ──────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveAllocatedVendorBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveAllocatedVendorBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveAllocatedVendorBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.allocatedvendor ON;
    INSERT INTO staging_neuralbyt_archive.dbo.allocatedvendor ([SurveyId], [VendorId], [IsActive], [CompleteUrl], [TerminateUrl], [SecurityUrl], [QuotaFullUrl], [QuotaType], [Quota], [TotalCompleteCount], [CPI], [CreatedBy], [CreatedAt], [UpdatedBy], [UpdatedAt], [SurveyLiveUrl], [SurveyTestUrl], [VendorPo], [SurveyId_VendorId], [SupplierSurveyId], [IsQuotaCheck], [Id])
    SELECT [SurveyId], [VendorId], [IsActive], [CompleteUrl], [TerminateUrl], [SecurityUrl], [QuotaFullUrl], [QuotaType], [Quota], [TotalCompleteCount], [CPI], [CreatedBy], [CreatedAt], [UpdatedBy], [UpdatedAt], [SurveyLiveUrl], [SurveyTestUrl], [VendorPo], [SurveyId_VendorId], [SupplierSurveyId], [IsQuotaCheck], [Id] FROM dbo.allocatedvendor
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.allocatedvendor OFF;
END
GO

-- ─── usp_DeleteAllocatedVendorBySurveyIds ────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteAllocatedVendorBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteAllocatedVendorBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteAllocatedVendorBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.allocatedvendor
    WHERE SurveyId IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_MoveSurveysBySurveyIds ──────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_MoveSurveysBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_MoveSurveysBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_MoveSurveysBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.surveys ON;
    INSERT INTO staging_neuralbyt_archive.dbo.surveys ([Id], [SurveyTitle], [SurveyGUID], [Description], [SurveyStatus], [TsSurveyCode], [LangId], [LOI], [SpeederCheck], [IR], [CPI], [SurveyGruopId], [ProjectManagerId], [CompleteRequired], [LiveURL], [TestURL], [AccountManagerId], [GroupSecurityId], [ClientId], [ClientBillingPO], [IsUniqueLinkSurvey], [IsCountryCheck], [IsIpDuplicate], [IsSpeederCheck], [IsFilterDemographics], [IsVendorQuotaCheck], [CreatedBy], [CreatedAt], [Last_UpdatedBy], [Last_UpdatedAt], [Last_Demographics_UpdatedAt], [Last_Quota_UpdatedAt], [Survey_Closed_At], [SurveyType], [IsActive], [IsHmacEnabled], [IsGroupSecurityEnabled], [SupplyProjectId], [ReservationExpiryTime], [ReservedCount], [IsDemoPerfectMatch], [IsCloneSurvey], [ParentSurveyId], [IsTest], [IsBadSurvey], [Study_Type], [SupportedDevice], [Category], [FieldDays], [IsPulledSurvey], [IsExposed], [TSSubClient], [B2BSurvey], [SecondaryProjectManagerId], [SupplyAccountName], [SuperFillterSurvey], [IsFilterSurvey], [IsRouterFilterSurvey], [IsPickedDIY], [IsPickedNotified], [PickedEmailTime], [PlatformPicked])
    SELECT [Id], [SurveyTitle], [SurveyGUID], [Description], [SurveyStatus], [TsSurveyCode], [LangId], [LOI], [SpeederCheck], [IR], [CPI], [SurveyGruopId], [ProjectManagerId], [CompleteRequired], [LiveURL], [TestURL], [AccountManagerId], [GroupSecurityId], [ClientId], [ClientBillingPO], [IsUniqueLinkSurvey], [IsCountryCheck], [IsIpDuplicate], [IsSpeederCheck], [IsFilterDemographics], [IsVendorQuotaCheck], [CreatedBy], [CreatedAt], [Last_UpdatedBy], [Last_UpdatedAt], [Last_Demographics_UpdatedAt], [Last_Quota_UpdatedAt], [Survey_Closed_At], [SurveyType], [IsActive], [IsHmacEnabled], [IsGroupSecurityEnabled], [SupplyProjectId], [ReservationExpiryTime], [ReservedCount], [IsDemoPerfectMatch], [IsCloneSurvey], [ParentSurveyId], [IsTest], [IsBadSurvey], [Study_Type], [SupportedDevice], [Category], [FieldDays], [IsPulledSurvey], [IsExposed], [TSSubClient], [B2BSurvey], [SecondaryProjectManagerId], [SupplyAccountName], [SuperFillterSurvey], [IsFilterSurvey], [IsRouterFilterSurvey], [IsPickedDIY], [IsPickedNotified], [PickedEmailTime], [PlatformPicked] FROM dbo.surveys
    WHERE SurveyGUID IN (SELECT SurveyId FROM @SurveyId);
    SET IDENTITY_INSERT staging_neuralbyt_archive.dbo.surveys OFF;
END
GO

-- ─── usp_DeleteSurveysBySurveyIds ────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_DeleteSurveysBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_DeleteSurveysBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.usp_DeleteSurveysBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.surveys
    WHERE SurveyGUID IN (SELECT SurveyId FROM @SurveyId);
END
GO

-- ─── usp_UpsertArchivalStatus ─────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.usp_UpsertArchivalStatus') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.usp_UpsertArchivalStatus AS BEGIN SET NOCOUNT ON; END');
GO

CREATE OR ALTER PROCEDURE dbo.usp_UpsertArchivalStatus
    @SessionId      VARCHAR(64),
    @ArchivalDate   DATETIME,
    @TableName      VARCHAR(128),
    @TotalRecords   INT,
    @RecordsMoved   INT,
    @Status         VARCHAR(32),
    @ErrorMessage   VARCHAR(4000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO staging_neuralbyt_archive.dbo.ArchivalStatus AS target
    USING (SELECT @SessionId AS SessionId, @TableName AS TableName) AS source
        ON target.SessionId = source.SessionId AND target.TableName = source.TableName
    WHEN MATCHED THEN
        UPDATE SET
            ArchivalDate  = @ArchivalDate,
            TotalRecords  = @TotalRecords,
            RecordsMoved  = @RecordsMoved,
            Status        = @Status,
            ErrorMessage  = @ErrorMessage
    WHEN NOT MATCHED THEN
        INSERT (SessionId, ArchivalDate, TableName, TotalRecords, RecordsMoved, Status, ErrorMessage)
        VALUES (@SessionId, @ArchivalDate, @TableName, @TotalRecords, @RecordsMoved, @Status, @ErrorMessage);
END
GO

-- ─── Step 1: CopyDataToArchiveDB ─────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CopyDataToArchiveDB') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.CopyDataToArchiveDB AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.CopyDataToArchiveDB
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    -- Child tables first (referential integrity order)
    EXEC dbo.usp_MoveParticipantsBySurveyIds @SurveyId;
    EXEC dbo.usp_MoveParticipantsRedirectsBySurveyIds @SurveyId;
    EXEC dbo.usp_MoveParticipantReplyBySurveyIds @SurveyId;
    EXEC dbo.usp_MoveSurveyDemoMappingBySurveyIds @SurveyId;
    EXEC dbo.usp_MoveDemoRangeMappingBySurveyIds @SurveyId;
    EXEC dbo.usp_MoveAllocatedVendorBySurveyIds @SurveyId;
    -- Master table last
    EXEC dbo.usp_MoveSurveysBySurveyIds @SurveyId;
END
GO

-- ─── Step 2: DeleteDataFromSourceDB ──────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.DeleteDataFromSourceDB') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.DeleteDataFromSourceDB AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.DeleteDataFromSourceDB
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    -- Child tables first
    EXEC dbo.usp_DeleteParticipantsBySurveyIds @SurveyId;
    EXEC dbo.usp_DeleteParticipantsRedirectsBySurveyIds @SurveyId;
    EXEC dbo.usp_DeleteParticipantReplyBySurveyIds @SurveyId;
    EXEC dbo.usp_DeleteSurveyDemoMappingBySurveyIds @SurveyId;
    EXEC dbo.usp_DeleteDemoRangeMappingBySurveyIds @SurveyId;
    EXEC dbo.usp_DeleteAllocatedVendorBySurveyIds @SurveyId;
    -- Master table last
    EXEC dbo.usp_DeleteSurveysBySurveyIds @SurveyId;
END
GO

-- ─── Step 3: ArchiveSurveyDataBySurveyIds (top-level, transactional) ─────────
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ArchiveSurveyDataBySurveyIds') AND type = N'P')
    EXEC('CREATE PROCEDURE dbo.ArchiveSurveyDataBySurveyIds AS BEGIN SET NOCOUNT ON; END');
GO

ALTER PROCEDURE dbo.ArchiveSurveyDataBySurveyIds
    @SurveyId dbo.SurveyIdList READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
    BEGIN TRY
        BEGIN TRANSACTION;
            EXEC dbo.CopyDataToArchiveDB @SurveyId;
            EXEC dbo.DeleteDataFromSourceDB @SurveyId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
