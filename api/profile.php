<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$defaultTemplates = [
    ['key' => 'classic', 'name' => 'Classic', 'description' => 'Template clean dan netral untuk semua tema pernikahan.'],
    ['key' => 'royal', 'name' => 'Royal Gold', 'description' => 'Template elegan dengan aksen emas dan nuansa premium.'],
    ['key' => 'garden', 'name' => 'Garden Sage', 'description' => 'Template segar bernuansa hijau untuk konsep outdoor.'],
];

$defaultProfile = [
    'slug' => 'tari-erland',
    'invitationLabel' => 'The Wedding of',
    'desktopBadge' => 'Save the Date!',
    'brideShortName' => 'Tari',
    'groomShortName' => 'Erland',
    'brideFullName' => 'Siti Sukentari',
    'groomFullName' => 'Septian Erland Pratama',
    'brideRole' => 'Putri Pertama',
    'groomRole' => 'Putra Pertama',
    'brideParents' => "Bapak Zajang Darman\n&\nIbu Nurul Sulastri",
    'groomParents' => "Bapak Nasserudin\n&\n(Alm.) Ibu Erchamni",
    'eventDateLabel' => 'Kamis, 24 Juli 2025',
    'guestSalutation' => 'Kepada Yth. Bapak/Ibu/Saudara/i',
    'invitationIntro' => 'Tanpa mengurangi rasa hormat, dengan ini kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami.',
    'baseUrl' => 'https://tari.erland.me',
    'calendarTitle' => 'The Wedding of Tari and Erland',
    'calendarStart' => '2025-07-24 10:00:00',
    'calendarEnd' => '2025-07-24 14:00:00',
    'calendarLocation' => 'https://maps.app.goo.gl/PtFWJys9FF6fkzhG7',
    'calendarTimeZone' => 'Asia/Jakarta',
    'templateKey' => 'classic',
];

function profile_templates(PDO $pdo, array $fallback): array
{
    $statement = $pdo->query('SELECT template_key, template_name, description FROM wedding_templates ORDER BY template_name ASC');
    $templates = array_map(static fn(array $row): array => [
        'key' => $row['template_key'],
        'name' => $row['template_name'],
        'description' => $row['description'],
    ], $statement->fetchAll());

    return count($templates) > 0 ? $templates : $fallback;
}

function profile_profiles(PDO $pdo): array
{
    $statement = $pdo->query('SELECT * FROM wedding_profiles ORDER BY is_active DESC, updated_at DESC, id DESC');
    return array_map(static function (array $row): array {
        return [
            'slug' => $row['slug'],
            'invitationLabel' => $row['invitation_label'],
            'desktopBadge' => $row['desktop_badge'],
            'brideShortName' => $row['bride_short_name'],
            'groomShortName' => $row['groom_short_name'],
            'brideFullName' => $row['bride_full_name'],
            'groomFullName' => $row['groom_full_name'],
            'brideRole' => $row['bride_role'],
            'groomRole' => $row['groom_role'],
            'brideParents' => $row['bride_parents'],
            'groomParents' => $row['groom_parents'],
            'eventDateLabel' => $row['event_date_label'],
            'guestSalutation' => $row['guest_salutation'],
            'invitationIntro' => $row['invitation_intro'],
            'baseUrl' => $row['base_url'],
            'calendarTitle' => $row['calendar_title'],
            'calendarStart' => $row['calendar_start'],
            'calendarEnd' => $row['calendar_end'],
            'calendarLocation' => $row['calendar_location'],
            'calendarTimeZone' => $row['calendar_time_zone'],
            'templateKey' => $row['template_key'],
            'isActive' => (bool) $row['is_active'],
        ];
    }, $statement->fetchAll());
}

function profile_registry(PDO $pdo, array $defaultProfile, array $defaultTemplates): array
{
    $profiles = profile_profiles($pdo);
    if (count($profiles) === 0) {
        profile_save($pdo, $defaultProfile, null);
        $profiles = profile_profiles($pdo);
    }

    $activeSlug = $profiles[0]['slug'] ?? $defaultProfile['slug'];
    foreach ($profiles as $profile) {
        if (($profile['isActive'] ?? false) === true) {
            $activeSlug = $profile['slug'];
            break;
        }
    }

    return [
        'activeSlug' => $activeSlug,
        'profiles' => $profiles,
        'templates' => profile_templates($pdo, $defaultTemplates),
    ];
}

function profile_set_active(PDO $pdo, string $slug): void
{
    $pdo->exec('UPDATE wedding_profiles SET is_active = 0');
    $statement = $pdo->prepare('UPDATE wedding_profiles SET is_active = 1 WHERE slug = :slug');
    $statement->execute(['slug' => $slug]);
}

function profile_save(PDO $pdo, array $profile, ?string $previousSlug): void
{
    if ($previousSlug !== null && $previousSlug !== '' && $previousSlug !== $profile['slug']) {
        $delete = $pdo->prepare('DELETE FROM wedding_profiles WHERE slug = :slug');
        $delete->execute(['slug' => $previousSlug]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO wedding_profiles (
            slug, invitation_label, desktop_badge, bride_short_name, groom_short_name, bride_full_name, groom_full_name,
            bride_role, groom_role, bride_parents, groom_parents, event_date_label, guest_salutation, invitation_intro,
            base_url, calendar_title, calendar_start, calendar_end, calendar_location, calendar_time_zone, template_key, is_active
        ) VALUES (
            :slug, :invitation_label, :desktop_badge, :bride_short_name, :groom_short_name, :bride_full_name, :groom_full_name,
            :bride_role, :groom_role, :bride_parents, :groom_parents, :event_date_label, :guest_salutation, :invitation_intro,
            :base_url, :calendar_title, :calendar_start, :calendar_end, :calendar_location, :calendar_time_zone, :template_key, 1
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
            is_active = 1'
    );

    $statement->execute([
        'slug' => $profile['slug'],
        'invitation_label' => $profile['invitationLabel'],
        'desktop_badge' => $profile['desktopBadge'],
        'bride_short_name' => $profile['brideShortName'],
        'groom_short_name' => $profile['groomShortName'],
        'bride_full_name' => $profile['brideFullName'],
        'groom_full_name' => $profile['groomFullName'],
        'bride_role' => $profile['brideRole'],
        'groom_role' => $profile['groomRole'],
        'bride_parents' => $profile['brideParents'],
        'groom_parents' => $profile['groomParents'],
        'event_date_label' => $profile['eventDateLabel'],
        'guest_salutation' => $profile['guestSalutation'],
        'invitation_intro' => $profile['invitationIntro'],
        'base_url' => $profile['baseUrl'],
        'calendar_title' => $profile['calendarTitle'],
        'calendar_start' => $profile['calendarStart'],
        'calendar_end' => $profile['calendarEnd'],
        'calendar_location' => $profile['calendarLocation'],
        'calendar_time_zone' => $profile['calendarTimeZone'],
        'template_key' => $profile['templateKey'] ?? 'classic',
    ]);

    profile_set_active($pdo, $profile['slug']);
}

function profile_delete(PDO $pdo, string $slug, array $defaultProfile): void
{
    $statement = $pdo->prepare('DELETE FROM wedding_profiles WHERE slug = :slug');
    $statement->execute(['slug' => $slug]);

    $count = (int) $pdo->query('SELECT COUNT(*) FROM wedding_profiles')->fetchColumn();
    if ($count === 0) {
        profile_save($pdo, $defaultProfile, null);
        return;
    }

    $nextSlug = $pdo->query('SELECT slug FROM wedding_profiles ORDER BY updated_at DESC, id DESC LIMIT 1')->fetchColumn();
    if (is_string($nextSlug) && $nextSlug !== '') {
        profile_set_active($pdo, $nextSlug);
    }
}

try {
    $pdo = profile_pdo();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        profile_json(200, ['data' => profile_registry($pdo, $defaultProfile, $defaultTemplates)]);
    }

    $payload = profile_read_json();
    $action = $payload['action'] ?? '';

    if ($action === 'save') {
        profile_save($pdo, $payload['profile'] ?? $defaultProfile, $payload['previousSlug'] ?? null);
        profile_json(200, [
            'data' => [
                'profile' => $payload['profile'] ?? $defaultProfile,
                'registry' => profile_registry($pdo, $defaultProfile, $defaultTemplates),
            ],
        ]);
    }

    if ($action === 'set-active') {
        profile_set_active($pdo, (string) ($payload['slug'] ?? $defaultProfile['slug']));
        profile_json(200, [
            'data' => [
                'profile' => ['slug' => (string) ($payload['slug'] ?? $defaultProfile['slug'])],
                'registry' => profile_registry($pdo, $defaultProfile, $defaultTemplates),
            ],
        ]);
    }

    if ($action === 'delete') {
        profile_delete($pdo, (string) ($payload['slug'] ?? ''), $defaultProfile);
        profile_json(200, [
            'data' => [
                'registry' => profile_registry($pdo, $defaultProfile, $defaultTemplates),
            ],
        ]);
    }

    if ($action === 'reset') {
        profile_delete($pdo, (string) ($payload['slug'] ?? ''), $defaultProfile);
        profile_json(200, [
            'data' => [
                'profile' => $defaultProfile,
                'registry' => profile_registry($pdo, $defaultProfile, $defaultTemplates),
            ],
        ]);
    }

    profile_json(400, ['error' => 'Unsupported action.']);
} catch (Throwable $error) {
    profile_json(500, ['error' => $error->getMessage()]);
}
