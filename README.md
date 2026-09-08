# AskDocs

AskDocs; PDF, DOCX ve TXT belgelerini yükleyen, metinlerini çıkarıp parçalara ayıran ve MiniMax M3 kullanarak belgeler üzerinden kaynaklı cevaplar üreten bir web uygulamasıdır.

## Özellikler

- PDF, DOCX ve TXT dosyalarını yükleme
- 20 MB dosya boyutu sınırı
- Dosya türü ve içerik doğrulama
- Belgelerden metin çıkarma
- Metni aranabilir parçalara ayırma
- Belgeleri ve metin parçalarını PostgreSQL’de saklama
- Yüklenen belgeleri listeleme
- Belge detaylarını ve kaynak sayfalarını görüntüleme
- Belgeyi, parçalarını ve fiziksel dosyasını silme
- Backend, PostgreSQL ve MiniMax bağlantı kontrolü
- MiniMax M3 ile dokümanlara soru sorma
- Cevaplarda belge adı ve sayfa numarası gösterme
- Soru, cevap, yanıt süresi ve token kullanımını kaydetme
- Son 20 soru-cevap kaydını görüntüleme
- Yeni cevap oluşturulduğunda geçmişi otomatik yenileme
- Vitest ve Supertest ile backend API testleri
- GitHub Actions ile otomatik build ve test
- pgvector veritabanı desteği

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
- MiniMax M3
- Anthropic uyumlu MiniMax API
- Multer
- Mammoth
- pdf-parse
- Vitest
- Supertest

## Proje Yapısı

```text
askdocs/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   └── src/
│       ├── ApiStatus.tsx
│       ├── App.tsx
│       ├── ChatPanel.tsx
│       ├── DocumentDetails.tsx
│       └── QueryHistory.tsx
├── server/
│   ├── sql/
│   │   └── 001_initial_schema.sql
│   ├── src/
│   │   ├── chunkText.ts
│   │   ├── db.ts
│   │   ├── extractText.ts
│   │   ├── index.test.ts
│   │   ├── index.ts
│   │   ├── minimax.ts
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
- MiniMax Token Plan veya kullanılabilir API bakiyesi
- MiniMax Subscription Key

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

Windows PowerShell üzerinde gerekirse şu yolu kullanabilirsiniz:

```powershell
psql -U postgres -d askdocs -v ON_ERROR_STOP=1 -f server\sql\001_initial_schema.sql
```

Migration aşağıdaki tabloları oluşturur:

- `documents`
- `document_chunks`
- `query_logs`

Ayrıca `vector` eklentisini ve gerekli veritabanı indekslerini hazırlar.

> pgvector veritabanında hazırdır. Mevcut kaynak seçimi PostgreSQL tam metin aramasıyla yapılmaktadır. Semantik vektör araması henüz etkin değildir.

## Ortam Değişkenleri

`server` klasöründe `.env` dosyası oluşturun:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=askdocs
DB_USER=postgres
DB_PASSWORD=postgres_sifreniz

MINIMAX_API_KEY=minimax_subscription_key
MINIMAX_BASE_URL=https://api.minimax.io/anthropic
MINIMAX_MODEL=MiniMax-M3
```

`MINIMAX_API_KEY` alanına MiniMax tarafından oluşturulan Subscription Key yazılmalıdır.

Gerçek veritabanı şifresini ve MiniMax anahtarını GitHub’a göndermeyin. `.env` dosyası yalnızca yerel bilgisayarda tutulmalıdır.

Frontend farklı bir backend adresine bağlanacaksa `client/.env` dosyasında aşağıdaki değişken kullanılabilir:

```env
VITE_API_URL=http://127.0.0.1:3001
```

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
| GET | `/api/health/ai` | MiniMax M3 bağlantısını kontrol eder |
| GET | `/api/documents` | Yüklenen belgeleri listeler |
| GET | `/api/documents/:id` | Belgeyi ve metin parçalarını getirir |
| POST | `/api/documents` | Yeni belge yükler ve işler |
| DELETE | `/api/documents/:id` | Belgeyi ve ilgili parçaları siler |
| POST | `/api/questions` | Belgeler üzerinden kaynaklı cevap üretir |
| GET | `/api/queries` | Son 20 soru-cevap kaydını getirir |

Belge yükleme isteğinde dosya, `file` isimli form alanıyla gönderilmelidir.

### Soru sorma örneği

```powershell
$body = @{
  question = "Bu dokümanın ana konusu nedir?"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3001/api/questions" `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

Soru uzunluğu en az 3, en fazla 1000 karakter olmalıdır.

Başarılı cevap aşağıdaki bilgileri içerir:

- MiniMax tarafından üretilen cevap
- Kullanılan model
- Yanıt süresi
- Token sayısı
- Kaynak belge adı
- Kaynak sayfa numarası

## Testler

Backend testlerini çalıştırmak için:

```bash
npm --prefix server run test
```

Mevcut testler şunları kontrol eder:

- API sağlık uç noktası
- Geçersiz belge kimliğinin reddedilmesi
- Geçersiz silme isteğinin reddedilmesi
- Dosyasız yükleme isteğinin reddedilmesi
- Çok kısa soruların reddedilmesi
- Çok uzun soruların reddedilmesi
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

Tüm kontrolleri sırasıyla çalıştırmak için:

```bash
npm --prefix server run test
npm --prefix server run build
npm --prefix client run build
```

## Sürekli Entegrasyon

`.github/workflows/ci.yml` dosyasındaki GitHub Actions iş akışı, `main` dalına gönderilen değişikliklerde ve Pull Request’lerde aşağıdaki kontrolleri otomatik çalıştırır:

- Backend bağımlılıklarının kurulması
- Backend testleri
- Backend production build
- Frontend bağımlılıklarının kurulması
- Frontend production build

## Geliştirme Durumu

### Tamamlanan bölümler

- Belge yükleme ve doğrulama
- PDF, DOCX ve TXT metin çıkarma
- Metin parçalama
- PostgreSQL veri saklama
- Belge listeleme ve silme
- Belge detay ve kaynak sayfası görünümü
- MiniMax M3 API entegrasyonu
- MiniMax bağlantı kontrolü
- Kaynaklı doküman soru-cevap sistemi
- Soru-cevap geçmişinin veritabanına kaydedilmesi
- Son 20 sorgunun arayüzde gösterilmesi
- Sorgu geçmişinin otomatik yenilenmesi
- Veritabanı migration dosyası
- Backend API testleri
- GitHub Actions CI iş akışı
- Bağımlılık güvenlik güncellemeleri

### Planlanan bölümler

- Daha kapsamlı API ve veritabanı testleri
- İlgisiz sorular için daha güçlü kaynak filtreleme
- Güvenli bir embedding çözümü
- pgvector ile semantik benzerlik araması
- Production ortam değişkenlerinin yapılandırılması
- Frontend ve backend uygulamasının yayınlanması

## Güvenlik

- `.env` dosyasını GitHub’a göndermeyin.
- API anahtarlarını frontend koduna yazmayın.
- API anahtarlarını ekran görüntülerinde veya mesajlarda paylaşmayın.
- Gerçek anahtarları yalnızca backend ortam değişkenlerinde saklayın.
- Hassas dosyaları commit etmeden önce `git status` ile kontrol edin.
- Bağımlılıkları düzenli olarak `npm audit` ile denetleyin.