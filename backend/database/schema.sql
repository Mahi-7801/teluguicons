CREATE DATABASE IF NOT EXISTS `telugu_icon_awards`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `telugu_icon_awards`;

-- =============================================
-- USERS (Admins)
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','admin') NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CATEGORIES (10 Jury & Special Recognition + 40 Self-Nomination)
-- =============================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(190) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `type` ENUM('jury','self_nomination') NOT NULL DEFAULT 'self_nomination',
  `description` TEXT NULL,
  `icon` VARCHAR(50) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `voting_open` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_categories_type` (`type`),
  INDEX `idx_categories_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- NOMINEES (Approved creators / finalists)
-- =============================================
CREATE TABLE IF NOT EXISTS `nominees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `full_name` VARCHAR(190) NOT NULL,
  `slug` VARCHAR(210) NOT NULL UNIQUE,
  `bio` TEXT NULL,
  `photo_url` VARCHAR(500) NULL,
  `social_handle` VARCHAR(190) NULL,
  `followers_count` BIGINT NULL DEFAULT 0,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
  `nominee_code` VARCHAR(20) NULL UNIQUE,
  `vote_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_nominees_category` (`category_id`),
  INDEX `idx_nominees_status` (`status`),
  INDEX `idx_nominees_featured` (`featured`),
  CONSTRAINT `fk_nominees_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- NOMINATIONS (SELF-NOMINATION ONLY)
-- =============================================
CREATE TABLE IF NOT EXISTS `nominations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `nomination_code` VARCHAR(20) NULL UNIQUE,
  `full_name` VARCHAR(190) NOT NULL,
  `creator_name` VARCHAR(190) NULL,
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(30) NULL,
  `city` VARCHAR(120) NULL,
  `state` VARCHAR(120) NULL,
  `primary_platform` VARCHAR(60) NULL,
  `youtube_url` VARCHAR(500) NULL,
  `instagram_url` VARCHAR(500) NULL,
  `facebook_url` VARCHAR(500) NULL,
  `other_profile_url` VARCHAR(500) NULL,
  `website_url` VARCHAR(500) NULL,
  `photo_url` VARCHAR(500) NULL,
  `journey` TEXT NULL,
  `achievements` TEXT NULL,
  `support_links` TEXT NULL,
  `status` ENUM('pending','verified','shortlisted','rejected') NOT NULL DEFAULT 'pending',
  `admin_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_nominations_status` (`status`),
  INDEX `idx_nominations_category` (`category_id`),
  INDEX `idx_nominations_code` (`nomination_code`),
  CONSTRAINT `fk_nominations_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- OTP SESSIONS (Mobile verification for voting)
-- =============================================
CREATE TABLE IF NOT EXISTS `otp_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mobile` VARCHAR(20) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `purpose` VARCHAR(30) NOT NULL DEFAULT 'vote',
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_otp_mobile` (`mobile`),
  INDEX `idx_otp_token` (`token_hash`),
  INDEX `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- VOTES (OTP-verified, one per category per mobile)
-- =============================================
CREATE TABLE IF NOT EXISTS `votes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nominee_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `voter_name` VARCHAR(120) NULL,
  `voter_email` VARCHAR(150) NULL,
  `voter_phone` VARCHAR(30) NULL,
  `ip_address` VARCHAR(60) NULL,
  `user_agent` VARCHAR(300) NULL,
  `otp_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_token` VARCHAR(64) NULL,
  `device_fingerprint` VARCHAR(64) NULL,
  `is_flagged` TINYINT(1) NOT NULL DEFAULT 0,
  `flag_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_votes_nominee` (`nominee_id`),
  INDEX `idx_votes_category` (`category_id`),
  INDEX `idx_votes_flagged` (`is_flagged`),
  INDEX `idx_votes_created` (`created_at`),
  INDEX `idx_votes_fingerprint` (`device_fingerprint`),
  INDEX `idx_votes_ip` (`ip_address`),
  UNIQUE KEY `uq_votes_category_phone` (`category_id`, `voter_phone`),
  UNIQUE KEY `uq_votes_category_email` (`category_id`, `voter_email`),
  UNIQUE KEY `uq_votes_category_device` (`category_id`, `device_fingerprint`),
  INDEX `idx_votes_category_ip` (`category_id`, `ip_address`, `user_agent`),
  CONSTRAINT `fk_votes_nominee` FOREIGN KEY (`nominee_id`)
    REFERENCES `nominees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_votes_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SPONSORS
-- =============================================
CREATE TABLE IF NOT EXISTS `sponsors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(190) NOT NULL,
  `tier` ENUM('title_partner','powered_by','co_powered_by','gold','silver','category_partner','media_partner','digital_partner','travel_partner') NOT NULL DEFAULT 'gold',
  `logo_url` VARCHAR(500) NULL,
  `website_url` VARCHAR(300) NULL,
  `tagline` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sponsors_tier` (`tier`),
  INDEX `idx_sponsors_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SITE SETTINGS / ANNOUNCEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(120) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `group_name` VARCHAR(80) NOT NULL DEFAULT 'general',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CONTACT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `subject` VARCHAR(190) NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SMS SENDER IDS (Registered on the SMS provider / DLT platform)
-- =============================================
CREATE TABLE IF NOT EXISTS `sms_senders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(120) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sms_sender_id` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SMS TEMPLATES (Approved DLT templates for OTP / transactional SMS)
-- =============================================
CREATE TABLE IF NOT EXISTS `sms_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `sender_id` VARCHAR(20) NOT NULL,
  `dlt_template_id` VARCHAR(120) NOT NULL,
  `content` TEXT NULL,
  `template_type` ENUM('otp','transactional') NOT NULL DEFAULT 'otp',
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sms_templates_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SEED DATA
-- =============================================

-- Default Admin (password: admin123 - bcrypt hash)
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`) VALUES
('Super Admin', 'admin@teluguiconawards.com', '$2a$10$X9RtTporFDYagIpGUaUwh.SYGVyZ92qoq7KcDJp60634Y3JbVUNPS', 'super_admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- -------------------------------------------------
-- 10 JURY & SPECIAL RECOGNITION AWARDS
-- (Selected via official jury/organizing process.
--  NOT open for self-nomination or public voting.)
-- -------------------------------------------------
INSERT INTO `categories` (`name`, `slug`, `type`, `description`, `icon`, `sort_order`, `voting_open`) VALUES
('Telugu Digital Creator of the Year', 'jury-digital-creator-year', 'jury', 'The most outstanding digital creator of the year across the Telugu ecosystem.', 'crown', 1, 0),
('Telugu Digital Icon of the Year', 'jury-digital-icon-year', 'jury', 'The defining digital icon of the Telugu creator ecosystem.', 'trophy', 2, 0),
('Telugu Influencer of the Year', 'jury-influencer-year', 'jury', 'The most influential digital personality shaping Telugu culture.', 'star', 3, 0),
('Creator Excellence Award', 'jury-creator-excellence', 'jury', 'Sustained excellence in content creation and community building.', 'medal', 4, 0),
('Most Popular Digital Creator', 'jury-most-popular', 'jury', 'The digital creator with the widest public reach and love.', 'heart', 5, 0),
('Best Male Digital Creator', 'jury-best-male-creator', 'jury', 'Outstanding male digital creator of the year.', 'male', 6, 0),
('Best Female Digital Creator', 'jury-best-female-creator', 'jury', 'Outstanding female digital creator of the year.', 'female', 7, 0),
('Rising Digital Star of the Year', 'jury-rising-star', 'jury', 'The breakout digital talent of the year.', 'rocket', 8, 0),
('Digital Entrepreneur of the Year', 'jury-digital-entrepreneur', 'jury', 'The creator-entrepreneur building the most significant digital business.', 'briefcase', 9, 0),
('Lifetime Achievement Award – Digital Media', 'jury-lifetime-achievement', 'jury', 'Honouring a lifetime of contribution to Telugu digital media.', 'award', 10, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- -------------------------------------------------
-- 40 SELF-NOMINATION CATEGORIES
-- (Creator self-nomination -> verification ->
--  shortlisting -> public voting -> winner)
-- -------------------------------------------------
INSERT INTO `categories` (`name`, `slug`, `type`, `description`, `icon`, `sort_order`, `voting_open`) VALUES
('Telugu YouTuber of the Year', 'sn-youtuber-year', 'self_nomination', 'The most outstanding Telugu YouTube creator of the year.', 'play', 11, 1),
('Best Entertainment Creator', 'sn-entertainment', 'self_nomination', 'Creator delivering top-tier entertainment content.', 'laugh', 12, 1),
('Best Comedy Creator', 'sn-comedy', 'self_nomination', 'Creator who makes Telugu audiences laugh the most.', 'joker', 13, 1),
('Best Family Creator', 'sn-family', 'self_nomination', 'Family-first content that resonates across generations.', 'family', 14, 1),
('Best Storytelling Creator', 'sn-storytelling', 'self_nomination', 'Masterful narrative and storytelling craft.', 'book', 15, 1),
('Best Viral Creator', 'sn-viral', 'self_nomination', 'Creator whose content consistently breaks the internet.', 'flame', 16, 1),
('Best Short-Form Creator', 'sn-short-form', 'self_nomination', 'Excellence in short-form digital content.', 'lightning', 17, 1),
('Best Lifestyle Creator', 'sn-lifestyle', 'self_nomination', 'Best lifestyle, wellness and everyday-living content.', 'sparkle', 18, 1),
('Best Content Creator', 'sn-content', 'self_nomination', 'Overall excellence in digital content creation.', 'star', 19, 1),
('Best Current Affairs Creator', 'sn-current-affairs', 'self_nomination', 'Sharp, credible current affairs and news analysis.', 'news', 20, 1),
('Best Knowledge Creator', 'sn-knowledge', 'self_nomination', 'Creator who makes learning and knowledge exciting.', 'book', 21, 1),
('Best Tech Creator', 'sn-tech', 'self_nomination', 'Best technology content creator.', 'chip', 22, 1),
('Best Food Creator', 'sn-food', 'self_nomination', 'Best food exploration and food content creator.', 'food', 23, 1),
('Best Travel Creator', 'sn-travel', 'self_nomination', 'Best travel, culture and adventure exploration.', 'plane', 24, 1),
('Best Educational Creator', 'sn-education', 'self_nomination', 'Best creator making education accessible and engaging.', 'graduation', 25, 1),
('Best Gaming Creator', 'sn-gaming', 'self_nomination', 'Best gaming, streaming and esports creator.', 'game', 26, 1),
('Best Podcast Creator', 'sn-podcast', 'self_nomination', 'Best Telugu podcast and audio creator.', 'podcast', 27, 1),
('Best Reels Creator', 'sn-reels', 'self_nomination', 'Best Instagram Reels / short-format visual creator.', 'reels', 28, 1),
('Best Comedy Shorts Creator', 'sn-comedy-shorts', 'self_nomination', 'Best comedy delivered through short-form video.', 'joker', 29, 1),
('Best Creator Collaboration', 'sn-collaboration', 'self_nomination', 'Best collaboration between creators.', 'handshake', 30, 1),
('Best Instagram Creator', 'sn-instagram', 'self_nomination', 'Best overall Instagram creator.', 'instagram', 31, 1),
('Best Digital Journalist', 'sn-digital-journalist', 'self_nomination', 'Best journalism and reporting on digital platforms.', 'mic', 32, 1),
('Best Facts Creator', 'sn-facts', 'self_nomination', 'Best facts, trivia and discovery content.', 'atom', 33, 1),
('Best Motivational Creator', 'sn-motivational', 'self_nomination', 'Creator who inspires and motivates audiences.', 'medal', 34, 1),
('Best AI Creator', 'sn-ai', 'self_nomination', 'Best creator exploring AI tools and innovation.', 'ai', 35, 1),
('Best Gadget Reviewer', 'sn-gadget-review', 'self_nomination', 'Best gadget reviews and unboxings.', 'camera', 36, 1),
('Best Mobile Tech Creator', 'sn-mobile-tech', 'self_nomination', 'Best smartphone and mobile technology content.', 'smartphone', 37, 1),
('Best Innovation Creator', 'sn-innovation', 'self_nomination', 'Creator pushing the boundaries of digital innovation.', 'rocket', 38, 1),
('Best Cooking Creator', 'sn-cooking', 'self_nomination', 'Best cooking and recipe content.', 'chef', 39, 1),
('Best Street Food Creator', 'sn-street-food', 'self_nomination', 'Best street food exploration content.', 'food', 40, 1),
('Best Restaurant Review Creator', 'sn-restaurant-review', 'self_nomination', 'Best restaurant reviews and food critique.', 'plate', 41, 1),
('Best Adventure Creator', 'sn-adventure', 'self_nomination', 'Best adventure and exploration content.', 'mountain', 42, 1),
('Best Fashion Creator', 'sn-fashion', 'self_nomination', 'Best fashion and style content.', 'hanger', 43, 1),
('Best Beauty Creator', 'sn-beauty', 'self_nomination', 'Best beauty, skincare and makeup content.', 'lipstick', 44, 1),
('Best Home Chef Creator', 'sn-home-chef', 'self_nomination', 'Best home cooking creator bringing Telugu kitchens online.', 'home', 45, 1),
('Best Career Guidance Creator', 'sn-career', 'self_nomination', 'Best career, skill and job guidance content.', 'briefcase', 46, 1),
('Best Startup Creator', 'sn-startup', 'self_nomination', 'Best startup and entrepreneurship content.', 'launch', 47, 1),
('Best Business Creator', 'sn-business', 'self_nomination', 'Best business and commerce content.', 'growth', 48, 1),
('Best Finance Creator', 'sn-finance', 'self_nomination', 'Best financial literacy and money-management content.', 'coins', 49, 1),
('Best Music & Dance Creator', 'sn-music-dance', 'self_nomination', 'Best music and dance content creator.', 'music', 50, 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Site Settings (FINAL brief)
INSERT INTO `settings` (`setting_key`, `setting_value`, `group_name`) VALUES
('event_name', 'Telugu Icon Digital & Influencer Awards 2026', 'general'),
('event_tagline', 'Celebrating the Voices. Inspiring the Community. Shaping the Digital Future.', 'general'),
('event_logo_text', 'TELUGU ICON', 'general'),
('event_date', '2026-11-16 10:00:00', 'event'),
('event_venue', 'Shilpakala Vedika, Hyderabad', 'event'),
('nominations_open', '1', 'voting'),
('voting_open', '1', 'voting'),
('contact_email', 'info@teluguiconawards.in', 'contact'),
('contact_phone', '+91 94944 57274', 'contact'),
('contact_address', 'Shilpakala Vedika, Hyderabad, Telangana', 'contact'),
('hero_headline', 'Celebrating the Icons of the Telugu Digital World', 'content'),
('hero_subheadline', 'Telugu Icon Digital & Influencer Awards 2026 — celebrating the voices shaping Telugu digital culture.', 'content'),
('announcement', 'Self-nominations are now open for the Telugu Icon Digital & Influencer Awards 2026!', 'content')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- Sample Sponsor (remove/replace with confirmed partners)
INSERT INTO `sponsors` (`id`, `name`, `tier`, `website_url`, `tagline`, `sort_order`) VALUES
(1, 'Major Sponsor', 'title_partner', 'https://example.com', 'Leading the celebration of Telugu digital excellence', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Sample SMS Sender ID (replace with the sender IDs registered on the DLT platform)
INSERT INTO `sms_senders` (`sender_id`, `name`) VALUES
('PRAHRM', 'Pracharam Media')
ON DUPLICATE KEY UPDATE `sender_id` = `sender_id`;