using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Taro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LegalCompliance20260914 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "auto_renew_enabled",
                table: "subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "auto_renew_consent_at",
                table: "subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "auto_renew_consent_offer_version",
                table: "subscriptions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "renewal_amount",
                table: "subscriptions",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "renewal_notice_period_ends_at",
                table: "subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "renewal_notice_sent_at",
                table: "subscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "auto_renew_consent_at",
                table: "payment_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "offer_accepted_at",
                table: "payment_orders",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "offer_version",
                table: "payment_orders",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            // Старые согласия не содержат доказуемой версии оферты, суммы и даты
            // отдельного opt-in. Безопасно отключаем для них будущие списания.
            migrationBuilder.Sql("""
                UPDATE subscriptions
                SET auto_renew_enabled = FALSE,
                    status = CASE
                        WHEN expires_at > NOW() THEN 'CancelAtPeriodEnd'
                        ELSE 'Expired'
                    END,
                    canceled_at = COALESCE(canceled_at, NOW()),
                    next_charge_at = NULL,
                    yookassa_payment_method_id = NULL,
                    auto_renew_consent_at = NULL,
                    auto_renew_consent_offer_version = NULL,
                    renewal_amount = NULL,
                    renewal_notice_period_ends_at = NULL,
                    renewal_notice_sent_at = NULL
                WHERE auto_renew_enabled = TRUE;
                """);

            migrationBuilder.Sql("""
                UPDATE payment_orders
                SET offer_version = 'legacy',
                    offer_accepted_at = created_at
                WHERE offer_version = '';

                ALTER TABLE payment_orders ALTER COLUMN offer_version DROP DEFAULT;
                ALTER TABLE payment_orders ALTER COLUMN offer_accepted_at DROP DEFAULT;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "auto_renew_consent_at",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "auto_renew_consent_offer_version",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "renewal_amount",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "renewal_notice_period_ends_at",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "renewal_notice_sent_at",
                table: "subscriptions");

            migrationBuilder.DropColumn(
                name: "auto_renew_consent_at",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "offer_accepted_at",
                table: "payment_orders");

            migrationBuilder.DropColumn(
                name: "offer_version",
                table: "payment_orders");

            migrationBuilder.AlterColumn<bool>(
                name: "auto_renew_enabled",
                table: "subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);
        }
    }
}
