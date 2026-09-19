-- ============================================================
-- MIGRATION — FINAL MASTER BRIEF (for EXISTING installations)
-- Applies the 16 Nov 2026 / Shilpakala Vedika / 50-category
-- structure to a database created from the earlier brief.
--
-- Run this FIRST, then apply schema.sql (re-seeds categories,
-- settings, sponsors):
--
-- 1) MySQL > migration-final-brief.sql
-- 2) MySQL < schema.sql
-- ============================================================

USE `telugu_icon_awards`;

SET FOREIGN_KEY_CHECKS = 0;

-- Rebuild vote-related tables with OTP support
DROP TABLE IF EXISTS `votes`;
DROP TABLE IF EXISTS `otp_sessions`;
DROP TABLE IF EXISTS `nominations`;
DROP TABLE IF EXISTS `nominees`;

-- categories: new type set (jury | self_nomination)
ALTER TABLE `categories`
  MODIFY `type` ENUM('jury','self_nomination') NOT NULL DEFAULT 'self_nomination';

-- sponsors: expanded partner tiers
ALTER TABLE `sponsors`
  MODIFY `tier` ENUM('title_partner','powered_by','co_powered_by','gold','silver','category_partner','media_partner','digital_partner','travel_partner') NOT NULL DEFAULT 'gold';

-- Replace old category set entirely (re-seeded by schema.sql)
DELETE FROM `categories`;
DELETE FROM `sponsors`;

SET FOREIGN_KEY_CHECKS = 1;

-- settings: align event date/venue to the FINAL brief
UPDATE `settings` SET `setting_value` = '2026-11-16 10:00:00' WHERE `setting_key` = 'event_date';
UPDATE `settings` SET `setting_value` = 'Shilpakala Vedika, Hyderabad' WHERE `setting_key` = 'event_venue';
UPDATE `settings` SET `setting_value` = 'Telugu Icon Digital & Influencer Awards 2026' WHERE `setting_key` = 'event_name';
UPDATE `settings` SET `setting_value` = 'Self-nominations are now open for the Telugu Icon Digital & Influencer Awards 2026!' WHERE `setting_key` = 'announcement';