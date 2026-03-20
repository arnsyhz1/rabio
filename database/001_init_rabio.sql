-- Rabio initial MySQL migration
-- Ready to import with: mysql -u USER -p < database/001_init_rabio.sql

CREATE DATABASE IF NOT EXISTS rabio
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE rabio;

CREATE TABLE IF NOT EXISTS wedding_templates (
    template_key VARCHAR(50) NOT NULL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO wedding_templates (template_key, template_name, description) VALUES
    ('classic', 'Classic', 'Template clean dan netral untuk semua tema pernikahan.'),
    ('royal', 'Royal Gold', 'Template elegan dengan aksen emas dan nuansa premium.'),
    ('garden', 'Garden Sage', 'Template segar bernuansa hijau untuk konsep outdoor.')
ON DUPLICATE KEY UPDATE
    template_name = VALUES(template_name),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS wedding_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(160) NOT NULL,
    invitation_label VARCHAR(120) NOT NULL,
    desktop_badge VARCHAR(120) NOT NULL,
    bride_short_name VARCHAR(80) NOT NULL,
    groom_short_name VARCHAR(80) NOT NULL,
    bride_full_name VARCHAR(160) NOT NULL,
    groom_full_name VARCHAR(160) NOT NULL,
    bride_role VARCHAR(160) NOT NULL,
    groom_role VARCHAR(160) NOT NULL,
    bride_parents TEXT NOT NULL,
    groom_parents TEXT NOT NULL,
    event_date_label VARCHAR(120) NOT NULL,
    guest_salutation VARCHAR(200) NOT NULL,
    invitation_intro TEXT NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    calendar_title VARCHAR(160) NOT NULL,
    calendar_start DATETIME NOT NULL,
    calendar_end DATETIME NOT NULL,
    calendar_location VARCHAR(255) NOT NULL,
    calendar_time_zone VARCHAR(80) NOT NULL DEFAULT 'Asia/Jakarta',
    template_key VARCHAR(50) NOT NULL DEFAULT 'classic',
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_wedding_profiles_slug UNIQUE (slug),
    CONSTRAINT fk_wedding_profiles_template
        FOREIGN KEY (template_key) REFERENCES wedding_templates(template_key)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_wedding_profiles_active (is_active),
    INDEX idx_wedding_profiles_template_key (template_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO wedding_profiles (
    slug,
    invitation_label,
    desktop_badge,
    bride_short_name,
    groom_short_name,
    bride_full_name,
    groom_full_name,
    bride_role,
    groom_role,
    bride_parents,
    groom_parents,
    event_date_label,
    guest_salutation,
    invitation_intro,
    base_url,
    calendar_title,
    calendar_start,
    calendar_end,
    calendar_location,
    calendar_time_zone,
    template_key,
    is_active
) VALUES (
    'tari-erland',
    'The Wedding of',
    'Save the Date!',
    'Tari',
    'Erland',
    'Siti Sukentari',
    'Septian Erland Pratama',
    'Putri Pertama',
    'Putra Pertama',
    'Bapak Zajang Darman\n&\nIbu Nurul Sulastri',
    'Bapak Nasserudin\n&\n(Alm.) Ibu Erchamni',
    'Kamis, 24 Juli 2025',
    'Kepada Yth. Bapak/Ibu/Saudara/i',
    'Tanpa mengurangi rasa hormat, dengan ini kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami.',
    '',
    'The Wedding of Tari and Erland',
    '2025-07-24 10:00:00',
    '2025-07-24 14:00:00',
    'https://maps.app.goo.gl/PtFWJys9FF6fkzhG7',
    'Asia/Jakarta',
    'classic',
    1
)
ON DUPLICATE KEY UPDATE
    invitation_label = VALUES(invitation_label),
    desktop_badge = VALUES(desktop_badge),
    bride_short_name = VALUES(bride_short_name),
    groom_short_name = VALUES(groom_short_name),
    bride_full_name = VALUES(bride_full_name),
    groom_full_name = VALUES(groom_full_name),
    bride_role = VALUES(bride_role),
    groom_role = VALUES(groom_role),
    bride_parents = VALUES(bride_parents),
    groom_parents = VALUES(groom_parents),
    event_date_label = VALUES(event_date_label),
    guest_salutation = VALUES(guest_salutation),
    invitation_intro = VALUES(invitation_intro),
    base_url = VALUES(base_url),
    calendar_title = VALUES(calendar_title),
    calendar_start = VALUES(calendar_start),
    calendar_end = VALUES(calendar_end),
    calendar_location = VALUES(calendar_location),
    calendar_time_zone = VALUES(calendar_time_zone),
    template_key = VALUES(template_key),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;
