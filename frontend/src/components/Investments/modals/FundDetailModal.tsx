import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, DollarSign, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { fundsAPI } from '../../../services/apiService';

interface FundDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    fundCode: string;
    fundName: string;
}

interface FundDetailData {
    code: string;
    title: string;
    topList: Array<{ key: string; value: string }>;
    priceIndicators: Array<{ key: string; value: string }>;
    lineValues: Array<{ date: string; value: number; order: number }>;
}

/** API returns Turkish keys; keep literals for matching. */
const LAST_PRICE_API_KEY = 'Son Fiyat (TL)';
const DAILY_RETURN_API_KEY = 'Günlük Getiri (%)';

const FundDetailModal: React.FC<FundDetailModalProps> = ({
    isOpen,
    onClose,
    fundCode,
    fundName
}) => {
    const { t } = useTranslation('investments');
    const [loading, setLoading] = useState<boolean>(false);
    const [fundDetail, setFundDetail] = useState<FundDetailData | null>(null);
    const [quota, setQuota] = useState<{ remaining: number; request_count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal açıldığında cache'de veri varsa göster, yoksa butona basmayı bekle
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setLoading(false);

            // Modal açıldığında quota bilgisini al
            loadQuotaInfo();

            // Cache'de bugünün verisi var mı kontrol et
            checkAndLoadCachedData();
        } else {
            // Modal kapandığında state'i sıfırla
            setFundDetail(null);
        }
    }, [isOpen, fundCode]);

    const checkAndLoadCachedData = async () => {
        if (!isOpen || !fundCode) return;

        try {
            // Önce cache'de bugünün verisi var mı kontrol et
            const today = new Date().toISOString().split('T')[0];
            const priceCheckResponse = await fundsAPI.checkFundPrice(fundCode, today);
            
            // Eğer cache'de bugünün verisi varsa, detay bilgisini de cache'den yükle
            if (priceCheckResponse.success && priceCheckResponse.has_price) {
                setLoading(true);
                try {
                    const detailResponse = await fundsAPI.getFundDetail(fundCode, today);
                    
                    if (detailResponse.success && detailResponse.data) {
                        const data = detailResponse.data.data || detailResponse.data;
                        
                        setFundDetail({
                            code: data.code || fundCode,
                            title: data.title || fundName,
                            topList: data.topList || [],
                            priceIndicators: data.priceIndicators || [],
                            lineValues: data.lineValues || []
                        });

                        if (detailResponse.quota) {
                            setQuota(detailResponse.quota);
                        }
                    }
                } catch (err) {
                    // Cache'den yükleme hatası, butona basmayı bekle
                    console.log('Cache\'den veri yüklenemedi, butona basmayı bekliyor');
                } finally {
                    setLoading(false);
                }
            }
            // Cache'de veri yoksa, butona basmayı bekle (hiçbir şey yapma)
        } catch (error) {
            // Hata durumunda butona basmayı bekle
            console.log('Cache kontrolü yapılamadı, butona basmayı bekliyor');
        }
    };

    const loadQuotaInfo = async () => {
        try {
            const quotaResponse = await fundsAPI.getFundQuota();
            if (quotaResponse.success && quotaResponse.quota) {
                setQuota(quotaResponse.quota);
            }
        } catch (error) {
            console.error('Quota bilgisi alınamadı:', error);
        }
    };

    const loadFundDetail = async (targetDate?: string) => {
        if (!isOpen) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fundsAPI.getFundDetail(fundCode, targetDate);

            if (response.success && response.data) {
                const data = response.data.data || response.data;

                setFundDetail({
                    code: data.code || fundCode,
                    title: data.title || fundName,
                    topList: data.topList || [],
                    priceIndicators: data.priceIndicators || [],
                    lineValues: data.lineValues || []
                });

                if (response.quota) {
                    setQuota(response.quota);
                }
            } else {
                setError(response.error || t('fundDetail.errorFetch'));
            }
        } catch (err: any) {
            console.error('Fon detay yüklenirken hata:', err);
            setError(err.message || t('fundDetail.errorLoad'));

            // Quota bilgisini al (hata olsa bile)
            if (err.response?.data?.quota) {
                setQuota(err.response.data.quota);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShowData = async () => {
        // Fon detayını yükle (quota bilgisi zaten modal açıldığında yüklenmiş)
        loadFundDetail();
    };

    const getTopListValue = (key: string): string => {
        if (!fundDetail?.topList) return '';
        const item = fundDetail.topList.find(item => item.key === key);
        return item?.value || '';
    };


    const openOfficialSite = () => {
        window.open(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`, '_blank');
    };

    const canShowData = quota ? quota.remaining > 0 : true;

    if (!isOpen) return null;

    return (
        <ModalPortal>
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('fundDetail.title')}
                        </h2>
                        <div>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{fundCode}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{fundName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Quota Bilgisi */}
                {quota && (
                    <div className={`mb-4 p-3 rounded-lg ${quota.remaining > 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className={`w-5 h-5 ${quota.remaining > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                                        }`} />
                                    <span className={`font-medium ${quota.remaining > 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'
                                        }`}>
                                        {t('fundDetail.quotaTitle', { used: quota.request_count })}
                                    </span>
                                </div>
                                <span className={`text-sm font-semibold ${quota.remaining > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                                    }`}>
                                    {t('fundDetail.remaining', { count: quota.remaining })}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('fundDetail.quotaNote')}
                                    </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Butonlar */}
                <div className="flex items-center space-x-3 mb-6">
                    <button
                        onClick={handleShowData}
                        disabled={!canShowData || loading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${canShowData && !loading
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        title={!canShowData ? t('fundDetail.titleTooltipLimit') : t('fundDetail.titleTooltipShow')}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t('fundDetail.loading')}</span>
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4" />
                                <span>{t('fundDetail.showData')}</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={openOfficialSite}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>{t('fundDetail.officialSite')}</span>
                    </button>
                </div>

                {/* Hata Mesajı */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Fon Detay Bilgileri */}
                {fundDetail && (
                    <div className="space-y-6">
                        {/* Son Fiyat ve Günlük Getiri */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('fundDetail.lastPrice')}</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {getTopListValue(LAST_PRICE_API_KEY) || t('fundDetail.na')}
                                </p>
                            </div>
                            <div className={`p-4 bg-gradient-to-br rounded-lg border ${getTopListValue(DAILY_RETURN_API_KEY).includes('-')
                                ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
                                : 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                                }`}>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('fundDetail.dailyReturn')}</p>
                                <div className="flex items-center space-x-2">
                                    {getTopListValue(DAILY_RETURN_API_KEY).includes('-') ? (
                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    ) : (
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    )}
                                    <p className={`text-2xl font-bold ${getTopListValue(DAILY_RETURN_API_KEY).includes('-')
                                        ? 'text-red-900 dark:text-red-100'
                                        : 'text-green-900 dark:text-green-100'
                                        }`}>
                                        {getTopListValue(DAILY_RETURN_API_KEY) || t('fundDetail.na')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Diğer Bilgiler */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {fundDetail.topList
                                .filter(item => ![LAST_PRICE_API_KEY, DAILY_RETURN_API_KEY].includes(item.key))
                                .map((item, index) => (
                                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{item.key}</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                        </div>

                        {/* Getiri Göstergeleri */}
                        {fundDetail.priceIndicators && fundDetail.priceIndicators.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('fundDetail.returnIndicators')}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {fundDetail.priceIndicators.map((indicator, index) => (
                                        <div key={index} className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{indicator.key}</p>
                                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">{indicator.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                )}
            </div>
        </div>
        </ModalPortal>
    );
};

export default FundDetailModal;

