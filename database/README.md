# Database migrations

Gunakan file berikut untuk inisialisasi database MySQL:

- `001_init_rabio.sql` → membuat database `rabio`, tabel `wedding_templates`, tabel `wedding_profiles`, index, foreign key, dan seed data awal.

## Cara import

```bash
mysql -u USER -p < database/001_init_rabio.sql
```

## Setelah import

1. Copy `api/config.example.php` menjadi `api/config.php`.
2. Isi kredensial MySQL sesuai server Anda.
3. Pastikan `api/profile.php` dapat mengakses database `rabio`.
