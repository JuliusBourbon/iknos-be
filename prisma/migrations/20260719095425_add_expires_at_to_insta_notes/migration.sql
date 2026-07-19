-- AlterTable: Tambah kolom expires_at dengan default NOW()+24h untuk baris yang sudah ada,
-- lalu hapus default agar kolom tetap wajib diisi saat insert baru.
ALTER TABLE "insta_notes" ADD COLUMN "expires_at" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
ALTER TABLE "insta_notes" ALTER COLUMN "expires_at" DROP DEFAULT;
