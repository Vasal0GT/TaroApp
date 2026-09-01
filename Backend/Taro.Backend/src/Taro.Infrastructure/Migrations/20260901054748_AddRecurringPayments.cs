using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Taro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_renewal_attempt_at",
                table: "subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "renewal_failure_count",
                table: "subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "auto_renew_requested",
                table: "payment_orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "renewal_attempt_number",
                table: "payment_orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "renewal_period_ends_at",
                table: "payment_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_orders_subscription_id_kind_renewal_period_ends_at_~",
                table: "payment_orders",
                columns: new[] { "subscription_id", "kind", "renewal_period_ends_at", "renewal_attempt_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payment_orders_subscription_id_kind_renewal_period_ends_at_~",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "last_renewal_attempt_at",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "renewal_failure_count",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "auto_renew_requested",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "renewal_attempt_number",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "renewal_period_ends_at",
                table: "payment_orders");
        }
    }
}
