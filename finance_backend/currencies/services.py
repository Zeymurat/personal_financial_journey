"""
Altınkaynak SOAP Web Servisi Entegrasyonu
"""
import logging
from typing import Dict, Any, Optional
from zeep import Client
from zeep.transports import Transport
from zeep.wsse.username import UsernameToken
import requests

logger = logging.getLogger(__name__)

# Altınkaynak SOAP Service WSDL URL
WSDL_URL = "https://data.altinkaynak.com/DataService.asmx?WSDL"

# Credentials
USERNAME = "AltinkaynakWebServis"
PASSWORD = "AltinkaynakWebServis"


class AltinkaynakService:
    """Altınkaynak SOAP web servisini çağıran servis sınıfı"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """SOAP client'ı başlat"""
        try:
            # Create transport with session for better performance
            session = requests.Session()
            transport = Transport(session=session)
            
            # Create SOAP client
            self.client = Client(WSDL_URL, transport=transport)
            
            logger.info("Altınkaynak SOAP client başarıyla başlatıldı")
        except Exception as e:
            logger.error(f"SOAP client başlatma hatası: {e}")
            raise
    
    def get_main_data(self) -> Optional[Dict[str, Any]]:
        """
        GetMain metodunu çağırarak anlık döviz kuru, altın kuru ve parite bilgilerini alır.
        
        Returns:
            Dict containing currency rates, gold prices, and parity information
            None if error occurs
        """
        try:
            print("=" * 60)
            print("💰 Altınkaynak SOAP Servisi - GetMain çağrılıyor...")
            print("=" * 60)
            
            if not self.client:
                print("🔄 SOAP client başlatılıyor...")
                self._initialize_client()
            
            # Try multiple approaches to set the AuthHeader
            auth_ns = 'http://data.altinkaynak.com/'
            response = None
            
            # Approach 1: Try to get AuthHeader element and create header
            try:
                print("🔹 Approach 1 deneniyor...")
                auth_header_element = self.client.get_element(f'{{{auth_ns}}}AuthHeader')
                auth_header = auth_header_element(Username=USERNAME, Password=PASSWORD)
                response = self.client.service.GetMain(_soapheaders=[auth_header])
                print("✅ GetMain başarıyla çağrıldı (Approach 1)")
                logger.info("GetMain başarıyla çağrıldı (Approach 1)")
            except Exception as e1:
                print(f"⚠️ Approach 1 başarısız: {str(e1)[:100]}")
                logger.debug(f"Approach 1 başarısız: {e1}")
                
                # Approach 2: Try with service bind
                try:
                    print("🔹 Approach 2 deneniyor...")
                    raw_response = self._try_alternative_call()
                    if raw_response is not None:
                        response = raw_response
                        print("✅ GetMain başarıyla çağrıldı (Approach 2)")
                        logger.info("GetMain başarıyla çağrıldı (Approach 2)")
                except Exception as e2:
                    print(f"⚠️ Approach 2 başarısız: {str(e2)[:100]}")
                    logger.debug(f"Approach 2 başarısız: {e2}")
                    
                    # Approach 3: Try with simple dict header
                    try:
                        print("🔹 Approach 3 deneniyor...")
                        auth_header_dict = {
                            'AuthHeader': {
                                'Username': USERNAME,
                                'Password': PASSWORD
                            }
                        }
                        response = self.client.service.GetMain(_soapheaders=[auth_header_dict])
                        print("✅ GetMain başarıyla çağrıldı (Approach 3)")
                        logger.info("GetMain başarıyla çağrıldı (Approach 3)")
                    except Exception as e3:
                        print(f"⚠️ Approach 3 başarısız: {str(e3)[:100]}")
                        logger.debug(f"Approach 3 başarısız: {e3}")
                        
                        # Approach 4: Try without header (if service allows)
                        try:
                            print("🔹 Approach 4 deneniyor (header olmadan)...")
                            response = self.client.service.GetMain()
                            print("✅ GetMain başarıyla çağrıldı (Approach 4 - no header)")
                            logger.info("GetMain başarıyla çağrıldı (Approach 4 - no header)")
                        except Exception as e4:
                            print(f"❌ Tüm yaklaşımlar başarısız. Son hata: {e4}")
                            logger.error(f"Tüm yaklaşımlar başarısız. Son hata: {e4}")
                            raise
            
            if response is None:
                print("❌ GetMain çağrısı None döndü")
                logger.error("GetMain çağrısı None döndü")
                return None
            
            # Parse the XML response
            print("📊 XML response parse ediliyor...")
            result = self._parse_response(response)
            print(f"✅ Parse başarılı. Döviz kurları: {len(result.get('currencies', {}))} adet")
            print(f"✅ Altın fiyatları: {len(result.get('gold', {}))} adet")
            print("=" * 60)
            return result
            
        except Exception as e:
            print(f"❌ GetMain çağrısı sırasında genel hata: {e}")
            print("=" * 60)
            logger.error(f"GetMain çağrısı sırasında genel hata: {e}")
            return None
    
    def _try_alternative_call(self) -> Optional[Dict[str, Any]]:
        """Alternative approach using raw SOAP headers"""
        try:
            # Try using service bind
            namespace = 'http://data.altinkaynak.com/'
            binding_name = 'DataServiceSoap'
            
            # Get the service binding
            service = self.client.bind(namespace, binding_name)
            
            # Try to get AuthHeader type
            try:
                auth_header_type = self.client.get_type(f'ns0:AuthHeader', namespace)
                auth_header = auth_header_type(Username=USERNAME, Password=PASSWORD)
                response = service.GetMain(_soapheaders=[auth_header])
            except:
                # Fallback: try with dict
                auth_header = {
                    'Username': USERNAME,
                    'Password': PASSWORD
                }
                response = service.GetMain(_soapheaders=[{'AuthHeader': auth_header}])
            
            # Return raw response to be parsed by caller
            return response
        except Exception as e:
            logger.error(f"Alternatif çağrı hatası: {e}")
            # Last resort: try without explicit header, let zeep handle it
            try:
                response = self.client.service.GetMain()
                return response  # Return raw response
            except Exception as e2:
                logger.error(f"Son deneme de başarısız: {e2}")
                raise
    
    def _parse_response(self, xml_response) -> Dict[str, Any]:
        """
        SOAP servisinden dönen XML string'i parse eder.
        
        Args:
            xml_response: SOAP servisinden dönen response (string veya object)
            
        Returns:
            Parsed data dictionary
        """
        import xml.etree.ElementTree as ET
        from datetime import datetime
        
        result = {
            'currencies': {},
            'gold': {},
            'parities': {},
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            xml_str = None
            
            # Handle different response types
            if isinstance(xml_response, str):
                xml_str = xml_response
            elif hasattr(xml_response, '__dict__'):
                # If it's an object, try to serialize
                xml_str = str(xml_response)
            else:
                xml_str = str(xml_response)
            
            # Try to parse as XML
            try:
                root = ET.fromstring(xml_str)
            except ET.ParseError:
                # If not valid XML, try to find XML content in string
                import re
                xml_match = re.search(r'<[^>]+>.*</[^>]+>', xml_str, re.DOTALL)
                if xml_match:
                    root = ET.fromstring(xml_match.group())
                else:
                    raise
            
            # Parse XML based on Altınkaynak's response structure
            # The actual structure will need to be determined by testing
            
            # Common currency codes to look for
            currency_codes = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'RUB']
            
            # Iterate through all elements
            for elem in root.iter():
                tag_name = elem.tag
                # Remove namespace if present
                if '}' in tag_name:
                    tag_name = tag_name.split('}')[1]
                
                tag_lower = tag_name.lower()
                
                # Check if it's a currency code
                if tag_name.upper() in currency_codes:
                    # Try to extract buy/sell/rate values
                    buy_val = None
                    sell_val = None
                    rate_val = None
                    
                    # Check attributes first
                    if elem.attrib:
                        buy_val = elem.attrib.get('buy') or elem.attrib.get('Buy') or elem.attrib.get('ALIS')
                        sell_val = elem.attrib.get('sell') or elem.attrib.get('Sell') or elem.attrib.get('SATIS')
                        rate_val = elem.attrib.get('rate') or elem.attrib.get('Rate') or elem.attrib.get('KUR')
                    
                    # If not in attributes, check text content
                    if not buy_val and not sell_val and not rate_val:
                        try:
                            text_val = float(elem.text) if elem.text else 0
                            rate_val = text_val
                        except:
                            pass
                    
                    result['currencies'][tag_name.upper()] = {
                        'buy': float(buy_val) if buy_val else None,
                        'sell': float(sell_val) if sell_val else None,
                        'rate': float(rate_val) if rate_val else None,
                    }
                
                # Check for gold prices
                gold_types = ['altin', 'gold', 'gram', 'ceyrek', 'yarim', 'tam', 'ata', 'cumhuriyet']
                if any(gold_type in tag_lower for gold_type in gold_types):
                    buy_val = elem.attrib.get('buy') or elem.attrib.get('Buy') or elem.attrib.get('ALIS')
                    sell_val = elem.attrib.get('sell') or elem.attrib.get('Sell') or elem.attrib.get('SATIS')
                    
                    if not buy_val and not sell_val and elem.text:
                        try:
                            rate_val = float(elem.text)
                            result['gold'][tag_lower] = {
                                'buy': rate_val,
                                'sell': rate_val,
                            }
                        except:
                            pass
                    else:
                        result['gold'][tag_lower] = {
                            'buy': float(buy_val) if buy_val else None,
                            'sell': float(sell_val) if sell_val else None,
                        }
            
            return result
            
        except Exception as e:
            logger.error(f"XML parse hatası: {e}")
            # Return raw response if parsing fails - useful for debugging
            logger.debug(f"Raw response: {xml_response}")
            return {
                'currencies': {},
                'gold': {},
                'parities': {},
                'timestamp': datetime.now().isoformat(),
                'raw_response': str(xml_response)[:500],  # Limit length
                'error': str(e)
            }
    
    def get_formatted_rates(self) -> Optional[Dict[str, Any]]:
        """
        GetMain verilerini formatlanmış şekilde döndürür.
        Frontend'de kullanım için uygun formatta.
        """
        data = self.get_main_data()
        
        if not data:
            return None
        
        # Format the data for frontend consumption
        formatted = {
            'exchange_rates': {},
            'gold_prices': {},
            'parities': {},
            'last_updated': data.get('timestamp')
        }
        
        # Format currencies (convert to TRY base if needed)
        for code, rates in data.get('currencies', {}).items():
            formatted['exchange_rates'][code] = {
                'code': code,
                'name': self._get_currency_name(code),
                'rate': rates.get('rate', rates.get('buy', 0)),
                'buy': rates.get('buy', 0),
                'sell': rates.get('sell', 0),
                'change': 0  # Will be calculated if historical data available
            }
        
        # Format gold prices
        for gold_type, prices in data.get('gold', {}).items():
            formatted['gold_prices'][gold_type] = {
                'type': gold_type,
                'buy': prices.get('buy', 0),
                'sell': prices.get('sell', 0),
            }
        
        return formatted
    
    @staticmethod
    def _get_currency_name(code: str) -> str:
        """Currency code'dan isim döndür"""
        names = {
            'USD': 'US Dollar',
            'EUR': 'Euro',
            'GBP': 'British Pound',
            'JPY': 'Japanese Yen',
            'CHF': 'Swiss Franc',
            'TRY': 'Turkish Lira',
        }
        return names.get(code, code)


# Singleton instance
_altinkaynak_service = None

def get_altinkaynak_service() -> AltinkaynakService:
    """Altınkaynak servisinin singleton instance'ını döndür"""
    global _altinkaynak_service
    if _altinkaynak_service is None:
        _altinkaynak_service = AltinkaynakService()
    return _altinkaynak_service

