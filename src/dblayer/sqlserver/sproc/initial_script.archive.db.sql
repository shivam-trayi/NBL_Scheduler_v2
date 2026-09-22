-- ============================================================
-- NBL Archive DB (staging_neuralbyt_archive) — Table Creation Script
-- Schema: dbo
-- Run this ONCE to set up the archive database.
-- ============================================================

-- Create archive database if it doesn't exist
IF DB_ID(N'staging_neuralbyt_archive') IS NULL
    CREATE DATABASE staging_neuralbyt_archive;
GO

USE staging_neuralbyt_archive;
GO

-- ─── surveys ─────────────────────────────────────────────────
-- Mirror of neuralbyt.dbo.surveys
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'surveys' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.surveys (
        Id                          INT IDENTITY(1,1) NOT NULL,
        SurveyTitle                 VARCHAR(255)    NOT NULL,
        SurveyGUID                  VARCHAR(64)     NOT NULL,
        Description                 VARCHAR(300)    NULL,
        SurveyStatus                INT             NULL,
        TsSurveyCode                VARCHAR(45)     NULL,
        LangId                      INT             NULL,
        LOI                         INT             NULL,
        SpeederCheck                INT             NULL,
        IR                          INT             NULL,
        CPI                         DECIMAL(16,2)   NULL,
        SurveyGruopId               VARCHAR(5)      NULL,
        ProjectManagerId            INT             NULL,
        CompleteRequired            INT             NULL,
        LiveURL                     VARCHAR(500)    NULL,
        TestURL                     VARCHAR(500)    NULL,
        AccountManagerId            INT             NULL,
        GroupSecurityId             INT             NULL,
        ClientId                    VARCHAR(65)     NULL,
        ClientBillingPO             VARCHAR(65)     NULL,
        IsUniqueLinkSurvey          SMALLINT        NULL,
        IsCountryCheck              SMALLINT        NULL,
        IsIpDuplicate               SMALLINT        NULL,
        IsSpeederCheck              SMALLINT        NULL,
        IsFilterDemographics        SMALLINT        NULL,
        IsVendorQuotaCheck          SMALLINT        NULL,
        CreatedBy                   INT             NULL,
        CreatedAt                   DATETIME2(0)    NULL,
        Last_UpdatedBy              INT             NULL,
        Last_UpdatedAt              DATETIME2(0)    NULL,
        Last_Demographics_UpdatedAt DATETIME2(0)    NULL,
        Last_Quota_UpdatedAt        DATETIME2(0)    NULL,
        Survey_Closed_At            DATETIME2(0)    NULL,
        SurveyType                  SMALLINT        NULL,
        IsActive                    SMALLINT        NULL,
        IsHmacEnabled               SMALLINT        NULL,
        IsGroupSecurityEnabled      SMALLINT        NULL,
        SupplyProjectId             INT             NULL,
        ReservationExpiryTime       DATETIME2(0)    NULL,
        ReservedCount               INT             NULL,
        IsDemoPerfectMatch          SMALLINT        NULL,
        IsCloneSurvey               SMALLINT        NULL,
        ParentSurveyId              VARCHAR(64)     NULL,
        IsTest                      SMALLINT        NULL,
        IsBadSurvey                 TINYINT         NULL,
        Study_Type                  INT             NULL,
        SupportedDevice             NVARCHAR(100)   NULL,
        Category                    NVARCHAR(100)   NULL,
        FieldDays                   INT             NULL,
        IsPulledSurvey              TINYINT         NULL,
        IsExposed                   INT             NULL,
        TSSubClient                 NVARCHAR(128)   NULL,
        B2BSurvey                   TINYINT         NULL,
        SecondaryProjectManagerId   INT             NULL,
        SupplyAccountName           NVARCHAR(1200)  NULL,
        SuperFillterSurvey          INT             NOT NULL DEFAULT 0,
        IsFilterSurvey              INT             NOT NULL DEFAULT 0,
        IsRouterFilterSurvey        INT             NOT NULL DEFAULT 0,
        IsPickedDIY                 TINYINT         NOT NULL DEFAULT 0,
        IsPickedNotified            TINYINT         NOT NULL DEFAULT 0,
        PickedEmailTime             DATETIME        NULL,
        PlatformPicked              INT             NULL,
        CONSTRAINT PK_archive_surveys PRIMARY KEY (Id)
    );
    CREATE UNIQUE NONCLUSTERED INDEX idx_archive_surveys_SurveyGUID
        ON dbo.surveys (SurveyGUID);
END;
GO

-- ─── participants ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'participants' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.participants (
        Id              INT IDENTITY(1,1) NOT NULL,
        SurveyId        VARCHAR(65)     NULL,
        VendorId        VARCHAR(65)     NULL,
        UID             VARCHAR(65)     NULL,
        PanelId         VARCHAR(65)     NULL,
        IpAddress       VARCHAR(15)     NULL,
        PStatus         INT             NULL,
        ClientStatus    INT             NULL,
        StartAt         DATETIME2(0)    NULL,
        EndAt           DATETIME2(0)    NULL,
        UserLoi         DECIMAL(16,2)   NULL,
        CreatedAt       DATETIME2(0)    NULL,
        UpdatedAt       DATETIME2(0)    NULL,
        IsRedirected    SMALLINT        NULL,
        SurveyLoi       INT             NULL,
        SurveyIr        INT             NULL,
        SurveyClientCost DECIMAL(10,2)  NULL,
        VendorCost      DECIMAL(10,2)   NULL,
        ClientId        VARCHAR(65)     NULL,
        CookieId        INT             NULL,
        PoNumber        VARCHAR(255)    NULL,
        IsTestUser      SMALLINT        NULL,
        ClientS2SReceived SMALLINT      NULL,
        ClientS2STime   DATETIME2(0)    NULL,
        ClientSurveyId  VARCHAR(65)     NULL,
        ClientSurveyLoi INT             NULL,
        VendorSurveyId  VARCHAR(65)     NULL,
        IsApiSurvey     SMALLINT        NULL,
        IsReconciled    SMALLINT        NULL,
        FinalStatus     INT             NULL,
        ReconciledAt    DATETIME2(0)    NULL,
        SupplierId      INT             NULL,
        IsRouterUser    TINYINT         NULL,
        RouterSurveyId  VARCHAR(65)     NULL,
        ClientGrossCost DECIMAL(10,2)   NULL,
        IsAdjusted      TINYINT         NULL,
        AskingCpi       DECIMAL(10,2)   NULL,
        SSVendorGUID    VARCHAR(64)     NULL,
        IsNewRouter     TINYINT         NULL,
        SdkId           INT             NULL,
        TSPID           INT             NULL,
        VStatus         INT             NULL,
        CONSTRAINT PK_archive_participants PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX idx_archive_participants_SurveyId
        ON dbo.participants (SurveyId);
END;
GO

-- ─── participantsredirects ────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'participantsredirects' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.participantsredirects (
        Id              INT IDENTITY(1,1) NOT NULL,
        Pid             INT             NULL,
        LandingUrl      VARCHAR(MAX)    NULL,
        VendorUrl       VARCHAR(MAX)    NULL,
        ClientUrl       VARCHAR(MAX)    NULL,
        ClientReturnUrl VARCHAR(MAX)    NULL,
        CreatedAt       DATETIME2(0)    NULL,
        UpdatedAt       DATETIME2(0)    NULL,
        CONSTRAINT PK_archive_participantsredirects PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX idx_archive_participantsredirects_Pid
        ON dbo.participantsredirects (Pid);
END;
GO

-- ─── participantreply ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'participantreply' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.participantreply (
        Id              INT IDENTITY(1,1) NOT NULL,
        SelectedData    NVARCHAR(MAX)   NULL,
        SID             NVARCHAR(65)    NULL,
        TID             NVARCHAR(65)    NULL,
        UID             NVARCHAR(100)   NULL,
        ParticipantId   NVARCHAR(100)   NULL,
        CreatedAt       DATETIME2(0)    NULL,
        UpdatedAt       DATETIME2(0)    NULL,
        QueryId         NVARCHAR(65)    NULL,
        QueryText       NVARCHAR(MAX)   NULL,
        OptionText      NVARCHAR(600)   NULL,
        IsCorrect       SMALLINT        NULL,
        LangCode        NVARCHAR(30)    NULL,
        CookieId        INT             NULL,
        IsZipValidate   SMALLINT        DEFAULT 0 NULL,
        CONSTRAINT PK_archive_participantreply PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX idx_archive_participantreply_SID
        ON dbo.participantreply (SID);
END;
GO

-- ─── surveydemomapping ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'surveydemomapping' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.surveydemomapping (
        Id              INT IDENTITY(1,1) NOT NULL,
        SurveyId        VARCHAR(155)    NULL,
        DemographicId   INT             NULL,
        QueryId         INT             NULL,
        LangCode        INT             NULL,
        IsActive        SMALLINT        DEFAULT 1 NULL,
        CreatedAt       DATETIME2(0)    NULL,
        CreatedBy       INT             NOT NULL,
        UpdatedBy       INT             NULL,
        UpdatedAt       DATETIME2(0)    NULL,
        AllText         VARCHAR(MAX)    NULL,
        IsZipValidate   SMALLINT        DEFAULT 0 NULL,
        isApiDemo       SMALLINT        DEFAULT 0 NULL,
        AnswerIds       VARCHAR(1024)   NULL,
        SurveyId_Qual   VARCHAR(64)     NULL,
        CONSTRAINT PK_archive_surveydemomapping PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX idx_archive_surveydemomapping_SurveyId
        ON dbo.surveydemomapping (SurveyId);
END;
GO

-- ─── demorangemapping ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'demorangemapping' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.demorangemapping (
        Id              INT IDENTITY(1,1) NOT NULL,
        SurveyId        VARCHAR(155)    NULL,
        DemographicsId  INT             NULL,
        QueryId         INT             NULL,
        RangeFrom       INT             NULL,
        RangeTo         INT             NULL,
        CreatedBy       INT             NULL,
        UpdatedBy       INT             NULL,
        CreatedAt       DATETIME2(0)    NULL,
        UpdatedAt       DATETIME2(0)    NULL,
        LangCode        INT             NULL,
        IsActive        SMALLINT        DEFAULT 1 NULL,
        IsApiDemo       SMALLINT        DEFAULT 0 NULL,
        SurveyId_Qual   VARCHAR(64)     NULL,
        CONSTRAINT PK_archive_demorangemapping PRIMARY KEY (Id)
    );
    CREATE NONCLUSTERED INDEX idx_archive_demorangemapping_SurveyId
        ON dbo.demorangemapping (SurveyId);
END;
GO

-- ─── allocatedvendor ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'allocatedvendor' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.allocatedvendor (
        Id                  INT IDENTITY(1,1) NOT NULL,
        SurveyId            VARCHAR(65)     NOT NULL,
        VendorId            VARCHAR(65)     NOT NULL,
        IsActive            SMALLINT        DEFAULT 1 NULL,
        CompleteUrl         VARCHAR(600)    NULL,
        TerminateUrl        VARCHAR(600)    NULL,
        SecurityUrl         VARCHAR(600)    NULL,
        QuotaFullUrl        VARCHAR(600)    NULL,
        QuotaType           VARCHAR(6)      NULL,
        Quota               DECIMAL(12,2)   NULL,
        TotalCompleteCount  INT             NULL,
        CPI                 DECIMAL(10,2)   NULL,
        CreatedBy           INT             NULL,
        CreatedAt           DATETIME        DEFAULT GETDATE() NOT NULL,
        UpdatedBy           INT             NULL,
        UpdatedAt           DATETIME        NULL,
        SurveyLiveUrl       VARCHAR(600)    NULL,
        SurveyTestUrl       VARCHAR(600)    NULL,
        VendorPo            VARCHAR(45)     NULL,
        SurveyId_VendorId   VARCHAR(100)    NULL,
        SupplierSurveyId    VARCHAR(128)    NULL,
        IsQuotaCheck        BIT             DEFAULT 0 NULL,
        CONSTRAINT PK_archive_allocatedvendor PRIMARY KEY (Id),
        CONSTRAINT UQ_archive_surveyId_vendorId UNIQUE (SurveyId_VendorId)
    );
    CREATE NONCLUSTERED INDEX idx_archive_allocatedvendor_SurveyId
        ON dbo.allocatedvendor (SurveyId);
END;
GO

-- ─── ArchivalStatus ───────────────────────────────────────────
-- Tracks per-session, per-table archival progress
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'ArchivalStatus' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
    CREATE TABLE dbo.ArchivalStatus (
        ArchiveId       INT IDENTITY(1,1) NOT NULL,
        SessionId       VARCHAR(64)     NOT NULL,
        TableName       VARCHAR(128)    NOT NULL,
        ArchivalDate    DATETIME        NOT NULL DEFAULT GETDATE(),
        TotalRecords    INT             NOT NULL,
        RecordsMoved    INT             NOT NULL,
        [Status]        VARCHAR(32)     NOT NULL,
        ErrorMessage    VARCHAR(4000)   NULL,
        CONSTRAINT PK_ArchivalStatus PRIMARY KEY (ArchiveId)
    );
    CREATE NONCLUSTERED INDEX idx_ArchivalStatus_SessionId
        ON dbo.ArchivalStatus (SessionId);
END;
GO
