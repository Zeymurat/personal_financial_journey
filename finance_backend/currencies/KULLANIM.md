# Altınkaynak SOAP Servisi Kullanım Kılavuzu

Bu modül, Altınkaynak'ın GetMain SOAP web servisini kullanarak anlık döviz kurları, altın fiyatları ve parite bilgilerini alır.

## Kurulum

1. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

## API Endpoint'leri

### 1. Tüm Verileri Getir (GetMain)
```
GET /api/currencies/getmain/
```

Tüm döviz kurları, altın fiyatları ve parite bilgilerini döndürür.

**Yanıt Örneği:**
```json
{
  "success": true,
  "data": {
    "exchange_rates": {
      "USD": {
        "code": "USD",
        "name": "US Dollar",
        "rate": 32.50,
        "buy": 32.45,
        "sell": 32.55,
        "change": 0
      },
      "EUR": {
        "code": "EUR",
        "name": "Euro",
        "rate": 35.20,
        "buy": 35.15,
        "sell": 35.25,
        "change": 0
      }
    },
    "gold_prices": {
      "gram": {
        "type": "gram",
        "buy": 2500.00,
        "sell": 2510.00
      }
    },
    "parities": {},
    "last_updated": "2025-01-03T12:00:00"
  },
  "source": "Altınkaynak"
}
```

### 2. Sadece Döviz Kurları
```
GET /api/currencies/exchange-rates/
```

### 3. Sadece Altın Fiyatları
```
GET /api/currencies/gold-prices/
```

## Python Kodu ile Kullanım

### Servis Sınıfını Doğrudan Kullanma

```python
from currencies.services import get_altinkaynak_service

# Servisi al
service = get_altinkaynak_service()

# Tüm verileri al
data = service.get_formatted_rates()

# Sadece ham veri almak için
raw_data = service.get_main_data()
```

## Notlar

1. **Authentication**: Servis otomatik olarak gerekli kimlik bilgilerini kullanır (Username: `AltinkaynakWebServis`, Password: `AltinkaynakWebServis`)

2. **Hata Yönetimi**: Servis birden fazla yaklaşım deneyerek SOAP çağrısını gerçekleştirir. Bir yaklaşım başarısız olursa otomatik olarak bir sonrakini dener.

3. **XML Parsing**: SOAP servisinden dönen XML otomatik olarak parse edilir. Eğer XML formatı beklenenden farklıysa, `raw_response` alanında ham veri bulunur.

4. **Rate Limiting**: Altınkaynak servisinin rate limiting'i olabilir. Çok sık istek yapmaktan kaçının.

## Test Etme

Servisi test etmek için Django shell kullanabilirsiniz:

```python
python manage.py shell

from currencies.services import get_altinkaynak_service
service = get_altinkaynak_service()
data = service.get_formatted_rates()
print(data)
```

Veya doğrudan API endpoint'ini test edin:
```bash
curl http://localhost:8000/api/currencies/getmain/
```

## Sorun Giderme

1. **ModuleNotFoundError: No module named 'zeep'**
   - Çözüm: `pip install zeep==4.1.0` komutunu çalıştırın

2. **SOAP çağrısı başarısız oluyor**
   - Log dosyalarını kontrol edin
   - WSDL URL'inin erişilebilir olduğundan emin olun
   - İnternet bağlantınızı kontrol edin

3. **XML parse hatası**
   - `raw_response` alanında ham XML'i inceleyin
   - Altınkaynak'ın döndürdüğü XML formatını kontrol edin
   - Gerekirse `_parse_response` metodunu güncelleyin

## Frontend Entegrasyonu

Frontend'de kullanmak için:

```typescript
// apiService.ts içine ekleyin
export const getAltinkaynakRates = async () => {
  const response = await fetch('http://localhost:8000/api/currencies/getmain/');
  return response.json();
};
```

