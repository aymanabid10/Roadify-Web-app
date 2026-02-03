using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace apiroot.Migrations
{
    /// <inheritdoc />
    public partial class AddExpertiseRejectionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionFeedback",
                table: "Expertises",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Expertises",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionFeedback",
                table: "Expertises");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Expertises");
        }
    }
}
