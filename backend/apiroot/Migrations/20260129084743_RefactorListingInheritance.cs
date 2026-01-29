using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace apiroot.Migrations
{
    /// <inheritdoc />
    public partial class RefactorListingInheritance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Listings_ListingType",
                table: "Listings");

            migrationBuilder.AlterColumn<string>(
                name: "ListingType",
                table: "Listings",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Features",
                table: "Listings",
                type: "text",
                nullable: false,
                oldClrType: typeof(List<string>),
                oldType: "text[]");

            migrationBuilder.AddColumn<bool>(
                name: "DeliveryAvailable",
                table: "Listings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryFee",
                table: "Listings",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FinancingAvailable",
                table: "Listings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FuelPolicy",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasClearTitle",
                table: "Listings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "InsuranceIncluded",
                table: "Listings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MaximumRentalPeriod",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MileageLimitPerDay",
                table: "Listings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MinimumRentalPeriod",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRate",
                table: "Listings",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SecurityDeposit",
                table: "Listings",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TradeInAccepted",
                table: "Listings",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WarrantyInfo",
                table: "Listings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeeklyRate",
                table: "Listings",
                type: "numeric(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryAvailable",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "DeliveryFee",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "FinancingAvailable",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "FuelPolicy",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "HasClearTitle",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "InsuranceIncluded",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MaximumRentalPeriod",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MileageLimitPerDay",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MinimumRentalPeriod",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MonthlyRate",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "SecurityDeposit",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "TradeInAccepted",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "WarrantyInfo",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "WeeklyRate",
                table: "Listings");

            migrationBuilder.AlterColumn<int>(
                name: "ListingType",
                table: "Listings",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(8)",
                oldMaxLength: 8);

            migrationBuilder.AlterColumn<List<string>>(
                name: "Features",
                table: "Listings",
                type: "text[]",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_ListingType",
                table: "Listings",
                column: "ListingType");
        }
    }
}
