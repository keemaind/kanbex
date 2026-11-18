using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Kanbex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApplicationUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    AvatarUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdentityRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdentityRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    IsPublic = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    OwnerId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                    table.UniqueConstraint("AK_Projects_Id_OwnerId", x => new { x.Id, x.OwnerId });
                    table.CheckConstraint("CK_Projects_Name_NotEmpty", "length(trim(\"Name\")) > 0");
                    table.CheckConstraint("CK_Projects_Version_NonNegative", "\"Version\" >= 0");
                    table.ForeignKey(
                        name: "FK_Projects_ApplicationUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserClaims_ApplicationUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_UserLogins_ApplicationUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_UserTokens_ApplicationUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleClaims_IdentityRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "IdentityRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    RoleId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_ApplicationUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_IdentityRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "IdentityRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Columns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    WipLimit = table.Column<int>(type: "INTEGER", nullable: true),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Columns", x => x.Id);
                    table.UniqueConstraint("AK_Columns_Id_ProjectId", x => new { x.Id, x.ProjectId });
                    table.CheckConstraint("CK_Columns_Name_NotEmpty", "length(trim(\"Name\")) > 0");
                    table.CheckConstraint("CK_Columns_SortOrder_NonNegative", "\"SortOrder\" >= 0");
                    table.CheckConstraint("CK_Columns_WipLimit_Positive", "\"WipLimit\" IS NULL OR \"WipLimit\" > 0");
                    table.ForeignKey(
                        name: "FK_Columns_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 24, nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_ApplicationUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Color = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.UniqueConstraint("AK_Tags_Id_ProjectId", x => new { x.Id, x.ProjectId });
                    table.CheckConstraint("CK_Tags_Name_NotEmpty", "length(trim(\"Name\")) > 0");
                    table.ForeignKey(
                        name: "FK_Tags_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 10000, nullable: true),
                    Priority = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false),
                    ColumnId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssigneeId = table.Column<string>(type: "TEXT", nullable: true),
                    ReporterId = table.Column<string>(type: "TEXT", nullable: false),
                    DueDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Estimate = table.Column<int>(type: "INTEGER", nullable: true, comment: "Estimate in relative story points."),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanTasks", x => x.Id);
                    table.UniqueConstraint("AK_KanbanTasks_Id_ColumnId_ProjectId", x => new { x.Id, x.ColumnId, x.ProjectId });
                    table.UniqueConstraint("AK_KanbanTasks_Id_ProjectId", x => new { x.Id, x.ProjectId });
                    table.CheckConstraint("CK_KanbanTasks_Estimate_NonNegative", "\"Estimate\" IS NULL OR \"Estimate\" >= 0");
                    table.CheckConstraint("CK_KanbanTasks_Position_NonNegative", "\"Position\" >= 0");
                    table.CheckConstraint("CK_KanbanTasks_Title_NotEmpty", "length(trim(\"Title\")) > 0");
                    table.ForeignKey(
                        name: "FK_KanbanTasks_ApplicationUsers_AssigneeId",
                        column: x => x.AssigneeId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KanbanTasks_ApplicationUsers_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KanbanTasks_Columns_ColumnId_ProjectId",
                        columns: x => new { x.ColumnId, x.ProjectId },
                        principalTable: "Columns",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KanbanTasks_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AuthorId = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.CheckConstraint("CK_Comments_Content_NotEmpty", "length(trim(\"Content\")) > 0");
                    table.ForeignKey(
                        name: "FK_Comments_ApplicationUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comments_KanbanTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "KanbanTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OldColumnId = table.Column<Guid>(type: "TEXT", nullable: true),
                    NewColumnId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ChangedById = table.Column<string>(type: "TEXT", nullable: false),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Details = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskHistory", x => x.Id);
                    table.UniqueConstraint("AK_TaskHistory_Id_TaskId", x => new { x.Id, x.TaskId });
                    table.ForeignKey(
                        name: "FK_TaskHistory_ApplicationUsers_ChangedById",
                        column: x => x.ChangedById,
                        principalTable: "ApplicationUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskHistory_Columns_NewColumnId_ProjectId",
                        columns: x => new { x.NewColumnId, x.ProjectId },
                        principalTable: "Columns",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskHistory_Columns_OldColumnId_ProjectId",
                        columns: x => new { x.OldColumnId, x.ProjectId },
                        principalTable: "Columns",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskHistory_KanbanTasks_TaskId_ProjectId",
                        columns: x => new { x.TaskId, x.ProjectId },
                        principalTable: "KanbanTasks",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskTags",
                columns: table => new
                {
                    TaskId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TagId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProjectId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTags", x => new { x.TaskId, x.TagId });
                    table.ForeignKey(
                        name: "FK_TaskTags_KanbanTasks_TaskId_ProjectId",
                        columns: x => new { x.TaskId, x.ProjectId },
                        principalTable: "KanbanTasks",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskTags_Tags_TagId_ProjectId",
                        columns: x => new { x.TagId, x.ProjectId },
                        principalTable: "Tags",
                        principalColumns: new[] { "Id", "ProjectId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "IdentityRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "9f8db0c4-34be-4c3d-91bf-29194b84f701", "7e9554c8-8d38-4b6f-9585-d7e8e3758b01", "Admin", "ADMIN" },
                    { "9f8db0c4-34be-4c3d-91bf-29194b84f702", "7e9554c8-8d38-4b6f-9585-d7e8e3758b02", "User", "USER" }
                });

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "ApplicationUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "ApplicationUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Columns_ProjectId_SortOrder",
                table: "Columns",
                columns: new[] { "ProjectId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_AuthorId",
                table: "Comments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_TaskId_CreatedAt",
                table: "Comments",
                columns: new[] { "TaskId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "IdentityRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_AssigneeId",
                table: "KanbanTasks",
                column: "AssigneeId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_ColumnId_Position",
                table: "KanbanTasks",
                columns: new[] { "ColumnId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_ColumnId_ProjectId",
                table: "KanbanTasks",
                columns: new[] { "ColumnId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_ProjectId",
                table: "KanbanTasks",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_ReporterId",
                table: "KanbanTasks",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_ProjectId_UserId",
                table: "ProjectMembers",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_UserId",
                table: "ProjectMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_OwnerId",
                table: "Projects",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleClaims_RoleId",
                table: "RoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ProjectId_Name",
                table: "Tags",
                columns: new[] { "ProjectId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskHistory_ChangedById",
                table: "TaskHistory",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_TaskHistory_NewColumnId_ProjectId",
                table: "TaskHistory",
                columns: new[] { "NewColumnId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskHistory_OldColumnId_ProjectId",
                table: "TaskHistory",
                columns: new[] { "OldColumnId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskHistory_TaskId_ChangedAt",
                table: "TaskHistory",
                columns: new[] { "TaskId", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskHistory_TaskId_ProjectId",
                table: "TaskHistory",
                columns: new[] { "TaskId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_TagId_ProjectId",
                table: "TaskTags",
                columns: new[] { "TagId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_TagId_TaskId",
                table: "TaskTags",
                columns: new[] { "TagId", "TaskId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_TaskId_ProjectId",
                table: "TaskTags",
                columns: new[] { "TaskId", "ProjectId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserClaims_UserId",
                table: "UserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLogins_UserId",
                table: "UserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "ProjectMembers");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "TaskHistory");

            migrationBuilder.DropTable(
                name: "TaskTags");

            migrationBuilder.DropTable(
                name: "UserClaims");

            migrationBuilder.DropTable(
                name: "UserLogins");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "UserTokens");

            migrationBuilder.DropTable(
                name: "KanbanTasks");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "IdentityRoles");

            migrationBuilder.DropTable(
                name: "Columns");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "ApplicationUsers");
        }
    }
}
