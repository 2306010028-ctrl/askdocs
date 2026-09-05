# AskDocs

AskDocs; PDF, DOCX ve TXT belgelerini yükleyen, metinlerini çıkaran, parçalara ayıran ve dokümanlar üzerinden soru-cevap sistemi oluşturmayı amaçlayan bir web uygulamasıdır.

> MiniMax yapay zekâ entegrasyonu henüz geliştirme aşamasındadır. Belge yönetimi, metin çıkarma, parçalara ayırma ve doküman detaylarını görüntüleme özellikleri çalışmaktadır.

## Özellikler

- PDF, DOCX ve TXT dosyalarını yükleme
- 20 MB dosya boyutu sınırı
- Dosya türü ve içerik doğrulama
- Belgelerden metin çıkarma
- Metni küçük parçalara ayırma
- Belgeleri ve metin parçalarını PostgreSQL’de saklama
- Yüklenen belgeleri listeleme
- Belge detaylarını ve kaynak sayfalarını görüntüleme
- Belgeyi, parçalarını ve fiziksel dosyasını silme
- Backend bağlantı durumunu canlı görüntüleme
- MiniMax entegrasyonu için hazırlanmış sohbet arayüzü
- Vitest ve Supertest ile backend API testleri
- pgvector desteği

## Kullanılan Teknolojiler

### Frontend

- React 19
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- pgvector
- Multer
- Mammoth
- pdf-parse
- Vitest
- Supertest

## Proje Yapısı

```text
askdocs/
├── client/
│   └── src/
│       ├── App.tsx
│       ├── ApiStatus.tsx
│       ├── ChatPanel.tsx
│       └── DocumentDetails.tsx
├── server/
│   ├── sql/
│   │   └── 001_initial_schema.sql
│   ├── src/
│   │   ├── chunkText.ts
│   │   ├── db.ts
│   │   ├── extractText.ts
│   │   ├── index.ts
│   │   ├── index.test.ts
│   │   ├── processDocument.ts
│   │   └── upload.ts
│   └── uploads/
└── README.md
```

## Gereksinimler

Projeyi çalıştırmak için aşağıdakiler gereklidir:

- Node.js 24 veya üzeri
- npm
- PostgreSQL 17
- pgvector eklentisi
- Git

## Kurulum

Projeyi bilgisayarınıza indirin:

```bash
git clone https://github.com/2306010028-ctrl/askdocs.git
cd askdocs
```

Frontend bağımlılıklarını kurun:

```bash
npm --prefix client install
```

Backend bağımlılıklarını kurun:

```bash
npm --prefix server install
```

## Veritabanı Kurulumu

PostgreSQL üzerinde `askdocs` adında bir veritabanı oluşturun:

```sql
CREATE DATABASE askdocs;
```

Migration dosyasını çalıştırın:

```bash
psql -U postgres -d askdocs -v ON_ERROR_STOP=1 -f server/sql/001_initial_schema.sql
```

Migration aşağıdaki tabloları oluşturur:

- `documents`
- `document_chunks`
- `query_logs`

Ayrıca `vector` eklentisini ve gerekli indeksleri hazırlar.

## Ortam Değişkenleri

`server` klasöründe `.env` dosyası oluşturun:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=askdocs
DB_USER=postgres
DB_PASSWORD=postgres_sifreniz
```

Gerçek veritabanı şifrenizi GitHub’a göndermeyin. `.env` dosyası yalnızca yerel bilgisayarda tutulmalıdır.

MiniMax entegrasyonu tamamlandığında API anahtarı da bu dosyada saklanacaktır.

## Uygulamayı Çalıştırma

Backend için yeni bir terminal açın:

```bash
npm --prefix server run dev
```

Backend varsayılan olarak şu adreste çalışır:

```text
http://localhost:3001
```

Frontend için ikinci bir terminal açın:

```bash
npm --prefix client run dev
```

Frontend varsayılan olarak şu adreste çalışır:

```text
http://localhost:5173
```

## API Uç Noktaları

| Metot | Adres | Açıklama |
|---|---|---|
| GET | `/api/health` | Backend durumunu kontrol eder |
| GET | `/api/health/db` | PostgreSQL bağlantısını kontrol eder |
| GET | `/api/documents` | Belgeleri listeler |
| GET | `/api/documents/:id` | Belgeyi ve metin parçalarını getirir |
| POST | `/api/documents` | Yeni belge yükler |
| DELETE | `/api/documents/:id` | Belgeyi ve ilgili parçaları siler |

Belge yükleme isteğinde dosya, `file` isimli form alanıyla gönderilmelidir.

## Testler

Backend testlerini çalıştırmak için:

```bash
npm --prefix server run test
```

Mevcut testler şunları kontrol eder:

- API sağlık endpoint’i
- Geçersiz belge kimliği doğrulaması
- Dosyasız yükleme isteğinin reddedilmesi
- Test sırasında sunucunun gerçek bir port açmaması

## Production Build

Backend build:

```bash
npm --prefix server run build
```

Frontend build:

```bash
npm --prefix client run build
```

## Geliştirme Durumu

Tamamlanan bölümler:

- Belge yükleme ve doğrulama
- PDF, DOCX ve TXT metin çıkarma
- Metin parçalama
- PostgreSQL veri saklama
- Belge listeleme ve silme
- Belge detay ve kaynak sayfası görünümü
- Sohbet arayüzü
- Canlı backend durum göstergesi
- Veritabanı migration dosyası
- Temel backend testleri

Planlanan bölümler:

- MiniMax M3 API entegrasyonu
- Belge parçaları için embedding oluşturma
- pgvector ile benzerlik araması
- Kaynaklı soru-cevap sistemi
- Sorgu geçmişinin kaydedilmesi
- Hata yönetimi ve ek testler
- Uygulamanın yayınlanması

## Güvenlik

- `.env` dosyasını GitHub’a göndermeyin.
- API anahtarlarını frontend koduna yazmayın.
- API anahtarlarını ekran görüntülerinde veya mesajlarda paylaşmayın.
- Gerçek anahtarları yalnızca backend ortam değişkenlerinde saklayın.