-- App schema reference.
-- For a ready-to-import migration, use database/001_init_rabio.sql

CREATE TABLE IF NOT EXISTS wedding_templates (
    template_key VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL
);

INSERT INTO wedding_templates (template_key, template_name, description) VALUES
    ('classic', 'Classic', 'Template clean dan netral untuk semua tema pernikahan.'),
    ('royal', 'Royal Gold', 'Template elegan dengan aksen emas dan nuansa premium.'),
    ('garden', 'Garden Sage', 'Template segar bernuansa hijau untuk konsep outdoor.')
ON DUPLICATE KEY UPDATE
    template_name = VALUES(template_name),
    description = VALUES(description);

CREATE TABLE IF NOT EXISTS wedding_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
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
    CONSTRAINT fk_wedding_template FOREIGN KEY (template_key) REFERENCES wedding_templates(template_key)
);
